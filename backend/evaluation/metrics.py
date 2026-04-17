"""WER/CER calculation using jiwer library."""
from jiwer import wer, cer, process_words
import jiwer

# Text normalization: lowercase, strip punctuation, collapse whitespace
_BASE_TRANSFORMS = [
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
]

# Word-level normalization (for WER and process_words)
WORD_NORM = jiwer.Compose([*_BASE_TRANSFORMS, jiwer.ReduceToListOfListOfWords()])

# Character-level normalization (for CER)
CHAR_NORM = jiwer.Compose([*_BASE_TRANSFORMS, jiwer.ReduceToListOfListOfChars()])

# For splitting reference into words (plain string output)
TEXT_NORM = jiwer.Compose(_BASE_TRANSFORMS)

def calculate_wer(reference: str, hypothesis: str) -> float:
    """Calculate Word Error Rate. Returns 0.0-1.0+."""
    if not reference.strip():
        raise ValueError("Reference text cannot be empty")
    return wer(
        reference, hypothesis,
        reference_transform=WORD_NORM,
        hypothesis_transform=WORD_NORM
    )

def calculate_cer(reference: str, hypothesis: str) -> float:
    """Calculate Character Error Rate. Returns 0.0-1.0+."""
    if not reference.strip():
        raise ValueError("Reference text cannot be empty")
    return cer(
        reference, hypothesis,
        reference_transform=CHAR_NORM,
        hypothesis_transform=CHAR_NORM
    )

def calculate_metrics(reference: str, hypothesis: str) -> dict:
    """Calculate all metrics including detailed alignment."""
    output = process_words(
        reference, hypothesis,
        reference_transform=WORD_NORM,
        hypothesis_transform=WORD_NORM
    )
    ref_words = TEXT_NORM(reference).split()
    return {
        "wer": output.wer,
        "cer": calculate_cer(reference, hypothesis),
        "substitutions": output.substitutions,
        "deletions": output.deletions,
        "insertions": output.insertions,
        "total_words": len(ref_words),
    }
