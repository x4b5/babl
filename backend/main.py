import asyncio
import json
import re
import tempfile
import os
import traceback
import subprocess
from datetime import datetime, timezone
import random

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import mlx_whisper
import httpx
from dialects import (
    REGIONAL_PROFILES,
    get_dialect_config,
    DIALECT_TRANSLATION_KEY
)
from hallucination import process_transcription
from correction import (
    SYSTEM_PROMPTS,
    SYSTEM_PROMPT,
    DIALECT_RETENTION_PROMPT,
    CLEANUP_PROMPT,
    build_correction_prompt,
    parse_correction_output,
    CorrectionOutput,
    JSON_INSTRUCTION
)

# Allow large uploads (500 MB covers ~2+ hours of compressed audio)
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

# Max parallel Ollama requests (avoid overloading CPU/GPU)
MAX_PARALLEL_CORRECTIONS = 3

# WebSocket heartbeat configuration
HEARTBEAT_INTERVAL = 15  # Send ping every 15 seconds
HEARTBEAT_TIMEOUT = 30   # Close if no pong within 30 seconds

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODELS = {
    "light": "gemma3:1b",
    "medium": "gemma3:4b",
    "heavy": "gemma3:12b",
}

ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY", "")

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_MODELS = {
    "light": "mistral-small-latest",
    "medium": "mistral-small-latest",
    "heavy": "mistral-large-latest",
}

# Lazy-initialized Mistral client
_mistral_client = None


def get_mistral_client():
    global _mistral_client
    if _mistral_client is None and MISTRAL_API_KEY:
        from mistralai.client import Mistral
        _mistral_client = Mistral(api_key=MISTRAL_API_KEY)
    return _mistral_client


async def warmup_ollama():
    """Send a tiny request to each Ollama model so they're loaded in memory."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        for name, model in OLLAMA_MODELS.items():
            try:
                print(f"Warming up Ollama model: {model}...")
                await client.post(
                    OLLAMA_URL,
                    json={"model": model, "prompt": "hallo", "stream": False, "options": {"num_predict": 1}},
                )
                print(f"  {model} ready.")
            except Exception as e:
                print(f"  {model} warmup failed (will load on first request): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up Ollama models in background
    asyncio.create_task(warmup_ollama())
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# mlx-whisper model path — runs on Apple Silicon GPU via MLX
WHISPER_MODEL_PATH = "mlx-community/whisper-large-v3-mlx"

# The DIALECT_INITIAL_PROMPT is now pre-composed in dialects.py

# Offset filtering tolerance (OF-01)
OFFSET_TOLERANCE = 0.5  # seconds: tolerance window for boundary segments

def filter_segments_by_offset(segments: list[dict], offset: float, tolerance: float = OFFSET_TOLERANCE) -> list[dict]:
    """Filter segments by offset. Keeps segments relevant to current chunk.

    Args:
        segments: List of {"start": float, "end": float, "text": str}
        offset: Seconds of audio already processed
        tolerance: Seconds of tolerance for boundary segments

    Returns:
        Filtered list of segments
    """
    if offset <= 0:
        return segments
    # OF-01, OF-02: Use end time with tolerance window to capture boundary segments
    return [s for s in segments if s["end"] > offset - tolerance]


def get_audio_duration(path: str) -> float:
    """Get duration of audio file in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return float(result.stdout.strip())
    except Exception:
        return 0.0

def extract_audio_segment(input_path: str, output_path: str, start: float, duration: float):
    """Extract and transcode a segment of audio using ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-ss", str(start), "-i", input_path,
        "-t", str(duration),
        "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "whisper_model": "large-v3-mlx",
        "mistral_available": bool(MISTRAL_API_KEY),
        "assemblyai_available": bool(ASSEMBLYAI_API_KEY),
    }


@app.get("/health/setup")
async def health_setup():
    """Detailed setup status for the setup wizard. Checks Ollama and Whisper availability."""
    ollama_running = False
    ollama_models: dict[str, bool] = {model: False for model in OLLAMA_MODELS.values()}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            if resp.status_code == 200:
                ollama_running = True
                data = resp.json()
                available = {m.get("name", "") for m in data.get("models", [])}
                for model in OLLAMA_MODELS.values():
                    ollama_models[model] = model in available
    except Exception:
        pass

    whisper_available = False
    try:
        import importlib
        whisper_available = importlib.util.find_spec("mlx_whisper") is not None
    except Exception:
        pass

    return {
        "backend_running": True,
        "ollama_running": ollama_running,
        "ollama_models": ollama_models,
        "whisper_available": whisper_available,
    }


def parse_retry_after(response_or_headers) -> int:
    """Parse Retry-After header from response or exception. Returns seconds to wait.
    Supports integer seconds format and HTTP-date (RFC 1123) format.
    Falls back to 3 seconds if header missing or unparseable."""
    header = ""
    if hasattr(response_or_headers, 'headers'):
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
    """Build the prompt for Ollama correction."""
    if full_context and full_context != chunk:
        return (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"CORRIGEER DIT FRAGMENT:\n{chunk}"
        )
    return f"[Taal: {detected_lang}]\n\n{chunk}"


async def correct_chunk_stream(
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
    """Build the user prompt for Mistral correction."""
    if full_context and full_context != chunk:
        return (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"CORRIGEER DIT FRAGMENT:\n{chunk}"
        )
    return f"[Taal: {detected_lang}]\n\n{chunk}"


async def correct_chunk_mistral_stream(
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
            return  # Success — exit retry loop

        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "rate" in error_str.lower()
            is_server_error = any(code in error_str for code in ["500", "502", "503"])
            is_retryable = is_rate_limit or is_server_error

            if is_retryable and attempt < max_attempts - 1:
                if is_rate_limit:
                    # Try to extract Retry-After from exception attributes
                    retry_after = 3
                    if hasattr(e, 'response') and hasattr(e.response, 'headers'):
                        retry_after = parse_retry_after(e.response)
                    # Exponential backoff with jitter: min(retry_after, 1 * 2^attempt) + jitter
                    backoff = min(30, 1 * (2 ** attempt)) + random.uniform(0, 2)
                    wait = max(backoff, retry_after)
                else:
                    wait = min(30, 1 * (2 ** attempt)) + random.uniform(0, 2)

                print(f"  Retrying in {wait:.1f}s (attempt {attempt + 1}/{max_attempts}): {error_str[:80]}")
                await asyncio.sleep(wait)
            else:
                raise


def split_into_chunks(text: str, max_words: int = 400, overlap_words: int = 75) -> list[str]:
    """Split text into chunks at sentence boundaries, each ≤ max_words.

    When overlap_words > 0, the last sentences of each chunk (up to overlap_words)
    are prepended to the next chunk for context preservation (FEED-03).
    """
    sentences = re.split(r'(?<=[.!?…])\s+', text.strip())
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


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
):
    """Step 1: Whisper transcription — streams segments as SSE."""
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    dialect_config = get_dialect_config(region)

    # Map frontend lang to Whisper parameters
    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": dialect_config["initial_prompt"]},
        "en": {"language": "en", "initial_prompt": None},
    }[lang]

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"

    # Read and validate file before streaming
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    print(f"Received file: {file.filename}, size: {size_mb:.1f} MB, lang: {lang}")
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.0f} MB). Maximum is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(content)
    tmp_path = tmp.name
    tmp.close()

    async def generate():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def _transcribe_worker():
            try:
                duration = get_audio_duration(tmp_path)
                segment_duration = 30.0  # seconds
                
                print(f"Transcribing {duration:.2f}s audio in {segment_duration}s segments...")
                
                word_count = 0
                detected_lang = "nl"
                
                for start in range(0, int(duration), int(segment_duration)):
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as chunk_tmp:
                        chunk_path = chunk_tmp.name
                    
                    try:
                        extract_audio_segment(tmp_path, chunk_path, float(start), segment_duration)
                        
                        transcribe_kwargs = {
                            "path_or_hf_repo": WHISPER_MODEL_PATH,
                            "temperature": (0.0, 0.2, 0.4),
                        }
                        if lang_config["language"] is not None:
                            transcribe_kwargs["language"] = lang_config["language"]
                        if lang_config["initial_prompt"] is not None:
                            transcribe_kwargs["initial_prompt"] = lang_config["initial_prompt"]

                        result = mlx_whisper.transcribe(chunk_path, **transcribe_kwargs)
                        detected_lang = result.get("language", "nl")
                        
                        if start == 0:
                            loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'info', 'language': detected_lang})}\n\n")

                        for segment in result.get("segments", []):
                            text = segment.get("text", "").strip()
                            if text:
                                # Apply hallucination detection (TRANS-03)
                                try:
                                    hallucination_result = process_transcription(text)
                                    if hallucination_result["was_modified"]:
                                        print(f"[Hallucination] Detected {len(hallucination_result['hallucinations'])} hallucination(s) in segment, cleaned")
                                        text = hallucination_result["cleaned_text"]
                                except Exception as e:
                                    print(f"[Hallucination] Detection failed, using unfiltered text: {e}")

                                if text:  # Only send if text remains after cleaning
                                    word_count += len(text.split())
                                    loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'segment', 'text': text})}\n\n")
                    finally:
                        if os.path.exists(chunk_path):
                            os.unlink(chunk_path)

                print(f"Transcription length: {word_count} words")
                loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'done'})}\n\n")
            except Exception as e:
                traceback.print_exc()
                loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n")
            finally:
                os.unlink(tmp_path)
                loop.call_soon_threadsafe(queue.put_nowait, None)

        loop.run_in_executor(None, _transcribe_worker)
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/transcribe-live")
async def transcribe_live(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
    offset: float = Form(0.0),
):
    """Live transcription endpoint — returns JSON with segment timestamps.

    Args:
        offset: seconds of audio already processed. Segments starting before
                this offset are filtered out to avoid duplication.
    """
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    dialect_config = get_dialect_config(region)

    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": dialect_config["initial_prompt"]},
        "en": {"language": "en", "initial_prompt": None},
    }[lang]

    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    content = await file.read()
    if not content:
        return {"text": "", "language": "nl", "segments": []}

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(content)
    tmp_path = tmp.name
    tmp.close()

    try:
        transcribe_kwargs = {
            "path_or_hf_repo": WHISPER_MODEL_PATH,
        }
        if lang_config["language"] is not None:
            transcribe_kwargs["language"] = lang_config["language"]
        if lang_config["initial_prompt"] is not None:
            transcribe_kwargs["initial_prompt"] = lang_config["initial_prompt"]

        result = await asyncio.to_thread(mlx_whisper.transcribe, tmp_path, **transcribe_kwargs)
        detected_lang = result.get("language", "nl")

        # Return segments with timestamps so frontend can filter overlap
        segments = []
        for seg in result.get("segments", []):
            text = seg.get("text", "").strip()
            if text:
                segments.append({
                    "start": seg.get("start", 0.0),
                    "end": seg.get("end", 0.0),
                    "text": text,
                })

        # Filter segments: only keep those starting at or after the offset
        segments = filter_segments_by_offset(segments, offset)

        # Apply hallucination detection to each segment (TRANS-03)
        for seg in segments:
            try:
                hallucination_result = process_transcription(seg["text"])
                if hallucination_result["was_modified"]:
                    print(f"[Hallucination] Live segment cleaned")
                    seg["text"] = hallucination_result["cleaned_text"]
            except Exception as e:
                print(f"[Hallucination] Detection failed for segment, using unfiltered: {e}")

        full_text = " ".join(s["text"] for s in segments)
        return {"text": full_text, "language": detected_lang, "segments": segments}
    except Exception as e:
        print(f"Live transcription error: {e}")
        traceback.print_exc()
        return {"text": "", "language": "nl", "segments": []}
    finally:
        os.unlink(tmp_path)


@app.post("/transcribe-api")
async def transcribe_api(
    file: UploadFile = File(...),
    lang: str = Form("auto"),
    region: str = Form("limburgs"),
):
    """Step 1 (API): AssemblyAI transcription with speaker diarization — streams segments as SSE."""
    if not ASSEMBLYAI_API_KEY:
        raise HTTPException(status_code=400, detail="AssemblyAI API key not configured")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    print(f"[AssemblyAI] Received file: {file.filename}, size: {size_mb:.1f} MB, lang: {lang}")
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.0f} MB). Maximum is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(content)
    tmp_path = tmp.name
    tmp.close()

    async def generate():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def _assemblyai_worker():
            try:
                import assemblyai as aai
                aai.settings.api_key = ASSEMBLYAI_API_KEY

                config_kwargs = {
                    "speaker_labels": True,
                    "language_detection": lang == "auto",
                    "speech_models": ["universal-3-pro", "universal-2"],
                }
                if lang != "auto":
                    lang_map = {"nl": "nl", "li": "nl", "en": "en"}
                    config_kwargs["language_code"] = lang_map.get(lang, "nl")
                    if lang == "li":
                        dialect_config = get_dialect_config(region)
                        config_kwargs["word_boost"] = dialect_config["word_boost"]
                        config_kwargs["boost_param"] = "high"
                        config_kwargs["custom_spelling"] = dialect_config["custom_spelling"]

                config = aai.TranscriptionConfig(**config_kwargs)
                transcriber = aai.Transcriber()

                print(f"[AssemblyAI] Starting transcription...")
                transcript = transcriber.transcribe(tmp_path, config=config)

                if transcript.status == aai.TranscriptStatus.error:
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        f"data: {json.dumps({'type': 'error', 'message': transcript.error or 'AssemblyAI transcription failed'})}\n\n",
                    )
                    return

                detected_lang = transcript.json_response.get("language_code", "nl") if transcript.json_response else "nl"
                print(f"[AssemblyAI] Detected language: {detected_lang}")
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'info', 'language': detected_lang})}\n\n",
                )

                utterances = transcript.utterances
                if utterances:
                    # Speaker diarization available
                    word_count = 0
                    for utterance in utterances:
                        text = utterance.text.strip()
                        
                        # HYBRID MODE: If language is Limburgish, use Whisper for the actual text
                        if lang == "li":
                            start_sec = utterance.start / 1000.0
                            end_sec = utterance.end / 1000.0
                            seg_duration = end_sec - start_sec
                            
                            if seg_duration > 0:
                                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as chunk_tmp:
                                    chunk_path = chunk_tmp.name
                                try:
                                    extract_audio_segment(tmp_path, chunk_path, start_sec, seg_duration)
                                    dialect_config = get_dialect_config(region)
                                    whisper_res = mlx_whisper.transcribe(
                                        chunk_path,
                                        path_or_hf_repo=WHISPER_MODEL_PATH,
                                        language="nl",
                                        initial_prompt=dialect_config["initial_prompt"],
                                        temperature=(0.0, 0.2, 0.4)
                                    )
                                    text = whisper_res.get("text", "").strip()
                                except Exception as we:
                                    print(f"[Hybrid] Whisper error: {we}")
                                    traceback.print_exc()
                                finally:
                                    if os.path.exists(chunk_path):
                                        os.unlink(chunk_path)

                        if text:
                            # Apply hallucination detection (TRANS-03)
                            try:
                                hallucination_result = process_transcription(text)
                                if hallucination_result["was_modified"]:
                                    print(f"[Hallucination] Detected {len(hallucination_result['hallucinations'])} hallucination(s) in utterance, cleaned")
                                    text = hallucination_result["cleaned_text"]
                            except Exception as e:
                                print(f"[Hallucination] Detection failed, using unfiltered text: {e}")

                            if text:  # Only send if text remains after cleaning
                                word_count += len(text.split())
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    f"data: {json.dumps({'type': 'segment', 'text': text, 'speaker': utterance.speaker})}\n\n",
                                )
                    print(f"[Hybrid] Transcription length: {word_count} words, {len(utterances)} utterances")
                else:
                    # Fallback: no utterances, use full text
                    text = (transcript.text or "").strip()
                    if text:
                        # Apply hallucination detection (TRANS-03)
                        try:
                            hallucination_result = process_transcription(text)
                            if hallucination_result["was_modified"]:
                                print(f"[Hallucination] Detected {len(hallucination_result['hallucinations'])} hallucination(s), cleaned")
                                text = hallucination_result["cleaned_text"]
                        except Exception as e:
                            print(f"[Hallucination] Detection failed, using unfiltered text: {e}")

                        if text:  # Only send if text remains after cleaning
                            print(f"[AssemblyAI] Transcription length: {len(text.split())} words (no diarization)")
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                f"data: {json.dumps({'type': 'segment', 'text': text})}\n\n",
                            )

                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'done'})}\n\n",
                )
            except Exception as e:
                print(f"[AssemblyAI] Error: {e}")
                traceback.print_exc()
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n",
                )
            finally:
                os.unlink(tmp_path)
                loop.call_soon_threadsafe(queue.put_nowait, None)

        loop.run_in_executor(None, _assemblyai_worker)
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.websocket("/ws/transcribe-stream")
async def ws_transcribe_stream(websocket: WebSocket):
    """Real-time streaming transcription via AssemblyAI WebSocket API."""
    await websocket.accept()

    if not ASSEMBLYAI_API_KEY:
        await websocket.send_json({"type": "error", "message": "AssemblyAI API key not configured"})
        await websocket.close()
        return

    import assemblyai as aai
    aai.settings.api_key = ASSEMBLYAI_API_KEY

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    last_pong = {"time": datetime.now()}

    def on_data(transcript):
        is_final = isinstance(transcript, aai.RealtimeFinalTranscript)
        if transcript.text:
            loop.call_soon_threadsafe(queue.put_nowait, {
                "type": "final" if is_final else "partial",
                "text": transcript.text,
            })

    def on_error(error):
        print(f"[AssemblyAI RT] Error: {error}")
        loop.call_soon_threadsafe(queue.put_nowait, {
            "type": "error",
            "message": str(error),
        })

    def on_close():
        print("[AssemblyAI RT] Connection closed")
        loop.call_soon_threadsafe(queue.put_nowait, None)

    transcriber = aai.RealtimeTranscriber(
        sample_rate=16000,
        encoding=aai.AudioEncoding.pcm_s16le,
        on_data=on_data,
        on_error=on_error,
        on_close=on_close,
    )

    async def heartbeat():
        """Send ping every 15s, close if no pong within 30s"""
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            try:
                # Check if last pong is too old
                elapsed = (datetime.now() - last_pong["time"]).total_seconds()
                if elapsed > HEARTBEAT_TIMEOUT:
                    print(f"[Heartbeat] No pong for {elapsed:.1f}s, closing connection")
                    await websocket.close(code=1000, reason="Heartbeat timeout")
                    break

                # Send ping
                await websocket.send_json({"type": "ping"})
            except Exception as e:
                print(f"[Heartbeat] Error: {e}")
                break

    try:
        # First message = config JSON (e.g. {"lang": "nl", "region": "mestreechs"})
        config_text = await websocket.receive_text()
        config = json.loads(config_text)
        lang = config.get("lang", "li")
        region = config.get("region", "limburgs")
        print(f"[AssemblyAI RT] Config: {config_text}")

        # Connect to AssemblyAI (blocking, run in thread)
        await asyncio.to_thread(transcriber.connect)
        print("[AssemblyAI RT] Connected")

        async def forward_audio():
            """Read audio chunks from frontend WebSocket, forward to AssemblyAI."""
            try:
                while True:
                    msg = await websocket.receive()
                    if msg.get("type") == "websocket.disconnect":
                        break
                    if "bytes" in msg and msg["bytes"]:
                        await asyncio.to_thread(transcriber.stream, msg["bytes"])
                    elif "text" in msg and msg["text"]:
                        data = json.loads(msg["text"])
                        if data.get("type") == "pong":
                            last_pong["time"] = datetime.now()
            except WebSocketDisconnect:
                pass
            except Exception as e:
                print(f"[AssemblyAI RT] Audio forward error: {e}")

        async def send_events():
            """Read transcription events from queue, send to frontend WebSocket."""
            try:
                while True:
                    event = await queue.get()
                    if event is None:
                        break
                    await websocket.send_json(event)
            except Exception as e:
                print(f"[AssemblyAI RT] Event send error: {e}")

        # Run all tasks concurrently
        heartbeat_task = asyncio.create_task(heartbeat())
        audio_task = asyncio.create_task(forward_audio())
        event_task = asyncio.create_task(send_events())

        # Wait for audio to stop (client disconnected or stopped recording)
        await audio_task

        # Close AssemblyAI connection (triggers on_close → queue gets None)
        await asyncio.to_thread(transcriber.close)

        # Wait for remaining events to flush
        await event_task

    except WebSocketDisconnect:
        print("[AssemblyAI RT] Client disconnected")
    except Exception as e:
        print(f"[AssemblyAI RT] Error: {e}")
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        # Clean up background task
        if 'heartbeat_task' in locals():
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.to_thread(transcriber.close)
        except Exception:
            pass


from pydantic import BaseModel


class CorrectionRequest(BaseModel):
    text: str
    language: str
    region: str = "limburgs"
    quality: str = "light"
    mode: str = "local"
    temperature: float = 0.5
    report_length: str = "samenvatting"
    keep_dialect: bool = False
    target_lang: str = "nl"


class EvaluateRequest(BaseModel):
    reference: str      # Ground truth (user-corrected text)
    hypothesis: str     # Raw transcription output
    session_id: str = ""
    dialect_region: str = "limburgs"
    low_confidence_count: int = 0


class FeedbackRequest(BaseModel):
    session_id: str
    dialect_region: str = "limburgs"
    wer: float
    cer: float
    substitutions: int
    deletions: int
    insertions: int
    total_words: int
    low_confidence_count: int = 0
    feedback: str       # "thumbs_up" or "thumbs_down"


@app.post("/correct")
async def correct(req: CorrectionRequest):
    """Step 2: Dialect correction via Ollama (local) or Mistral (API) — streams tokens as SSE."""
    if not req.text:
        return {"corrected": ""}

    dialect_config = get_dialect_config(req.region)
    if req.language == "li":
        system_prompt, json_instr = build_correction_prompt(req.region, req.report_length)
    else:
        system_prompt = SYSTEM_PROMPTS.get(req.report_length, SYSTEM_PROMPTS["samenvatting"])
        json_instr = ""

    chunks = split_into_chunks(req.text, max_words=400)
    # Only send full context for small texts (≤5 chunks); for large texts it wastes tokens
    full_context = req.text if 1 < len(chunks) <= 5 else None
    text_to_process = req.text

    if req.mode == "api" and not MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="Mistral API key not configured")

    async def generate():
        try:
            nonlocal text_to_process
            
            # PHASE 3: Two-step correction for Limburgish
            if req.language == "li":
                print(f"[Phase 3] Starting cleanup pass for Limburgish...")
                cleaned_chunks = []
                async with httpx.AsyncClient(timeout=600.0) as client:
                    for i, chunk in enumerate(chunks):
                        print(f"  Cleaning chunk {i+1}/{len(chunks)}...")
                        chunk_tokens = []
                        if req.mode == "api":
                            mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
                            async for token in correct_chunk_mistral_stream(
                                chunk, req.language, mistral_model, None, req.temperature, CLEANUP_PROMPT
                            ):
                                chunk_tokens.append(token)
                        else:
                            ollama_model = OLLAMA_MODELS.get(req.quality, OLLAMA_MODELS["light"])
                            async for token in correct_chunk_stream(
                                client, chunk, req.language, ollama_model, None, req.temperature, CLEANUP_PROMPT
                            ):
                                chunk_tokens.append(token)
                        cleaned_chunks.append("".join(chunk_tokens))
                
                text_to_process = " ".join(cleaned_chunks)
                print(f"[Phase 3] Cleanup pass complete.")
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

            # JSON mode: accumulate tokens, parse JSON, emit corrected text
            # Disabled for keep_dialect (raw dialect text output)
            use_json = bool(json_instr) and not req.keep_dialect

            if req.mode == "api":
                mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
                print(f"Streaming final pass via Mistral {mistral_model}...")

                for i, chunk in enumerate(final_chunks):
                    chunk_input = f"{chunk}\n\n{json_instr}" if use_json else chunk
                    chunk_tokens: list[str] = []
                    async for token in correct_chunk_mistral_stream(
                        chunk_input, req.language, mistral_model, full_context, req.temperature, final_system_prompt
                    ):
                        if use_json:
                            chunk_tokens.append(token)
                        else:
                            yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
                    if use_json and chunk_tokens:
                        accumulated = "".join(chunk_tokens)
                        validated = parse_correction_output(accumulated, chunk)
                        yield f"data: {json.dumps({'type': 'token', 'text': validated.corrected})}\n\n"
            else:
                ollama_model = OLLAMA_MODELS.get(req.quality, OLLAMA_MODELS["light"])
                print(f"Streaming final pass via Ollama {ollama_model}...")
                json_schema = CorrectionOutput.model_json_schema() if use_json else None

                async with httpx.AsyncClient(timeout=600.0) as client:
                    for i, chunk in enumerate(final_chunks):
                        chunk_input = f"{chunk}\n\n{json_instr}" if use_json else chunk
                        chunk_tokens: list[str] = []
                        async for token in correct_chunk_stream(
                            client, chunk_input, req.language, ollama_model, full_context, req.temperature, final_system_prompt,
                            json_schema=json_schema
                        ):
                            if use_json:
                                chunk_tokens.append(token)
                            else:
                                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
                        if use_json and chunk_tokens:
                            accumulated = "".join(chunk_tokens)
                            validated = parse_correction_output(accumulated, chunk)
                            yield f"data: {json.dumps({'type': 'token', 'text': validated.corrected})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"Correction streaming failed: {e}")
            traceback.print_exc()
            error_str = str(e)

            # Classify error type per EH-01 taxonomy
            if "429" in error_str or "rate" in error_str.lower():
                retry_after = 3
                if hasattr(e, 'response') and hasattr(e.response, 'headers'):
                    retry_after = parse_retry_after(e.response)
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'rate_limit', 'retry_after': retry_after})}\n\n"
            elif any(code in error_str for code in ["502", "503"]):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'upstream_disconnect'})}\n\n"
            elif "timeout" in error_str.lower() or isinstance(e, asyncio.TimeoutError):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'timeout'})}\n\n"
            elif isinstance(e, (httpx.ConnectError, httpx.NetworkError, ConnectionError)):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'network_error'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'network_error'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# --- Evaluation endpoints (Phase 4) ---

from evaluation.metrics import calculate_metrics
from evaluation.patterns import extract_error_patterns
from evaluation.logger import log_evaluation, read_evaluations, get_wer_summary, log_correction, read_corrections
from evaluation.suggestions import suggest_glossary_updates
from correction import get_prompt_version


@app.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    """Calculate WER/CER and error patterns for a reference/hypothesis pair.

    PRIVACY: This endpoint processes text but does NOT log it.
    Only computed metrics are returned."""
    if not req.reference.strip() or not req.hypothesis.strip():
        raise HTTPException(status_code=400, detail="Both reference and hypothesis text required")

    try:
        metrics = calculate_metrics(req.reference, req.hypothesis)
        patterns = extract_error_patterns(req.reference, req.hypothesis)
        return {
            "wer": round(metrics["wer"], 4),
            "cer": round(metrics["cer"], 4),
            "substitutions": metrics["substitutions"],
            "deletions": metrics["deletions"],
            "insertions": metrics["insertions"],
            "total_words": metrics["total_words"],
            "error_details": patterns["details"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate/log")
async def evaluate_log(req: FeedbackRequest):
    """Log evaluation metrics to JSONL. PRIVACY: No raw text is logged."""
    try:
        log_path = log_evaluation(
            session_id=req.session_id,
            dialect_region=req.dialect_region,
            wer=req.wer,
            cer=req.cer,
            substitutions=req.substitutions,
            deletions=req.deletions,
            insertions=req.insertions,
            total_words=req.total_words,
            low_confidence_count=req.low_confidence_count,
            feedback=req.feedback,
            prompt_version=get_prompt_version(),
        )
        return {"status": "logged", "file": str(log_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluate/history")
async def evaluate_history(limit: int = 50):
    """Read recent evaluation history from JSONL logs."""
    try:
        entries = read_evaluations(limit=limit)
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/evaluate/summary")
async def evaluate_summary(dialect_region: str | None = None, limit: int = 1000):
    """Aggregated WER statistics: mean, p50, p95, mean CER (FEED-02)."""
    try:
        summary = get_wer_summary(dialect_region=dialect_region, limit=limit)
        summary["prompt_version"] = get_prompt_version()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UserCorrectionRequest(BaseModel):
    session_id: str
    dialect_region: str = "limburgs"
    original_text: str
    corrected_text: str
    user_correction: str


@app.post("/corrections")
async def submit_correction(req: UserCorrectionRequest):
    """Store a user correction for glossary learning (FEED-01)."""
    if not req.original_text.strip() or not req.user_correction.strip():
        raise HTTPException(status_code=400, detail="original_text and user_correction are required")
    try:
        log_path = log_correction(
            session_id=req.session_id,
            dialect_region=req.dialect_region,
            original_text=req.original_text,
            corrected_text=req.corrected_text,
            user_correction=req.user_correction,
        )
        return {"status": "logged", "file": str(log_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/corrections")
async def list_corrections(dialect_region: str | None = None, limit: int = 50):
    """Read stored user corrections (FEED-01)."""
    try:
        entries = read_corrections(limit=limit, dialect_region=dialect_region)
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/corrections/suggestions")
async def correction_suggestions(dialect_region: str = "limburgs", limit: int = 200):
    """Suggest glossary updates based on accumulated user corrections (FEED-01)."""
    try:
        corrections = read_corrections(limit=limit, dialect_region=dialect_region)
        suggestions = suggest_glossary_updates(corrections, region=dialect_region)
        return {"suggestions": suggestions, "count": len(suggestions), "based_on": len(corrections)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
