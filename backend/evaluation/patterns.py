"""Error pattern extraction from WER alignment."""
from jiwer import process_words
import jiwer

_BASE_TRANSFORMS = [
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
]

WORD_NORM = jiwer.Compose([*_BASE_TRANSFORMS, jiwer.ReduceToListOfListOfWords()])
TEXT_NORM = jiwer.Compose(_BASE_TRANSFORMS)

def extract_error_patterns(reference: str, hypothesis: str) -> dict:
    """Extract S/D/I counts from alignment."""
    output = process_words(
        reference, hypothesis,
        reference_transform=WORD_NORM,
        hypothesis_transform=WORD_NORM
    )
    ref_words = TEXT_NORM(reference).split()
    total = len(ref_words)
    errors_total = output.substitutions + output.deletions + output.insertions
    return {
        "substitutions": output.substitutions,
        "deletions": output.deletions,
        "insertions": output.insertions,
        "total_words": total,
        "error_rate": errors_total / total if total > 0 else 0.0,
        "details": categorize_errors(reference, hypothesis),
    }

def categorize_errors(reference: str, hypothesis: str) -> list[dict]:
    """Return list of individual errors with type and context.

    Uses jiwer's process_words alignment to extract word-level edits.
    """
    output = process_words(
        reference, hypothesis,
        reference_transform=WORD_NORM,
        hypothesis_transform=WORD_NORM
    )
    errors = []
    ref_words = TEXT_NORM(reference).split()
    hyp_words = TEXT_NORM(hypothesis).split()

    for chunk in output.alignments[0]:
        if chunk.type == "substitute":
            for r_idx, h_idx in zip(
                range(chunk.ref_start_idx, chunk.ref_end_idx),
                range(chunk.hyp_start_idx, chunk.hyp_end_idx)
            ):
                errors.append({
                    "type": "substitution",
                    "expected": ref_words[r_idx],
                    "actual": hyp_words[h_idx],
                })
        elif chunk.type == "delete":
            for r_idx in range(chunk.ref_start_idx, chunk.ref_end_idx):
                errors.append({
                    "type": "deletion",
                    "expected": ref_words[r_idx],
                    "actual": "",
                })
        elif chunk.type == "insert":
            for h_idx in range(chunk.hyp_start_idx, chunk.hyp_end_idx):
                errors.append({
                    "type": "insertion",
                    "expected": "",
                    "actual": hyp_words[h_idx],
                })
    return errors
