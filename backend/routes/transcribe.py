"""Local Whisper transcription endpoints: /transcribe, /transcribe-live."""

import asyncio
import json
import logging
import os
import tempfile
import uuid

import mlx_whisper
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from audio import filter_segments_by_offset
from config import MAX_UPLOAD_BYTES, WHISPER_MODEL_PATH
from diarization import diarize, merge_transcription_with_diarization, is_diarization_available
from dialects import get_dialect_config
from hallucination import process_transcription
from evaluation.logger import log_processing_event

router = APIRouter()

# Serialiseert Whisper-transcripties: parallelle mlx-whisper-runs kunnen het
# GPU-geheugen op Apple Silicon uitputten en crashen.
_whisper_semaphore = asyncio.Semaphore(1)

# Toegestane audio-extensies — voorkomt dat een gebruiker een willekeurige
# extensie (bv. .py) op het tijdelijke bestand laat plakken.
ALLOWED_AUDIO_SUFFIXES = {".webm", ".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".flac", ".aac"}


def _safe_suffix(filename: str | None, default: str) -> str:
    suffix = os.path.splitext(filename or "")[1].lower()
    return suffix if suffix in ALLOWED_AUDIO_SUFFIXES else default


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
    num_speakers: int | None = Form(None),
):
    """Step 1: Whisper transcription -- streams segments as SSE."""
    if lang not in ("auto", "nl", "li", "en"):
        lang = "li"

    # Begrens het aantal sprekers (diarisatie) tot een redelijk bereik
    if num_speakers is not None:
        num_speakers = max(1, min(10, num_speakers))

    dialect_config = get_dialect_config(region)

    # Map frontend lang to Whisper parameters
    lang_config: dict[str, str | None] = {
        "auto": {"language": None, "initial_prompt": None},
        "nl": {"language": "nl", "initial_prompt": None},
        "li": {"language": "nl", "initial_prompt": dialect_config["initial_prompt"]},
        "en": {"language": "en", "initial_prompt": None},
    }[lang]

    suffix = _safe_suffix(file.filename, ".webm")

    # Stream upload to disk in chunks to avoid loading entire file in RAM
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        while chunk := await file.read(8192):
            tmp.write(chunk)
        file_size = tmp.tell()
        tmp_path = tmp.name
        tmp.close()
    except Exception:
        tmp.close()
        os.unlink(tmp.name)
        raise

    size_mb = file_size / (1024 * 1024)
    logger.info("Received file: %s, size: %.1f MB, lang: %s", file.filename, size_mb, lang)
    if file_size == 0:
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="Empty audio file")
    if file_size > MAX_UPLOAD_BYTES:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.0f} MB). Maximum is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )

    session_id = str(uuid.uuid4())

    async def generate():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def _transcribe_worker():
            try:
                # Run speaker diarization on full audio (if available)
                diarization_segments = []
                if is_diarization_available():
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        f"data: {json.dumps({'type': 'progress', 'message': 'Sprekerherkenning...'})}\n\n",
                    )
                    diarization_segments = diarize(tmp_path, num_speakers=num_speakers)
                    if diarization_segments:
                        speaker_count = len(set(s["speaker"] for s in diarization_segments))
                        logger.info("Diarization found %d speakers", speaker_count)

                # Transcribe the WHOLE recording in one call. mlx-whisper handles
                # long audio internally with overlapping 30s windows + context, so
                # we no longer cut hard at 30s (which dropped words on boundaries)
                # and no longer depend on a duration probe (unreliable for WebM).
                logger.info("Transcribing full recording...")
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
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'info', 'language': detected_lang})}\n\n",
                )

                # Segments already carry absolute timestamps, so merge with offset 0.
                raw_segments = result.get("segments", [])
                if diarization_segments:
                    merged = merge_transcription_with_diarization(
                        raw_segments, diarization_segments, time_offset=0.0
                    )
                else:
                    merged = raw_segments

                word_count = 0
                for segment in merged:
                    text = segment.get("text", "").strip()
                    if text:
                        # Apply hallucination detection (TRANS-03)
                        try:
                            hallucination_result = process_transcription(text)
                            if hallucination_result["was_modified"]:
                                logger.info("Hallucination detected: %d issue(s) in segment, cleaned", len(hallucination_result["hallucinations"]))
                                text = hallucination_result["cleaned_text"]
                        except Exception as e:
                            logger.warning("Hallucination detection failed, using unfiltered text: %s", e)

                        if text:  # Only send if text remains after cleaning
                            word_count += len(text.split())
                            event_data = {'type': 'segment', 'text': text}
                            if 'speaker' in segment:
                                event_data['speaker'] = segment['speaker']
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                f"data: {json.dumps(event_data)}\n\n",
                            )

                logger.info("Transcription length: %d words", word_count)
                log_processing_event(
                    session_id=session_id,
                    mode="local",
                    step="transcribe",
                    provider="whisper",
                    pii_redaction=False,
                    region=region,
                    success=True,
                )
                loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'done'})}\n\n")
            except Exception as e:
                logger.exception("Transcription worker error")
                log_processing_event(
                    session_id=session_id,
                    mode="local",
                    step="transcribe",
                    provider="whisper",
                    pii_redaction=False,
                    region=region,
                    success=False,
                    error_type=type(e).__name__,
                )
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'error', 'message': 'Transcriptie mislukt.'})}\n\n",
                )
            finally:
                os.unlink(tmp_path)
                loop.call_soon_threadsafe(queue.put_nowait, None)

        async with _whisper_semaphore:
            loop.run_in_executor(None, _transcribe_worker)
            while True:
                # Wait for the next event, but emit a keepalive "progress" ping
                # every few seconds so the SSE connection survives the long
                # single transcribe call. The frontend ignores 'progress' events.
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=3.0)
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'progress', 'message': 'Verwerken...'})}\n\n"
                    continue
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


@router.post("/transcribe-live")
async def transcribe_live(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
    offset: float = Form(0.0),
):
    """Live transcription endpoint -- returns JSON with segment timestamps.

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

    suffix = _safe_suffix(file.filename, ".wav")

    # Stream upload to disk in chunks to avoid loading entire file in RAM
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        while chunk := await file.read(8192):
            tmp.write(chunk)
        file_size = tmp.tell()
        tmp_path = tmp.name
        tmp.close()
    except Exception:
        tmp.close()
        os.unlink(tmp.name)
        raise

    if file_size == 0:
        os.unlink(tmp_path)
        return {"text": "", "language": "nl", "segments": []}

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
                    logger.info("Hallucination detected in live segment, cleaned")
                    seg["text"] = hallucination_result["cleaned_text"]
            except Exception as e:
                logger.warning("Hallucination detection failed for segment, using unfiltered: %s", e)

        full_text = " ".join(s["text"] for s in segments)
        return {"text": full_text, "language": detected_lang, "segments": segments}
    except Exception as e:
        logger.exception("Live transcription error: %s", e)
        return {"text": "", "language": "nl", "segments": []}
    finally:
        os.unlink(tmp_path)
