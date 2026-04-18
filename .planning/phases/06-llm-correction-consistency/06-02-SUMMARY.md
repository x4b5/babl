---
phase: 06-llm-correction-consistency
plan: 02
subsystem: backend+frontend
tags:
  - correction
  - prompting
  - json-output
  - streaming
  - wiring
dependency_graph:
  requires:
    - 06-00 (CorrectionOutput, parse_correction_output)
    - 06-01 (build_correction_prompt, glossaries, few-shot examples)
  provides:
    - Live correction endpoints using structured prompts
    - JSON output accumulation and parsing in both paths
    - Region-specific glossary and few-shot injection
  affects:
    - backend/main.py
    - src/routes/api/correct/+server.ts
tech_stack:
  patterns:
    - JSON accumulation pattern (silent accumulate, parse, emit corrected text)
    - Ollama format parameter for structured JSON output
    - 3-tier JSON parse fallback (direct → regex extract → raw text)
key_files:
  created:
    - .planning/phases/06-llm-correction-consistency/06-02-SUMMARY.md
  modified:
    - backend/main.py (build_correction_prompt wiring, JSON schema, accumulation)
    - src/routes/api/correct/+server.ts (glossary, few-shot, JSON handling)
decisions:
  - JSON tokens accumulated silently per chunk, parsed, only corrected text emitted to user
  - Ollama uses format parameter with CorrectionOutput.model_json_schema() for structured output
  - Frontend glossaries manually synced from backend/dialects.py (per D-09)
  - useJson flag controls accumulation vs direct streaming behavior
metrics:
  completed_date: 2026-04-18T06:00:00Z
  tasks_completed: 2
  files_modified: 2
  tests_passing: 141
commits: []
---

# Phase 06 Plan 02: Wire Prompt Builder into Endpoints Summary

**One-liner:** Connected the prompt infrastructure (glossary, few-shot examples, JSON output validation) to both live correction endpoints — backend `/correct` (Ollama + Mistral) and frontend `/api/correct` (Vercel Mistral).

## What Was Built

### Task 1: Backend /correct Endpoint Updates

Updated `backend/main.py` with three changes:

**1. `correct_chunk_stream` — JSON schema parameter:**

- Added `json_schema: dict | None = None` parameter
- When provided, sets `"format"` key in Ollama request body for structured JSON output
- Ollama will constrain generation to match the CorrectionOutput schema

**2. `/correct` endpoint — prompt assembly:**

- Replaced manual system prompt construction with `build_correction_prompt(req.region, req.report_length)` for Limburgish (`language == "li"`)
- Non-Limburgish languages fall back to standard SYSTEM_PROMPTS
- Returns `(system_prompt, json_instr)` tuple

**3. `generate()` — JSON accumulation and validation:**

- Added `use_json` flag: `True` when `json_instr` is set AND `keep_dialect` is False
- Both API (Mistral) and local (Ollama) paths:
  - When `use_json`: accumulate tokens silently per chunk, parse with `parse_correction_output`, emit `validated.corrected`
  - When not `use_json`: stream tokens directly (existing behavior preserved)
- Ollama path passes `CorrectionOutput.model_json_schema()` as `json_schema` parameter

### Task 2: Frontend /api/correct Endpoint Updates

Updated `src/routes/api/correct/+server.ts` with:

**1. Data constants (synced from backend/dialects.py):**

- `DIALECT_GLOSSARIES`: All 5 regions with 50-70 terms each
- `FEW_SHOT_EXAMPLES`: All 5 regions with 3-4 examples each
- `JSON_INSTRUCTION`: Output format instruction for JSON response
- `FewShotExample` interface

**2. Helper functions:**

- `formatGlossary(region)`: Formats glossary as `key=value` lines
- `formatFewShotExamples(region)`: Formats numbered examples with JSON output
- `parseCorrectionOutput(rawText)`: 3-tier JSON parse with fallback

**3. POST handler updates:**

- Added `region = 'limburgs'` to body destructuring
- System prompt enrichment for Limburgish: glossary + few-shot examples + JSON instruction appended
- `useJson` flag controls streaming behavior

**4. Streaming loop:**

- When `useJson`: accumulate all tokens per chunk, parse with `parseCorrectionOutput`, emit corrected text as single token
- When not `useJson`: stream tokens directly (existing behavior)

## Verification Results

- `npm run check`: 0 errors, 1 warning (existing a11y autofocus)
- `python -m pytest tests/ -x`: All 141 backend tests GREEN
- No regressions in any path

## Deviations from Plan

Minor simplification: the plan suggested replacing `DIALECT_TRANSLATION_KEY` in the system prompt via regex. Instead, the glossary and examples are simply appended to the base prompt, which is cleaner and avoids regex fragility.

## Self-Check: PASSED

**Acceptance criteria verified:**

- [x] backend/main.py contains `build_correction_prompt(` call in /correct endpoint
- [x] backend/main.py contains `parse_correction_output(` call in generate()
- [x] correct_chunk_stream has `json_schema` parameter
- [x] Ollama uses `format` parameter with JSON schema
- [x] src/routes/api/correct/+server.ts contains `DIALECT_GLOSSARIES` with 5 region keys
- [x] src/routes/api/correct/+server.ts contains `FEW_SHOT_EXAMPLES` with 5 region keys
- [x] src/routes/api/correct/+server.ts contains `formatGlossary` and `formatFewShotExamples`
- [x] src/routes/api/correct/+server.ts contains `JSON_INSTRUCTION`
- [x] src/routes/api/correct/+server.ts accepts `region` parameter
- [x] src/routes/api/correct/+server.ts contains JSON.parse fallback logic
- [x] `npm run check` exits 0
- [x] `pytest tests/ -x` exits 0 (141 tests pass)
