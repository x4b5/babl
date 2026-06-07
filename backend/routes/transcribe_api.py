"""AssemblyAI transcription endpoint: /transcribe-api."""

import asyncio
import json
import logging
import os
import tempfile

import mlx_whisper
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

from audio import extract_audio_segment
from config import ASSEMBLYAI_API_KEY, MAX_UPLOAD_BYTES, WHISPER_MODEL_PATH
from dialects import get_dialect_config
from hallucination import process_transcription

router = APIRouter()


@router.post("/transcribe-api")
async def transcribe_api(
    file: UploadFile = File(...),
    lang: str = Form("auto"),
    region: str = Form("limburgs"),
):
    """Step 1 (API): AssemblyAI transcription with speaker diarization -- streams segments as SSE."""
    if not ASSEMBLYAI_API_KEY:
        raise HTTPException(status_code=400, detail="AssemblyAI API key not configured")

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
    logger.info("AssemblyAI received file: %s, size: %.1f MB, lang: %s", file.filename, size_mb, lang)
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

        def _assemblyai_worker():
            try:
                import assemblyai as aai

                aai.settings.api_key = ASSEMBLYAI_API_KEY

                config_kwargs = {
                    "speaker_labels": True,
                    "language_detection": lang == "auto",
                    "speech_models": ["universal-3-pro", "universal-2"],
                    "redact_pii": True,
                    "redact_pii_policies": [
                        aai.PIIRedactionPolicy.person_name,
                        aai.PIIRedactionPolicy.phone_number,
                        aai.PIIRedactionPolicy.email_address,
                        aai.PIIRedactionPolicy.date_of_birth,
                        aai.PIIRedactionPolicy.medical_process,
                        aai.PIIRedactionPolicy.medical_condition,
                    ],
                    "redact_pii_sub": aai.PIISubstitutionPolicy.entity_name,
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

                logger.info("AssemblyAI starting transcription...")
                transcript = transcriber.transcribe(tmp_path, config=config)

                if transcript.status == aai.TranscriptStatus.error:
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        f"data: {json.dumps({'type': 'error', 'message': transcript.error or 'AssemblyAI transcription failed'})}\n\n",
                    )
                    return

                detected_lang = (
                    transcript.json_response.get("language_code", "nl")
                    if transcript.json_response
                    else "nl"
                )
                logger.info("AssemblyAI detected language: %s", detected_lang)
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
                                        temperature=(0.0, 0.2, 0.4),
                                    )
                                    text = whisper_res.get("text", "").strip()
                                except Exception as we:
                                    logger.exception("Hybrid Whisper re-transcription error: %s", we)
                                finally:
                                    if os.path.exists(chunk_path):
                                        os.unlink(chunk_path)

                        if text:
                            # Apply hallucination detection (TRANS-03)
                            try:
                                hallucination_result = process_transcription(text)
                                if hallucination_result["was_modified"]:
                                    logger.info("Hallucination detected: %d issue(s) in utterance, cleaned", len(hallucination_result["hallucinations"]))
                                    text = hallucination_result["cleaned_text"]
                            except Exception as e:
                                logger.warning("Hallucination detection failed, using unfiltered text: %s", e)

                            if text:  # Only send if text remains after cleaning
                                word_count += len(text.split())
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    f"data: {json.dumps({'type': 'segment', 'text': text, 'speaker': utterance.speaker})}\n\n",
                                )
                    logger.info("Hybrid transcription: %d words, %d utterances", word_count, len(utterances))
                else:
                    # Fallback: no utterances, use full text
                    text = (transcript.text or "").strip()
                    if text:
                        # Apply hallucination detection (TRANS-03)
                        try:
                            hallucination_result = process_transcription(text)
                            if hallucination_result["was_modified"]:
                                logger.info("Hallucination detected: %d issue(s), cleaned", len(hallucination_result["hallucinations"]))
                                text = hallucination_result["cleaned_text"]
                        except Exception as e:
                            logger.warning("Hallucination detection failed, using unfiltered text: %s", e)

                        if text:  # Only send if text remains after cleaning
                            logger.info("AssemblyAI transcription: %d words (no diarization)", len(text.split()))
                            loop.call_soon_threadsafe(
                                queue.put_nowait,
                                f"data: {json.dumps({'type': 'segment', 'text': text})}\n\n",
                            )

                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    f"data: {json.dumps({'type': 'done'})}\n\n",
                )
            except Exception as e:
                logger.exception("AssemblyAI worker error: %s", e)
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
