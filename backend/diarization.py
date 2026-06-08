"""Pyannote speaker diarization wrapper for local Whisper transcription.

Lazy-loads the pyannote/speaker-diarization-3.1 pipeline.
Requires HF_TOKEN environment variable (HuggingFace access token).
Runs on MPS (Apple Silicon) when available.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_pipeline = None
_pipeline_attempted = False


def get_diarization_pipeline():
    """Lazy-load the pyannote speaker diarization pipeline.

    Returns None if HF_TOKEN is not set or if loading fails.
    Only attempts loading once — subsequent calls return cached result.
    """
    global _pipeline, _pipeline_attempted

    if _pipeline_attempted:
        return _pipeline

    _pipeline_attempted = True

    hf_token = os.environ.get("HF_TOKEN", "")
    if not hf_token:
        logger.warning("HF_TOKEN not set — speaker diarization disabled")
        return None

    try:
        from pyannote.audio import Pipeline
        import torch

        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token,
        )

        if torch.backends.mps.is_available():
            _pipeline.to(torch.device("mps"))
            logger.info("Pyannote diarization pipeline loaded (MPS)")
        else:
            logger.info("Pyannote diarization pipeline loaded (CPU)")

    except Exception as e:
        logger.warning("Failed to load pyannote pipeline: %s", e)
        _pipeline = None

    return _pipeline


def is_diarization_available() -> bool:
    """Check if diarization is available without loading the pipeline."""
    if _pipeline is not None:
        return True
    hf_token = os.environ.get("HF_TOKEN", "")
    return bool(hf_token)


def diarize(audio_path: str, num_speakers: Optional[int] = None) -> list[dict]:
    """Run speaker diarization on an audio file.

    Args:
        audio_path: Path to audio file (WAV recommended).
        num_speakers: Optional hint for expected number of speakers.

    Returns:
        List of segments: [{"start": float, "end": float, "speaker": str}, ...]
        Empty list if diarization is unavailable or fails.
    """
    pipeline = get_diarization_pipeline()
    if pipeline is None:
        return []

    try:
        kwargs = {}
        if num_speakers is not None and num_speakers >= 2:
            kwargs["num_speakers"] = num_speakers

        diarization_result = pipeline(audio_path, **kwargs)

        segments = []
        for turn, _, speaker in diarization_result.itertracks(yield_label=True):
            segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker,
            })

        logger.info(
            "Diarization complete: %d segments, %d speakers",
            len(segments),
            len(set(s["speaker"] for s in segments)),
        )
        return segments

    except Exception as e:
        logger.exception("Diarization failed: %s", e)
        return []


def merge_transcription_with_diarization(
    whisper_segments: list[dict],
    diarization_segments: list[dict],
    time_offset: float = 0.0,
) -> list[dict]:
    """Merge Whisper segments with diarization speaker labels.

    For each Whisper segment, finds the speaker with the most temporal overlap.

    Args:
        whisper_segments: Whisper output segments with "start", "end", "text" keys.
        diarization_segments: Pyannote output with "start", "end", "speaker" keys.
        time_offset: Global time offset to add to Whisper segment timestamps
                     (used when processing audio in chunks).

    Returns:
        Whisper segments with added "speaker" field (letter: A, B, C, ...).
    """
    if not diarization_segments:
        return whisper_segments

    # Map raw speaker IDs to letters: SPEAKER_00 -> A, SPEAKER_01 -> B
    unique_speakers = sorted(set(s["speaker"] for s in diarization_segments))
    speaker_map = {s: chr(65 + i) for i, s in enumerate(unique_speakers)}

    result = []
    for seg in whisper_segments:
        seg_start = seg.get("start", 0.0) + time_offset
        seg_end = seg.get("end", 0.0) + time_offset

        # Find diarization segment with most overlap
        best_speaker = None
        best_overlap = 0.0

        for d_seg in diarization_segments:
            overlap_start = max(seg_start, d_seg["start"])
            overlap_end = min(seg_end, d_seg["end"])
            overlap = max(0.0, overlap_end - overlap_start)

            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = d_seg["speaker"]

        new_seg = dict(seg)
        if best_speaker is not None:
            new_seg["speaker"] = speaker_map[best_speaker]
        result.append(new_seg)

    return result
