# Phase 4: Evaluation Infrastructure - Research

**Researched:** 2026-04-17
**Domain:** Speech recognition quality measurement and error analysis
**Confidence:** HIGH

## Standard Stack

### Core Libraries

| Library                  | Purpose                                     | Install                                 |
| ------------------------ | ------------------------------------------- | --------------------------------------- |
| jiwer 3.1.1              | WER/CER calculation (de facto ASR standard) | `pip install jiwer==3.1.1`              |
| python-json-logger 3.2.1 | Structured JSONL output                     | `pip install python-json-logger==3.2.1` |

### What AssemblyAI Already Provides

- Word-level confidence scores (0.0-1.0) are included in transcript responses
- No custom estimation needed — just extract `words[].confidence` from the API response
- Threshold <0.7 for "low confidence" is industry standard

### Local Mode (Whisper)

- mlx-whisper does NOT provide word-level confidence scores
- Fallback: skip confidence highlighting in local mode, or use segment-level log probabilities

## Architecture

### Backend Module Structure

```
backend/evaluation/
  ├── __init__.py
  ├── metrics.py       # WER/CER using jiwer
  ├── logger.py        # JSONL logging (append-only file)
  └── patterns.py      # Error pattern analysis (substitution/deletion/insertion counts)
```

### WER/CER Calculation Pattern

```python
from jiwer import wer, cer, process_words
import jiwer

transformation = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
    jiwer.RemovePunctuation()
])

# reference = what user corrected it to (ground truth)
# hypothesis = what Whisper/AssemblyAI produced (raw transcription)
output = process_words(reference, hypothesis,
    truth_transform=transformation,
    hypothesis_transform=transformation)

# output.substitutions, output.deletions, output.insertions
# output.wer → float
```

### Data Flow

1. AssemblyAI returns transcript with word-level confidence
2. Backend extracts confidence scores, sends to frontend via existing SSE
3. User sees transcript with confidence highlighting
4. User provides ground truth (corrected text) or thumbs up/down
5. Backend calculates WER/CER against ground truth
6. Results logged to JSONL file per session

### JSONL Schema

```jsonl
{
	"timestamp": "2026-04-17T10:00:00Z",
	"session_id": "abc123",
	"dialect_region": "maastrichts",
	"wer": 0.35,
	"cer": 0.22,
	"substitutions": 5,
	"deletions": 2,
	"insertions": 1,
	"total_words": 42,
	"low_confidence_count": 8,
	"feedback": "thumbs_up"
}
```

### Frontend Components (Svelte 5)

| Component           | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| ConfidenceHighlight | Renders words with visual marker for confidence <0.7 |
| EvaluationScore     | Shows WER/CER scores after comparison                |
| FeedbackWidget      | Thumbs up/down + optional inline corrections         |

## Key Decisions

1. **WER calculated on backend** — avoids UI blocking (O(m\*n) alignment), consistent across modes
2. **Ground truth from user corrections** — Phase 7 will close the feedback loop, but infrastructure ready now
3. **JSONL over database** — simpler, no schema migrations, easy to export for analysis
4. **Privacy: never log transcription content** — only aggregate metrics (counts, scores)
5. **Confidence highlighting: API mode only** — local Whisper lacks word-level confidence

## Pitfalls

1. **Don't compare raw vs. corrected text for WER** — WER needs ground truth reference, not the LLM correction
2. **Don't log transcription content** — privacy violation per CLAUDE.md
3. **Don't block UI on WER calculation** — compute on backend, send scores via SSE
4. **Don't ignore text normalization** — use jiwer transformations before comparison
5. **Don't build custom confidence estimation** — AssemblyAI already provides it

## Validation Architecture

### Testable Claims

| Claim                        | How to verify                                 |
| ---------------------------- | --------------------------------------------- |
| WER/CER calculated correctly | Unit test: known input → expected score       |
| Error patterns extracted     | Unit test: process_words returns S/D/I counts |
| Confidence filtering works   | Unit test: words with confidence <0.7 marked  |
| JSONL appended correctly     | Integration test: write + read back           |
| Privacy preserved            | Grep: no raw text in JSONL output             |

### Coverage Requirements

- `backend/evaluation/metrics.py` — 90%+ (pure computation)
- `backend/evaluation/logger.py` — 80%+ (I/O)
- `backend/evaluation/patterns.py` — 90%+ (pure computation)
- Frontend components — visual testing (manual)

## Open Questions

1. **WER ground truth timing** — User correction (from LLM) is NOT ground truth. Real ground truth requires user-verified text. For now: log metrics infrastructure, defer actual WER comparison to Phase 7 when feedback loop exists.
2. **Confidence in local mode** — Whisper segment-level logprobs exist but are unreliable for word-level confidence. Decision: show "confidence niet beschikbaar in lokale modus."

## Sources

- [jiwer documentation](https://jitsi.github.io/jiwer/usage/)
- [AssemblyAI confidence FAQ](https://www.assemblyai.com/docs/faq/how-are-word-transcript-level-confidence-scores-calculated)
- [JSONL specification](https://jsonlines.org/)

---

_Phase: 04-evaluation-infrastructure_
_Research completed: 2026-04-17_
