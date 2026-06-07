"""Dialect polishing endpoint: /polish with chunk streaming helpers."""

import asyncio
import json
import logging
import re
import random
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config import (
    MISTRAL_API_KEY,
    MISTRAL_MODELS,
    OLLAMA_MODEL_FAMILIES,
    OLLAMA_MODELS,
    OLLAMA_URL,
    _polishing_semaphore,
    get_mistral_client,
)
from polishing import (
    CLEANUP_PROMPT,
    DIALECT_RETENTION_PROMPT,
    SYSTEM_PROMPT,
    SYSTEM_PROMPTS,
    PolishingOutput,
    build_polishing_prompt,
    parse_polishing_output,
)
from dialects import get_dialect_config
from models import PolishingRequest

router = APIRouter()


# --- Helper functions ---


def parse_retry_after(response_or_headers) -> int:
    """Parse Retry-After header from response or exception. Returns seconds to wait.
    Supports integer seconds format and HTTP-date (RFC 1123) format.
    Falls back to 3 seconds if header missing or unparseable."""
    header = ""
    if hasattr(response_or_headers, "headers"):
        header = response_or_headers.headers.get("Retry-After", "")
    elif isinstance(response_or_headers, dict):
        header = response_or_headers.get("Retry-After", "")
    elif isinstance(response_or_headers, str):
        header = response_or_headers

    if not header:
        return 3  # Default fallback

    # Try parsing as integer (seconds)
    try:
        return max(1, int(header))
    except ValueError:
        pass

    # Parse as HTTP-date (RFC 1123 format: "Sun, 06 Nov 1994 08:49:37 GMT")
    try:
        retry_date = datetime.strptime(header, "%a, %d %b %Y %H:%M:%S GMT").replace(tzinfo=timezone.utc)
        delta = (retry_date - datetime.now(timezone.utc)).total_seconds()
        return max(1, int(delta))
    except ValueError:
        return 3  # Fallback if parsing fails


def _build_ollama_prompt(chunk: str, detected_lang: str, full_context: str | None = None) -> str:
    """Build the prompt for Ollama polishing."""
    if full_context and full_context != chunk:
        return (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"POLIJST DIT FRAGMENT:\n{chunk}"
        )
    return f"[Taal: {detected_lang}]\n\n{chunk}"


async def polish_chunk_stream(
    client: httpx.AsyncClient,
    chunk: str,
    detected_lang: str,
    ollama_model: str,
    full_context: str | None = None,
    temperature: float = 0.5,
    system_prompt: str = SYSTEM_PROMPT,
    json_schema: dict | None = None,
):
    """Stream tokens from Ollama for a single chunk. Yields token strings."""
    word_count = len(chunk.split())
    num_predict = max(512, int(word_count * 2))
    prompt = _build_ollama_prompt(chunk, detected_lang, full_context)

    request_json = {
        "model": ollama_model,
        "prompt": prompt,
        "system": system_prompt,
        "stream": True,
        "options": {"num_predict": num_predict, "temperature": temperature},
    }
    if json_schema:
        request_json["format"] = json_schema

    async with client.stream(
        "POST",
        OLLAMA_URL,
        json=request_json,
    ) as resp:
        resp.raise_for_status()
        async for line in resp.aiter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
                token = data.get("response", "")
                if token:
                    yield token
            except json.JSONDecodeError:
                continue


def _build_mistral_prompt(chunk: str, detected_lang: str, full_context: str | None = None) -> str:
    """Build the user prompt for Mistral polishing."""
    if full_context and full_context != chunk:
        return (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"POLIJST DIT FRAGMENT:\n{chunk}"
        )
    return f"[Taal: {detected_lang}]\n\n{chunk}"


async def polish_chunk_mistral_stream(
    chunk: str,
    detected_lang: str,
    mistral_model: str,
    full_context: str | None = None,
    temperature: float = 0.5,
    system_prompt: str = SYSTEM_PROMPT,
):
    """Stream tokens from Mistral API for a single chunk. Yields token strings.
    Retry logic: max 5 attempts, exponential backoff with jitter, Retry-After header parsing.
    Per RL-04: tenacity-patterned retry (manual loop because tenacity doesn't support async generators)."""
    client = get_mistral_client()
    if client is None:
        raise RuntimeError("Mistral API key not configured")

    user_prompt = _build_mistral_prompt(chunk, detected_lang, full_context)
    word_count = len(chunk.split())
    max_tokens = max(512, int(word_count * 2))

    max_attempts = 5  # Per RL-04: max 5 attempts
    for attempt in range(max_attempts):
        try:
            stream_response = await asyncio.to_thread(
                client.chat.stream,
                model=mistral_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            for event in stream_response:
                token = event.data.choices[0].delta.content
                if token:
                    yield token
            return  # Success -- exit retry loop

        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "rate" in error_str.lower()
            is_server_error = any(code in error_str for code in ["500", "502", "503"])
            is_retryable = is_rate_limit or is_server_error

            if is_retryable and attempt < max_attempts - 1:
                if is_rate_limit:
                    # Try to extract Retry-After from exception attributes
                    retry_after = 3
                    if hasattr(e, "response") and hasattr(e.response, "headers"):
                        retry_after = parse_retry_after(e.response)
                    # Exponential backoff with jitter: min(retry_after, 1 * 2^attempt) + jitter
                    backoff = min(30, 1 * (2**attempt)) + random.uniform(0, 2)
                    wait = max(backoff, retry_after)
                else:
                    wait = min(30, 1 * (2**attempt)) + random.uniform(0, 2)

                logger.warning("Retrying in %.1fs (attempt %d/%d): %s", wait, attempt + 1, max_attempts, error_str[:80])
                await asyncio.sleep(wait)
            else:
                raise


def split_into_chunks(text: str, max_words: int = 400, overlap_words: int = 75) -> list[str]:
    """Split text into chunks at sentence boundaries, each <= max_words.

    When overlap_words > 0, the last sentences of each chunk (up to overlap_words)
    are prepended to the next chunk for context preservation (FEED-03).
    """
    sentences = re.split(r"(?<=[.!?…])\s+", text.strip())
    # Build list of (sentence, word_count) tuples
    sent_data: list[tuple[str, int]] = []
    for s in sentences:
        s = s.strip()
        if s:
            sent_data.append((s, len(s.split())))

    if not sent_data:
        return [text]

    chunks: list[str] = []
    current: list[tuple[str, int]] = []
    current_len = 0

    for sent, wc in sent_data:
        if current and current_len + wc > max_words:
            chunks.append(" ".join(s for s, _ in current))
            # Carry overlap: take last sentences up to overlap_words
            if overlap_words > 0:
                overlap: list[tuple[str, int]] = []
                overlap_len = 0
                for s, w in reversed(current):
                    if overlap_len + w > overlap_words:
                        break
                    overlap.insert(0, (s, w))
                    overlap_len += w
                current = list(overlap)
                current_len = overlap_len
            else:
                current = []
                current_len = 0
            current.append((sent, wc))
            current_len += wc
        else:
            current.append((sent, wc))
            current_len += wc

    if current:
        chunks.append(" ".join(s for s, _ in current))
    return chunks if chunks else [text]


# --- Endpoint ---


@router.post("/polish")
async def polish(req: PolishingRequest):
    """Step 2: Dialect polishing via Ollama (local) or Mistral (API) -- streams tokens as SSE."""
    if not req.text:
        return {"polished": ""}

    # Resolve model family for Ollama
    family_models = OLLAMA_MODEL_FAMILIES.get(req.model_family, OLLAMA_MODELS)

    dialect_config = get_dialect_config(req.region)
    if req.language == "li":
        system_prompt, json_instr = build_polishing_prompt(req.region, req.report_length)
    else:
        system_prompt = SYSTEM_PROMPTS.get(req.report_length, SYSTEM_PROMPTS["samenvatting"])
        json_instr = ""

    chunks = split_into_chunks(req.text, max_words=400)
    # Only send full context for small texts (<=5 chunks); for large texts it wastes tokens
    full_context = req.text if 1 < len(chunks) <= 5 else None
    text_to_process = req.text

    if req.mode == "api" and not MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="Mistral API key not configured")

    async def generate():
        try:
            nonlocal text_to_process

            # Pre-check: verify Ollama model exists and is loadable
            if req.mode != "api":
                ollama_model = family_models.get(req.quality, family_models["light"])
                try:
                    async with httpx.AsyncClient(timeout=30.0) as check_client:
                        tags_resp = await check_client.get("http://localhost:11434/api/tags")
                        if tags_resp.status_code == 200:
                            available = [m["name"] for m in tags_resp.json().get("models", [])]
                            # Build candidate list: requested model first, then fallbacks heavy→light
                            candidates = [ollama_model]
                            for q in ("heavy", "medium", "light"):
                                c = family_models.get(q, "")
                                if c and c not in candidates:
                                    candidates.append(c)

                            # Find first model that is installed AND loadable
                            chosen = None
                            for candidate in candidates:
                                if candidate not in available:
                                    continue
                                # Quick generate test to verify model can actually load
                                try:
                                    test_resp = await check_client.post(
                                        OLLAMA_URL,
                                        json={"model": candidate, "prompt": "test", "stream": False, "options": {"num_predict": 1}},
                                    )
                                    if test_resp.status_code == 200:
                                        chosen = candidate
                                        break
                                    else:
                                        error_data = test_resp.json() if test_resp.headers.get("content-type", "").startswith("application/json") else {}
                                        error_msg = error_data.get("error", "")
                                        logger.warning("Model %s installed but not loadable: %s", candidate, error_msg)
                                except Exception as e:
                                    logger.warning("Model %s test failed: %s", candidate, e)

                            if chosen:
                                if chosen != ollama_model:
                                    logger.info("Model %s not usable, falling back to %s", ollama_model, chosen)
                                ollama_model = chosen
                            else:
                                yield f"data: {json.dumps({'type': 'error', 'error_type': 'ollama_model_missing', 'message': 'Geen bruikbaar taalmodel gevonden. Mogelijk onvoldoende geheugen. Probeer een kleiner model via de installatiewizard.'})}\n\n"
                                return
                        else:
                            yield f"data: {json.dumps({'type': 'error', 'error_type': 'ollama_unavailable', 'message': 'Ollama reageert niet. Is de app gestart?'})}\n\n"
                            return
                except (httpx.ConnectError, httpx.NetworkError):
                    yield f"data: {json.dumps({'type': 'error', 'error_type': 'ollama_unavailable', 'message': 'Ollama is niet bereikbaar. Start de Ollama app.'})}\n\n"
                    return

            # PHASE 3: Two-step polishing for Limburgish
            if req.language == "li":
                logger.info("Starting cleanup pass for Limburgish (%d chunks)", len(chunks))
                cleaned_chunks = []
                async with httpx.AsyncClient(timeout=600.0) as client:
                    for i, chunk in enumerate(chunks):
                        logger.debug("Cleaning chunk %d/%d", i + 1, len(chunks))
                        chunk_tokens = []
                        async with _polishing_semaphore:
                            if req.mode == "api":
                                mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
                                async for token in polish_chunk_mistral_stream(
                                    chunk, req.language, mistral_model, None, req.temperature, CLEANUP_PROMPT
                                ):
                                    chunk_tokens.append(token)
                            else:
                                async for token in polish_chunk_stream(
                                    client, chunk, req.language, ollama_model, None, req.temperature, CLEANUP_PROMPT
                                ):
                                    chunk_tokens.append(token)
                        cleaned_chunks.append("".join(chunk_tokens))

                text_to_process = " ".join(cleaned_chunks)
                logger.info("Cleanup pass complete")
                # Re-split cleaned text for the final formatting pass
                final_chunks = split_into_chunks(text_to_process, max_words=400)
            else:
                final_chunks = chunks

            # Adjust system prompt if keep_dialect is True
            final_system_prompt = system_prompt
            if req.keep_dialect and req.language == "li":
                final_system_prompt = DIALECT_RETENTION_PROMPT
                # Append information about length to the retention prompt if needed
                if req.report_length == "uitgebreid":
                    final_system_prompt += "\nMaak er een UITGEBREID VERSLAG van met alinea's en kopjes."

            # JSON mode: accumulate tokens, parse JSON, emit polished text
            # Disabled for keep_dialect (raw dialect text output)
            use_json = bool(json_instr) and not req.keep_dialect

            if req.mode == "api":
                mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
                logger.info("Streaming final pass via Mistral %s", mistral_model)

                for i, chunk in enumerate(final_chunks):
                    chunk_input = f"{chunk}\n\n{json_instr}" if use_json else chunk
                    chunk_tokens: list[str] = []
                    async with _polishing_semaphore:
                        async for token in polish_chunk_mistral_stream(
                            chunk_input, req.language, mistral_model, full_context, req.temperature, final_system_prompt
                        ):
                            if use_json:
                                chunk_tokens.append(token)
                            else:
                                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
                    if use_json and chunk_tokens:
                        accumulated = "".join(chunk_tokens)
                        validated = parse_polishing_output(accumulated, chunk)
                        yield f"data: {json.dumps({'type': 'token', 'text': validated.polished})}\n\n"
            else:
                logger.info("Streaming final pass via Ollama %s", ollama_model)
                json_schema = PolishingOutput.model_json_schema() if use_json else None

                async with httpx.AsyncClient(timeout=600.0) as client:
                    for i, chunk in enumerate(final_chunks):
                        chunk_input = f"{chunk}\n\n{json_instr}" if use_json else chunk
                        chunk_tokens: list[str] = []
                        async with _polishing_semaphore:
                            async for token in polish_chunk_stream(
                                client,
                                chunk_input,
                                req.language,
                                ollama_model,
                                full_context,
                                req.temperature,
                                final_system_prompt,
                                json_schema=json_schema,
                            ):
                                if use_json:
                                    chunk_tokens.append(token)
                                else:
                                    yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
                        if use_json and chunk_tokens:
                            accumulated = "".join(chunk_tokens)
                            validated = parse_polishing_output(accumulated, chunk)
                            yield f"data: {json.dumps({'type': 'token', 'text': validated.polished})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.exception("Polishing streaming failed")
            error_str = str(e)

            # Classify error type per EH-01 taxonomy
            if "429" in error_str or "rate" in error_str.lower():
                retry_after = 3
                if hasattr(e, "response") and hasattr(e.response, "headers"):
                    retry_after = parse_retry_after(e.response)
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'rate_limit', 'retry_after': retry_after})}\n\n"
            elif "memory" in error_str.lower() or "500" in error_str:
                # Ollama out-of-memory or internal error
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'ollama_unavailable', 'message': 'Onvoldoende geheugen voor dit model. Probeer een kleiner model of sluit andere apps.'})}\n\n"
            elif any(code in error_str for code in ["502", "503"]):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'upstream_disconnect'})}\n\n"
            elif "timeout" in error_str.lower() or isinstance(e, asyncio.TimeoutError):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'timeout'})}\n\n"
            elif isinstance(e, (httpx.ConnectError, httpx.NetworkError, ConnectionError)):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'network_error'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'server_error'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
