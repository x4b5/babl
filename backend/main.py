import asyncio
import re
import tempfile
import os
import traceback

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel, BatchedInferencePipeline
import httpx
from dialects import DIALECT_HOTWORDS, DIALECT_PROMPT

# Allow large uploads (500 MB covers ~2+ hours of compressed audio)
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

# Max parallel Ollama requests (avoid overloading CPU/GPU)
MAX_PARALLEL_CORRECTIONS = 3

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODELS = {
    "light": "gemma3:4b",
    "medium": "gemma3:12b",
}

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_MODELS = {
    "light": "mistral-small-latest",
    "medium": "mistral-large-latest",
}

# Lazy-initialized Mistral client
_mistral_client = None


def get_mistral_client():
    global _mistral_client
    if _mistral_client is None and MISTRAL_API_KEY:
        from mistralai import Mistral
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

# Load both Whisper models at startup with batched inference for speed
_whisper_light = WhisperModel("small", device="cpu", compute_type="int8")
_whisper_medium = WhisperModel("medium", device="cpu", compute_type="int8")
models = {
    "light": BatchedInferencePipeline(model=_whisper_light),
    "medium": BatchedInferencePipeline(model=_whisper_medium),
}


SYSTEM_PROMPT = (
    "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
    "JE TAAK:\n"
    "Je krijgt een ruwe spraak-naar-tekst transcriptie. Deze bevat dialectwoorden, "
    "spreektaalfouten, herhalingen, onafgemaakte zinnen en versprekingen.\n\n"
    "1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n"
    "2. Schrijf dan een vloeiende, goed leesbare Nederlandse versie die de BEDOELING "
    "van de spreker weergeeft — niet een woord-voor-woord vertaling.\n"
    "3. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n"
    "4. Maak er lopende, correcte Nederlandse zinnen van.\n"
    "5. Behoud de toon en stijl van de spreker (informeel blijft informeel).\n\n"
    "VOORBEELD:\n"
    "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
    "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
    "doe mós dat eigenlijk neet doon zag hae'\n"
    "Output: 'Ik ben gisteren naar het plein gegaan en het was mooi weer. "
    "Toen heb ik met Jan gesproken en hij zei dat het niet goed was. "
    "Je moet dat eigenlijk niet doen, zei hij.'\n\n"
    "REGELS:\n"
    "- Geef ALLEEN de gecorrigeerde tekst terug, geen uitleg of commentaar.\n"
    "- Voeg geen informatie toe die niet in de brontekst staat.\n"
    "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands."
)


@app.get("/health")
async def health():
    return {"status": "ok", "mistral_available": bool(MISTRAL_API_KEY)}


async def correct_chunk(
    client: httpx.AsyncClient,
    chunk: str,
    detected_lang: str,
    ollama_model: str,
    full_context: str | None = None,
    temperature: float = 0.5,
) -> str:
    """Send a single text chunk to Ollama for dialect correction."""
    word_count = len(chunk.split())
    num_predict = max(512, int(word_count * 2))

    # Give the model context of the full text so it understands the bigger picture
    if full_context and full_context != chunk:
        prompt = (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"CORRIGEER DIT FRAGMENT:\n{chunk}"
        )
    else:
        prompt = f"[Taal: {detected_lang}]\n\n{chunk}"

    resp = await client.post(
        OLLAMA_URL,
        json={
            "model": ollama_model,
            "prompt": prompt,
            "system": SYSTEM_PROMPT,
            "stream": False,
            "options": {"num_predict": num_predict, "temperature": temperature},
        },
    )
    resp.raise_for_status()
    result = resp.json().get("response", chunk).strip()
    return result if result else chunk


async def correct_chunk_mistral(
    chunk: str,
    detected_lang: str,
    mistral_model: str,
    full_context: str | None = None,
    temperature: float = 0.5,
) -> str:
    """Send a single text chunk to Mistral API for dialect correction."""
    client = get_mistral_client()
    if client is None:
        raise RuntimeError("Mistral API key not configured")

    if full_context and full_context != chunk:
        user_prompt = (
            f"[Taal: {detected_lang}]\n\n"
            f"VOLLEDIGE CONTEXT (alleen ter referentie):\n{full_context}\n\n"
            f"CORRIGEER DIT FRAGMENT:\n{chunk}"
        )
    else:
        user_prompt = f"[Taal: {detected_lang}]\n\n{chunk}"

    word_count = len(chunk.split())
    max_tokens = max(512, int(word_count * 2))

    response = await asyncio.to_thread(
        client.chat.complete,
        model=mistral_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = response.choices[0].message.content
    if content is None:
        print(f"  WARNING: Mistral returned None content, full response: {response}")
        return chunk
    result = content.strip() if isinstance(content, str) else str(content).strip()
    return result if result else chunk


def split_into_chunks(text: str, max_words: int = 400) -> list[str]:
    """Split text into chunks at sentence boundaries (. ! ? ...), each ≤ max_words."""
    # Split on sentence-ending punctuation, keeping the delimiter attached
    sentences = re.split(r'(?<=[.!?…])\s+', text.strip())
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        words = len(sentence.split())
        if current and current_len + words > max_words:
            chunks.append(" ".join(current))
            current = [sentence]
            current_len = words
        else:
            current.append(sentence)
            current_len += words

    if current:
        chunks.append(" ".join(current))
    return chunks if chunks else [text]


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    quality: str = Form("light"),
    lang: str = Form("li"),
):
    """Step 1: Whisper transcription only — returns raw text immediately."""
    if quality not in models:
        quality = "light"
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    # Map frontend lang to Whisper parameters
    # Limburgs: auto-detect + dialect prompt — don't force NL or DE since
    # Limburgs is a blend of both; the strong initial_prompt steers Whisper.
    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": DIALECT_PROMPT},
        "en": {"language": "en", "initial_prompt": None},
    }[lang]

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            size_mb = len(content) / (1024 * 1024)
            print(f"Received file: {file.filename}, size: {size_mb:.1f} MB, quality: {quality}, lang: {lang}")
            if not content:
                raise HTTPException(status_code=400, detail="Empty audio file")
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large ({size_mb:.0f} MB). Maximum is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
                )
            tmp.write(content)
            tmp_path = tmp.name

        whisper_model = models[quality]
        transcribe_kwargs = {
            "batch_size": 16,
            "vad_filter": True,
            "vad_parameters": {"min_silence_duration_ms": 500},
            "no_speech_threshold": 0.5,
            "repetition_penalty": 1.2,
        }
        if lang_config["language"] is not None:
            transcribe_kwargs["language"] = lang_config["language"]
        if lang_config["initial_prompt"] is not None:
            transcribe_kwargs["initial_prompt"] = lang_config["initial_prompt"]

        # Limburgs: boost dialect tokens and widen beam search
        if lang == "li":
            transcribe_kwargs["hotwords"] = DIALECT_HOTWORDS
            transcribe_kwargs["beam_size"] = 10
            transcribe_kwargs["best_of"] = 5

        segments, info = whisper_model.transcribe(
            tmp_path,
            **transcribe_kwargs,
        )
        raw = " ".join(segment.text.strip() for segment in segments)
        detected_lang = info.language
        print(f"Detected language: {detected_lang} ({info.language_probability:.0%})")
        print(f"Transcription length: {len(raw.split())} words")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        if "tmp_path" in locals():
            os.unlink(tmp_path)

    return {"raw": raw, "language": detected_lang, "quality": quality}


from pydantic import BaseModel


class CorrectionRequest(BaseModel):
    text: str
    language: str
    quality: str = "light"
    mode: str = "local"
    temperature: float = 0.5


@app.post("/correct")
async def correct(req: CorrectionRequest):
    """Step 2: Dialect correction via Ollama (local) or Mistral (API)."""
    if not req.text:
        return {"corrected": ""}

    chunks = split_into_chunks(req.text, max_words=400)
    full_context = req.text if len(chunks) > 1 else None

    if req.mode == "api":
        if not MISTRAL_API_KEY:
            raise HTTPException(status_code=400, detail="Mistral API key not configured")

        mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
        print(f"Correcting {len(chunks)} chunk(s) via Mistral {mistral_model}...")

        try:
            semaphore = asyncio.Semaphore(MAX_PARALLEL_CORRECTIONS)

            async def correct_with_limit(i: int, chunk: str) -> tuple[int, str]:
                async with semaphore:
                    print(f"  Correcting chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
                    result = await correct_chunk_mistral(chunk, req.language, mistral_model, full_context, req.temperature)
                    return (i, result)

            results = await asyncio.gather(
                *(correct_with_limit(i, chunk) for i, chunk in enumerate(chunks))
            )
            corrected = " ".join(r for _, r in sorted(results))
        except Exception as e:
            print(f"Mistral correction failed: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Mistral correction failed: {e}")
    else:
        ollama_model = OLLAMA_MODELS.get(req.quality, OLLAMA_MODELS["light"])
        print(f"Correcting {len(chunks)} chunk(s) via Ollama {ollama_model} (max {MAX_PARALLEL_CORRECTIONS} parallel)...")

        try:
            async with httpx.AsyncClient(timeout=600.0) as client:
                semaphore = asyncio.Semaphore(MAX_PARALLEL_CORRECTIONS)

                async def correct_with_limit(i: int, chunk: str) -> tuple[int, str]:
                    async with semaphore:
                        print(f"  Correcting chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
                        result = await correct_chunk(client, chunk, req.language, ollama_model, full_context, req.temperature)
                        return (i, result)

                results = await asyncio.gather(
                    *(correct_with_limit(i, chunk) for i, chunk in enumerate(chunks))
                )
                corrected = " ".join(r for _, r in sorted(results))
        except Exception as e:
            print(f"Ollama correction failed: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Ollama correction failed: {e}")

    return {"corrected": corrected}
