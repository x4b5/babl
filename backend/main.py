import asyncio
import json
import re
import tempfile
import os
import traceback

from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import mlx_whisper
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

ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY", "")

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

# Combined dialect prompt: DIALECT_PROMPT + hotwords integrated as initial_prompt
DIALECT_INITIAL_PROMPT = DIALECT_PROMPT + "\n" + DIALECT_HOTWORDS


SYSTEM_PROMPTS = {
    "kort": (
        "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
        "JE TAAK:\n"
        "Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een OPSOMMING van in bulletpoints.\n\n"
        "1. Lees de volledige tekst om de context en bedoeling te begrijpen.\n"
        "2. Vertaal dialectwoorden naar standaard Nederlands.\n"
        "3. Destilleer de kernpunten en presenteer ze als een korte bulletpoint-lijst.\n"
        "4. Elk bulletpoint is één kernpunt — maximaal één zin.\n"
        "5. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n\n"
        "VOORBEELD:\n"
        "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
        "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
        "doe mós dat eigenlijk neet doon zag hae'\n"
        "Output:\n"
        "- Gisteren naar het plein gegaan, mooi weer\n"
        "- Met Jan gesproken: hij zei dat het niet goed was\n"
        "- Advies van Jan: dat moet je eigenlijk niet doen\n\n"
        "REGELS:\n"
        "- Geef ALLEEN de bulletpoint-lijst terug, geen uitleg of commentaar.\n"
        "- Gebruik '- ' als bulletpoint-prefix.\n"
        "- Voeg geen informatie toe die niet in de brontekst staat.\n"
        "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n"
        "- Focus op resultaten en besluiten, niet op procesbeschrijving."
    ),
    "middellang": (
        "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
        "JE TAAK:\n"
        "Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een KORT VERSLAG van.\n"
        "Focus op resultaten, besluiten en conclusies — niet op het proces.\n\n"
        "1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n"
        "2. Schrijf een beknopt, goed leesbaar Nederlands verslag.\n"
        "3. Focus op WAT er besloten/geconcludeerd is, niet op HOE het gesprek verliep.\n"
        "4. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n"
        "5. Maak er lopende, correcte Nederlandse zinnen van.\n"
        "6. Behoud de toon van de spreker (informeel blijft informeel).\n\n"
        "VOORBEELD:\n"
        "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
        "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
        "doe mós dat eigenlijk neet doon zag hae'\n"
        "Output: 'Gisteren was het mooi weer op het plein. Jan gaf aan dat het niet goed was "
        "en adviseerde om het niet te doen.'\n\n"
        "REGELS:\n"
        "- Geef ALLEEN het verslag terug, geen uitleg of commentaar.\n"
        "- Voeg geen informatie toe die niet in de brontekst staat.\n"
        "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n"
        "- Kort en bondig. Geen onnodige procesbeschrijving."
    ),
    "lang": (
        "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
        "JE TAAK:\n"
        "Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een UITGEBREIDE VERSLAGLEGGING van.\n\n"
        "1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n"
        "2. Schrijf een uitgebreid, goed gestructureerd Nederlands verslag.\n"
        "3. Gebruik alinea's en indien passend kopjes om het verslag te structureren.\n"
        "4. Geef alle details weer — ook nuances, context, bijzaken en procesbeschrijving.\n"
        "5. Beschrijf wie wat zei, welke argumenten er waren, en hoe tot conclusies is gekomen.\n"
        "6. Vertaal dialectwoorden naar standaard Nederlands.\n"
        "7. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n"
        "8. Behoud de toon en stijl van de spreker.\n\n"
        "VOORBEELD:\n"
        "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
        "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
        "doe mós dat eigenlijk neet doon zag hae'\n"
        "Output: 'Gisteren ben ik naar het plein gegaan. Het was mooi weer.\n\n"
        "Tijdens het bezoek heb ik met Jan gesproken. Hij gaf aan dat de situatie niet goed "
        "was en adviseerde nadrukkelijk om het niet te doen. Zijn standpunt was duidelijk: "
        "het is eigenlijk geen goede keuze.'\n\n"
        "REGELS:\n"
        "- Geef ALLEEN het uitgebreide verslag terug, geen uitleg of commentaar.\n"
        "- Voeg geen informatie toe die niet in de brontekst staat.\n"
        "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n"
        "- Structureer met alinea's. Gebruik kopjes als de tekst meerdere onderwerpen bevat.\n"
        "- Wees volledig: beschrijf het proces, de argumenten en de conclusies."
    ),
}

SYSTEM_PROMPT = SYSTEM_PROMPTS["middellang"]


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "whisper_model": "large-v3-mlx",
        "mistral_available": bool(MISTRAL_API_KEY),
        "assemblyai_available": bool(ASSEMBLYAI_API_KEY),
    }




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
):
    """Stream tokens from Ollama for a single chunk. Yields token strings."""
    word_count = len(chunk.split())
    num_predict = max(512, int(word_count * 2))
    prompt = _build_ollama_prompt(chunk, detected_lang, full_context)

    async with client.stream(
        "POST",
        OLLAMA_URL,
        json={
            "model": ollama_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": True,
            "options": {"num_predict": num_predict, "temperature": temperature},
        },
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
    """Stream tokens from Mistral API for a single chunk. Yields token strings."""
    client = get_mistral_client()
    if client is None:
        raise RuntimeError("Mistral API key not configured")

    user_prompt = _build_mistral_prompt(chunk, detected_lang, full_context)
    word_count = len(chunk.split())
    max_tokens = max(512, int(word_count * 2))

    max_retries = 8
    for attempt in range(max_retries):
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
            if "429" in str(e) and attempt < max_retries - 1:
                wait = 3 * (2 ** attempt)
                print(f"  Rate limited, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
            else:
                raise


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
    lang: str = Form("li"),
):
    """Step 1: Whisper transcription — streams segments as SSE."""
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    # Map frontend lang to Whisper parameters
    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": DIALECT_INITIAL_PROMPT},
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
                transcribe_kwargs = {
                    "path_or_hf_repo": WHISPER_MODEL_PATH,
                    "temperature": (0.0, 0.2, 0.4),
                }
                if lang_config["language"] is not None:
                    transcribe_kwargs["language"] = lang_config["language"]
                if lang_config["initial_prompt"] is not None:
                    transcribe_kwargs["initial_prompt"] = lang_config["initial_prompt"]

                result = mlx_whisper.transcribe(tmp_path, **transcribe_kwargs)
                detected_lang = result.get("language", "nl")
                print(f"Detected language: {detected_lang}")

                loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'info', 'language': detected_lang})}\n\n")

                word_count = 0
                for segment in result.get("segments", []):
                    text = segment.get("text", "").strip()
                    if text:
                        word_count += len(text.split())
                        loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'segment', 'text': text})}\n\n")

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
    offset: float = Form(0.0),
):
    """Live transcription endpoint — returns JSON with segment timestamps.

    Args:
        offset: seconds of audio already processed. Segments starting before
                this offset are filtered out to avoid duplication.
    """
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": DIALECT_INITIAL_PROMPT},
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
        if offset > 0:
            segments = [s for s in segments if s["start"] >= offset]

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
                        if text:
                            word_count += len(text.split())
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                f"data: {json.dumps({'type': 'segment', 'text': text, 'speaker': utterance.speaker})}\n\n",
                            )
                    print(f"[AssemblyAI] Transcription length: {word_count} words, {len(utterances)} utterances")
                else:
                    # Fallback: no utterances, use full text
                    text = (transcript.text or "").strip()
                    if text:
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

    try:
        # First message = config JSON (e.g. {"lang": "nl"})
        config_text = await websocket.receive_text()
        print(f"[AssemblyAI RT] Config: {config_text}")

        # Connect to AssemblyAI (blocking, run in thread)
        await asyncio.to_thread(transcriber.connect)
        print("[AssemblyAI RT] Connected")

        async def forward_audio():
            """Read audio chunks from frontend WebSocket, forward to AssemblyAI."""
            try:
                while True:
                    data = await websocket.receive_bytes()
                    await asyncio.to_thread(transcriber.stream, data)
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

        # Run both tasks concurrently; when audio forwarder stops, close transcriber
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
        try:
            await asyncio.to_thread(transcriber.close)
        except Exception:
            pass


from pydantic import BaseModel


class CorrectionRequest(BaseModel):
    text: str
    language: str
    quality: str = "light"
    mode: str = "local"
    temperature: float = 0.5
    report_length: str = "middellang"


@app.post("/correct")
async def correct(req: CorrectionRequest):
    """Step 2: Dialect correction via Ollama (local) or Mistral (API) — streams tokens as SSE."""
    if not req.text:
        return {"corrected": ""}

    system_prompt = SYSTEM_PROMPTS.get(req.report_length, SYSTEM_PROMPTS["middellang"])

    chunks = split_into_chunks(req.text, max_words=400)
    # Only send full context for small texts (≤5 chunks); for large texts it wastes tokens
    full_context = req.text if 1 < len(chunks) <= 5 else None

    if req.mode == "api" and not MISTRAL_API_KEY:
        raise HTTPException(status_code=400, detail="Mistral API key not configured")

    async def generate():
        try:
            if req.mode == "api":
                mistral_model = MISTRAL_MODELS.get(req.quality, MISTRAL_MODELS["light"])
                print(f"Streaming {len(chunks)} chunk(s) via Mistral {mistral_model} (length: {req.report_length})...")

                for i, chunk in enumerate(chunks):
                    print(f"  Streaming chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
                    async for token in correct_chunk_mistral_stream(
                        chunk, req.language, mistral_model, full_context, req.temperature, system_prompt
                    ):
                        yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
            else:
                ollama_model = OLLAMA_MODELS.get(req.quality, OLLAMA_MODELS["light"])
                print(f"Streaming {len(chunks)} chunk(s) via Ollama {ollama_model} (length: {req.report_length})...")

                async with httpx.AsyncClient(timeout=600.0) as client:
                    for i, chunk in enumerate(chunks):
                        print(f"  Streaming chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
                        async for token in correct_chunk_stream(
                            client, chunk, req.language, ollama_model, full_context, req.temperature, system_prompt
                        ):
                            yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"Correction streaming failed: {e}")
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
