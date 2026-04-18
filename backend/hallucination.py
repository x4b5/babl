"""Hallucination detection for Whisper transcription output (TRANS-03).

Detects and filters common Whisper hallucination patterns:
1. Repetition: consecutive word/phrase repetitions (>= 5 repeats)
2. Phantom strings: known Whisper artifacts ("Thank you for watching", etc.)

Conservative thresholds to minimize false positives on legitimate speech.
"""
import re
from typing import List, Dict, Any


# Known Whisper hallucination phrases (case-insensitive matching)
PHANTOM_PATTERNS = [
    # English phantoms (most common Whisper hallucinations)
    "thank you for watching",
    "thanks for watching",
    "please subscribe",
    "please like and subscribe",
    "don't forget to subscribe",
    "see you in the next video",
    "see you next time",
    "if you enjoyed this video",
    # Dutch/German phantoms (relevant for NL/Limburgish audio)
    "ondertiteling door",
    "ondertitels door",
    "met dank aan",
    "vertaald door",
    "bewerkt door",
    "untertitel von",
    # Silence/filler phantoms (only match as complete text)
    "you",
    "...",
]


def detect_repetitions(text: str, min_repeat: int = 5) -> List[Dict[str, Any]]:
    """Detect consecutive word repetitions.

    Strategy: Split text into words. Scan for runs of identical words
    (case-insensitive) >= min_repeat. Also detect repeated phrases
    (2-3 word n-grams repeated >= min_repeat times consecutively).

    Args:
        text: Input text to analyze
        min_repeat: Minimum consecutive repetitions to flag (default: 5)

    Returns:
        List of hallucination dicts with type="repetition", matched text,
        start/end positions.
    """
    if not text or not text.strip():
        return []

    results = []
    words = text.split()

    if len(words) == 0:
        return []

    # Detect single-word repetitions
    i = 0
    while i < len(words):
        current_word = words[i].lower()
        count = 1
        j = i + 1

        # Count consecutive identical words (case-insensitive)
        while j < len(words) and words[j].lower() == current_word:
            count += 1
            j += 1

        if count >= min_repeat:
            # Found excessive repetition
            # Calculate character positions
            start_pos = len(" ".join(words[:i]))
            if i > 0:
                start_pos += 1  # Account for space before
            end_pos = start_pos + len(" ".join(words[i:j]))

            results.append({
                "type": "repetition",
                "matched": " ".join(words[i:j]),
                "start": start_pos,
                "end": end_pos,
            })

        i = j if count >= min_repeat else i + 1

    return results


def detect_phantoms(text: str) -> List[Dict[str, Any]]:
    """Detect known Whisper phantom strings.

    Strategy: Case-insensitive substring match against PHANTOM_PATTERNS.
    Special case: single-word phantoms (like "you") only match when they
    are the entire text (stripped).

    Args:
        text: Input text to analyze

    Returns:
        List of hallucination dicts with type="phantom", matched text,
        start/end positions.
    """
    if not text or not text.strip():
        return []

    results = []
    text_lower = text.lower()
    text_stripped = text.strip().lower()

    for pattern in PHANTOM_PATTERNS:
        # Special handling for single-word phantoms
        if len(pattern.split()) == 1:
            # Only match if it's the entire text
            if text_stripped == pattern:
                results.append({
                    "type": "phantom",
                    "matched": text.strip(),
                    "start": 0,
                    "end": len(text.strip()),
                })
        else:
            # Multi-word pattern: substring match
            if pattern in text_lower:
                start = text_lower.find(pattern)
                end = start + len(pattern)
                results.append({
                    "type": "phantom",
                    "matched": text[start:end],
                    "start": start,
                    "end": end,
                })

    return results


def detect_hallucinations(text: str) -> List[Dict[str, Any]]:
    """Run all hallucination detectors on text.

    Combines repetition and phantom detection. Returns all detected
    hallucinations with metadata.

    Args:
        text: Input text to analyze

    Returns:
        Combined list of all detected hallucinations.
        Each dict has: type, matched, start, end
    """
    if not text or not text.strip():
        return []

    results = []
    results.extend(detect_repetitions(text))
    results.extend(detect_phantoms(text))
    return results


def clean_hallucinations(text: str) -> str:
    """Remove hallucination content from text.

    Strategy:
    - Phantom strings: remove the matched substring
    - Repetitions: reduce to max 2 occurrences of the repeated word/phrase
    - Collapse resulting multiple spaces/newlines
    - Strip leading/trailing whitespace

    Args:
        text: Input text to clean

    Returns:
        Cleaned text with hallucinations removed
    """
    if not text or not text.strip():
        return text

    cleaned = text
    hallucinations = detect_hallucinations(text)

    # Sort by position (descending) to avoid offset issues when removing
    hallucinations.sort(key=lambda h: h["start"], reverse=True)

    for h in hallucinations:
        if h["type"] == "phantom":
            # Remove phantom string entirely
            cleaned = cleaned[:h["start"]] + cleaned[h["end"]:]
        elif h["type"] == "repetition":
            # Reduce repetition to max 2 occurrences
            words = h["matched"].split()
            if len(words) > 0:
                # Keep first word twice
                reduced = f"{words[0]} {words[0]}"
                cleaned = cleaned[:h["start"]] + reduced + cleaned[h["end"]:]

    # Collapse multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = cleaned.strip()

    return cleaned


def process_transcription(text: str) -> Dict[str, Any]:
    """Detect and clean hallucinations in one call.

    Full pipeline: detect hallucinations, clean if needed, return results
    with metadata.

    Args:
        text: Input transcription text

    Returns:
        {
            "cleaned_text": str,         # Cleaned version of input
            "hallucinations": list[dict], # List of detected hallucinations
            "was_modified": bool         # Whether cleaning changed the text
        }
    """
    hallucinations = detect_hallucinations(text)

    if not hallucinations:
        return {
            "cleaned_text": text,
            "hallucinations": [],
            "was_modified": False
        }

    cleaned = clean_hallucinations(text)

    return {
        "cleaned_text": cleaned,
        "hallucinations": hallucinations,
        "was_modified": cleaned != text
    }
