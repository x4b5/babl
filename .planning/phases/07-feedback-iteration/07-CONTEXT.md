# Phase 07: Feedback & Iteration — Context

## Goal

Close the loop with user feedback and data-driven prompt improvements.

## Requirements

- **FEED-01**: Gebruiker kan correcties terugsturen (opt-in) die de glossary en word boost voeden
- **FEED-02**: Prompt templates zijn versioned en kunnen A/B getest worden op kwaliteit
- **FEED-03**: Tekst-chunks overlappen (50-100 woorden) zodat context behouden blijft bij lange transcripties

## Success Criteria

1. Gebruiker kan correcties terugsturen (opt-in) via feedback UI
2. Feedback voedt glossary en word boost lijsten voor iteratieve verbetering
3. Prompt templates zijn versioned en kunnen A/B getest worden op kwaliteit
4. Tekst-chunks overlappen (50-100 woorden) zodat context behouden blijft
5. Productie WER metrics worden gemonitord voor regressie detectie

## Existing Infrastructure

### What we have (from Phases 4-6)

- **FeedbackWidget** (`src/lib/components/FeedbackWidget.svelte`): Thumbs up/down, calls `/evaluate` + `/evaluate/log`
- **EvaluationScore** (`src/lib/components/EvaluationScore.svelte`): Displays WER/CER
- **Backend /evaluate**: `POST /evaluate` (WER/CER calc), `POST /evaluate/log` (JSONL), `GET /evaluate/history`
- **JSONL logger** (`backend/evaluation/logger.py`): Daily rotation, privacy-first (no raw text)
- **WER/CER metrics** (`backend/evaluation/metrics.py`): jiwer-based calculation
- **Error patterns** (`backend/evaluation/patterns.py`): S/D/I categorization
- **Prompt builder** (`backend/correction.py`): `build_correction_prompt(region, report_length)`, `SYSTEM_PROMPTS`
- **Dialect profiles** (`backend/dialects.py`): 5 regions with `word_boost`, `custom_spelling`, `glossary`, `few_shot_examples`
- **CorrectionOutput** (`backend/correction.py`): Pydantic model, `parse_correction_output`

### What's missing

- **No prompt versioning** — prompts are hardcoded constants, no version tracking
- **No A/B testing** — no variant assignment or tracking
- **No chunk overlap** — `split_into_chunks` does sequential splits, no overlap
- **No inline correction UI** — FeedbackWidget only does thumbs up/down
- **No correction storage** — no mechanism to store user-submitted corrections
- **No glossary update pipeline** — no way for feedback to feed into glossary/word_boost
- **No production WER monitoring** — JSONL logs exist but no aggregation/alerting

### Known blocker

FeedbackWidget only calls `localhost:8000/evaluate` — no SvelteKit API route fallback for deployed (Vercel) mode.

## Plan Structure

| Plan  | Wave | Focus                                        | Requirements              |
| ----- | ---- | -------------------------------------------- | ------------------------- |
| 07-00 | 0    | Test scaffolding                             | FEED-01, FEED-02, FEED-03 |
| 07-01 | 1    | Chunk overlap for context preservation       | FEED-03                   |
| 07-02 | 1    | Prompt versioning + WER monitoring           | FEED-02                   |
| 07-03 | 2    | User correction feedback + glossary pipeline | FEED-01                   |

## Key Files

- `backend/main.py` — FastAPI endpoints (split_into_chunks, /correct, /evaluate)
- `backend/correction.py` — Prompt constants, build_correction_prompt, parse_correction_output
- `backend/dialects.py` — REGIONAL_PROFILES with word_boost, glossary, few_shot_examples
- `backend/evaluation/logger.py` — JSONL logging
- `backend/evaluation/metrics.py` — WER/CER calculation
- `src/routes/api/correct/+server.ts` — Vercel Mistral endpoint (splitIntoChunks)
- `src/lib/components/FeedbackWidget.svelte` — Existing feedback UI
- `src/lib/components/EvaluationScore.svelte` — WER/CER display
- `src/routes/transcribe/+page.svelte` — Main app page
