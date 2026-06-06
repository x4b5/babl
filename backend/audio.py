"""Audio utility functions: duration detection, segment extraction, offset filtering."""

import re
import subprocess

from config import OFFSET_TOLERANCE


def filter_segments_by_offset(
    segments: list[dict], offset: float, tolerance: float = OFFSET_TOLERANCE
) -> list[dict]:
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
    """Get duration of audio file in seconds.

    Uses ffprobe first (fast). Falls back to ffmpeg decoding for formats
    without duration metadata (e.g. WebM from MediaRecorder).
    """
    # Try ffprobe (fast, works for formats with duration in header)
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path,
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        duration = float(result.stdout.strip())
        if duration > 0:
            return duration
    except Exception:
        pass

    # Fallback: decode with ffmpeg to get duration (handles streaming WebM etc.)
    try:
        cmd = ["ffmpeg", "-i", path, "-f", "null", "-"]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        match = re.search(r'time=(\d+):(\d+):(\d+\.\d+)', result.stderr)
        if match:
            h, m, s = match.groups()
            return int(h) * 3600 + int(m) * 60 + float(s)
    except Exception:
        pass

    return 0.0


def extract_audio_segment(input_path: str, output_path: str, start: float, duration: float):
    """Extract and transcode a segment of audio using ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-ss", str(start), "-i", input_path,
        "-t", str(duration),
        "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        output_path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
