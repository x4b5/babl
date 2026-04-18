# Plan 07-02 Summary: Prompt Versioning + WER Monitoring (FEED-02) + User Corrections (FEED-01)

**Status**: Complete
**Completed**: 2026-04-18

## What was built

### Prompt Versioning (FEED-02)

- `PROMPT_VERSION = "v1.0"` in `correction.py` — increment when prompts/glossaries change
- `get_prompt_version()` function for consistent access
- `/evaluate/log` now includes `prompt_version` in every logged entry
- `/evaluate/summary` endpoint — aggregated WER stats (mean, p50, p95, mean CER, count) with current prompt version

### WER Monitoring (FEED-02)

- `get_wer_summary(log_dir, dialect_region, limit)` in `evaluation/logger.py`
- Returns `{mean_wer, p50_wer, p95_wer, mean_cer, count}` for regression detection

### User Correction Storage (FEED-01)

- `log_correction()` in `evaluation/logger.py` — stores user-submitted corrections to `corrections-YYYY-MM-DD.jsonl`
- `read_corrections()` — reads stored corrections with optional dialect_region filter
- `POST /corrections` endpoint — accepts user corrections
- `GET /corrections` endpoint — reads stored corrections

### Glossary Suggestions (FEED-01)

- `evaluation/suggestions.py` — new module
- `extract_correction_pairs(original, system_correction, user_correction)` — word-level diff to identify dialect→Dutch mappings
- `suggest_glossary_updates(corrections, region)` — aggregates patterns, compares with current glossary, suggests additions/updates
- `GET /corrections/suggestions` endpoint — returns suggested glossary updates based on accumulated corrections

### Endpoints Added

| Method | Path                       | Purpose                               |
| ------ | -------------------------- | ------------------------------------- |
| GET    | `/evaluate/summary`        | Aggregated WER stats (FEED-02)        |
| POST   | `/corrections`             | Store user correction (FEED-01)       |
| GET    | `/corrections`             | List stored corrections (FEED-01)     |
| GET    | `/corrections/suggestions` | Glossary update suggestions (FEED-01) |

### Tests

- 8 tests in `test_prompt_versioning.py` — all passing
- 14 tests in `test_user_corrections.py` — all passing
- 170 total backend tests passing
