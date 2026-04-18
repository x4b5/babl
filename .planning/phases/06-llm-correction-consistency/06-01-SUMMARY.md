---
phase: 06-llm-correction-consistency
plan: 01
subsystem: backend
tags:
  - dialect
  - prompting
  - few-shot
  - glossary
  - llm-consistency
dependency_graph:
  requires:
    - 06-00 (CorrectionOutput schema and parse_correction_output)
  provides:
    - Region-specific few-shot examples (3-5 per region)
    - Expanded glossaries (50-100+ terms per region)
    - build_correction_prompt function
    - SYSTEM_PROMPTS centralized in correction.py
  affects:
    - backend/dialects.py
    - backend/correction.py
    - backend/main.py
tech_stack:
  added:
    - Few-shot prompting pattern
    - Glossary injection (key=value format)
  patterns:
    - Prompt assembly via build_correction_prompt
    - Region-specific examples with cultural markers
    - No identity mappings in glossaries
key_files:
  created: []
  modified:
    - backend/dialects.py (added few_shot_examples and glossary to all 5 regions)
    - backend/correction.py (added build_correction_prompt, _format_few_shot_examples, moved SYSTEM_PROMPTS)
    - backend/main.py (removed SYSTEM_PROMPTS, now imports from correction)
decisions:
  - Move SYSTEM_PROMPTS to correction.py as single source of truth (per plan D-09)
  - Glossary format is dict[str, str] with key=value rendering (per D-07, D-08)
  - Few-shot examples demonstrate JSON output format with optional applied_rules field
  - Most representative example placed last (research best practice)
  - No identity mappings allowed (dialect word must differ from standard Dutch)
metrics:
  completed_date: 2026-04-18T03:35:44Z
  duration_minutes: 9
  tasks_completed: 2
  files_modified: 3
  tests_added: 40
  tests_passing: 141
commits:
  - hash: 7259096
    message: 'feat(06-01): add few-shot examples and glossaries to all 5 regional profiles'
  - hash: 6a41dd5
    message: 'feat(06-01): add build_correction_prompt and move SYSTEM_PROMPTS to correction.py'
---

# Phase 06 Plan 01: Few-Shot Examples and Glossaries Summary

**One-liner:** Added 3-5 region-specific few-shot examples and 50-100+ term glossaries to all 5 dialect profiles, plus built the prompt assembly function with glossary injection.

## What Was Built

### Task 1: Regional Dialect Data Enhancement

Extended all 5 REGIONAL_PROFILES entries in `backend/dialects.py` with:

**Few-shot examples (3-5 per region):**

- `limburgs`: 3 general Limburgish examples
- `mestreechs`: 4 examples with French-influenced vocabulary (sjampetter, trottoir, paraplu, Vrijthof)
- `zittesj`: 3 examples with German-influenced vocabulary (richtig, zusamme, plötzlich, bitte)
- `venloos`: 3 examples reflecting Northern Limburgish (mótte, ouch, gans, closer to standard Dutch)
- `kirchroeadsj`: 4 examples with strong Ripuarian German influence (mure, uvver, wasser, tsimmer, d'r)

Each example demonstrates:

- Realistic dialect input (not toy sentences)
- Structured JSON output with `original` and `corrected` fields
- Optional `applied_rules` field (1-2 examples per region demonstrate this)
- Consistency: `input` field equals `output.original`

**Glossaries (50-100+ terms per region):**

- Built from existing `custom_spelling` dictionaries as foundation
- Extended with 30-80 additional high-frequency dialect terms
- Format: `dict[str, str]` mapping dialect word to standard Dutch
- Strict validation: no identity mappings (dialect ≠ dutch)
- Size range: 50-150 terms (per CORR-03 requirement)

Regional glossary sizes achieved:

- limburgs: 67 terms
- mestreechs: 68 terms
- zittesj: 58 terms
- venloos: 54 terms
- kirchroeadsj: 63 terms

### Task 2: Prompt Builder Implementation

Added to `backend/correction.py`:

**`_format_few_shot_examples(examples: list[dict]) -> str`**

- Formats examples for inclusion in system prompt
- Output format: numbered examples with Input/Output structure
- JSON output rendered with `json.dumps(indent=2, ensure_ascii=False)`

**`build_correction_prompt(region: str, report_length: str) -> tuple[str, str]`**

- Builds complete system prompt with glossary + few-shot examples
- Injects region-specific glossary in `key=value` format
- Appends formatted few-shot examples to base prompt
- Returns `(system_prompt, json_instruction)` tuple
- Fallback to "limburgs" profile if region not found
- Fallback to "middellang" length if not found

**Prompt centralization:**

- Moved `SYSTEM_PROMPTS`, `DIALECT_RETENTION_PROMPT`, `CLEANUP_PROMPT`, `SYSTEM_PROMPT` from `main.py` to `correction.py`
- `correction.py` is now the single source of truth for all prompt-related constants (per decision D-09)
- `main.py` imports these constants from `correction`
- No circular dependencies (dialects.py → correction.py → main.py)

## Verification Results

**All 40 correction prompt tests GREEN:**

- TestFewShotExamples (15 tests): All regions have 3-5 valid examples
- TestGlossary (15 tests): All regions have 50-150 terms, no identity mappings, all strings
- TestPromptBuilder (10 tests): Glossary injection works, few-shot examples included

**All 141 backend tests GREEN:**

- No regressions in existing functionality
- SYSTEM_PROMPTS correctly imported from correction.py
- All endpoints still functional

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

**Glossary construction challenges:**

- Initial implementation included identity mappings (e.g., "zich" → "zich", "plein" → "plein")
- Required careful filtering to ensure all glossary entries map dialect → different Dutch word
- Final implementation verified via automated tests

**Few-shot example design:**

- French-influenced examples for mestreechs: sjampetter (champignons), trottoir (sidewalk), paraplu (umbrella)
- German-influenced examples for zittesj: richtig (right/correct), zusamme (together), plötzlich (suddenly), bitte (please)
- Ripuarian examples for kirchroeadsj: mure (tomorrow), uvver (over), wasser (water), tsimmer (room)
- Most representative example placed last in array (per research finding on few-shot ordering)

**Prompt assembly pattern:**

1. Select region profile (fallback to "limburgs")
2. Select base prompt by length (fallback to "middellang")
3. Build glossary text as newline-separated `key=value` pairs
4. Replace `DIALECT_TRANSLATION_KEY` placeholder in base prompt
5. Append formatted few-shot examples if present
6. Return `(system_prompt, JSON_INSTRUCTION)` tuple

## Known Stubs

None. All functionality is fully implemented and tested.

## Self-Check: PASSED

**Files created:** None (all modifications to existing files)

**Files modified:**

- [x] backend/dialects.py exists and contains `few_shot_examples` and `glossary` keys
- [x] backend/correction.py exists and contains `build_correction_prompt`, `_format_few_shot_examples`, `SYSTEM_PROMPTS`
- [x] backend/main.py exists and imports from correction

**Commits verified:**

- [x] 7259096 exists: feat(06-01): add few-shot examples and glossaries to all 5 regional profiles
- [x] 6a41dd5 exists: feat(06-01): add build_correction_prompt and move SYSTEM_PROMPTS to correction.py

**Tests verified:**

- [x] All 40 test_correction_prompts.py tests GREEN
- [x] All 141 backend tests GREEN
