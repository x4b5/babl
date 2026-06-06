"""Local Whisper transcription endpoints: /transcribe, /transcribe-live."""

import asyncio
import json
import os
import tempfile
import traceback

import mlx_whisper
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from audio import extract_audio_segment, filter_segments_by_offset, get_audio_duration
from config import MAX_UPLOAD_BYTES, WHISPER_MODEL_PATH
from dialects import get_dialect_config
from hallucination import process_transcription

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
):
    """Step 1: Whisper transcription -- streams segments as SSE."""
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
    print(f"Received file: {file.filename}, size: {size_mb:.1f} MB, lang: {lang}")
    if file_size == 0:
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="Empty audio file")
    if file_size > MAX_UPLOAD_BYTES:
        os.unlink(tmp_path)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.0f} MB). Maximum is {MAX_UPLOAD_BYTES // (1024*1024)} MB.",
        )

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

                total_chunks = max(1, -(-int(duration) // int(segment_duration)))  # ceil division
                for start in range(0, int(duration), int(segment_duration)):
                    chunk_index = start // int(segment_duration)
                    # Send progress event to keep SSE connection alive during long Whisper processing
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        f"data: {json.dumps({'type': 'progress', 'chunk': chunk_index + 1, 'total_chunks': total_chunks})}\n\n",
                    )

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
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                f"data: {json.dumps({'type': 'info', 'language': detected_lang})}\n\n",
                            )

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
                                    loop.call_soon_threadsafe(
                                        queue.put_nowait,
                                        f"data: {json.dumps({'type': 'segment', 'text': text})}\n\n",
                                    )
                    finally:
                        if os.path.exists(chunk_path):
                            os.unlink(chunk_path)

                print(f"Transcription length: {word_count} words")
                loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'done'})}\n\n")
            except Exception as e:
                traceback.print_exc()
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n",
                )
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

    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"

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
                    print("[Hallucination] Live segment cleaned")
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
