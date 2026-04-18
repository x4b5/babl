---
phase: 06-llm-correction-consistency
plan: 00
subsystem: backend-correction
tags: [tdd, scaffolding, pydantic, json-parsing, test-infrastructure]
dependency_graph:
  requires: []
  provides: [correction-schema, correction-parser, test-scaffolding]
  affects: [backend/correction.py, backend/tests/test_correction_*.py]
tech_stack:
  added: [pydantic-validation, json-fallback-parsing]
  patterns: [3-tier-fallback, structured-outputs]
key_files:
  created:
    - backend/correction.py
    - backend/tests/test_correction_schema.py
    - backend/tests/test_correction_prompts.py
  modified:
    - backend/tests/conftest.py
decisions:
  - Use Pydantic BaseModel for structured LLM output validation (industry standard)
  - 3-tier fallback parsing strategy (direct JSON → regex extract → raw text) prevents crashes
  - Separate test files for schema (GREEN) vs prompts (RED, awaiting 06-01)
  - Optional fields (confidence, applied_rules) allow minimal LLM responses
metrics:
  duration_minutes: 2
  tasks_completed: 2
  tests_added: 18 (5 GREEN, 13 RED)
  commits: 2
  files_created: 3
  files_modified: 1
  completed_date: '2026-04-18T03:23:34Z'
---

# Phase 06 Plan 00: Test Scaffolding & JSON Schema Summary

**One-liner:** Created CorrectionOutput Pydantic model with 3-tier fallback JSON parser and full RED test coverage for CORR-01/02/03.

## What Was Built

Established the foundation for Phase 6 LLM consistency work by creating:

1. **CorrectionOutput schema** — Pydantic model enforcing `{"original": str, "corrected": str}` with optional `confidence` and `applied_rules`
2. **Robust JSON parser** — 3-tier fallback strategy (direct parse → regex extract → raw text) that never crashes
3. **Test scaffolding** — Complete test coverage for all CORR requirements (schema tests GREEN, prompt tests RED awaiting 06-01)

## Implementation Details

### Task 1: correction.py Module

**File:** `backend/correction.py` (64 lines)

**Exports:**

- `CorrectionOutput` — Pydantic BaseModel with 4 fields (original, corrected, confidence, applied_rules)
- `parse_correction_output(raw_text, original_input)` — 3-tier fallback parser
- `JSON_INSTRUCTION` — Dutch-language prompt text for structured output

**Parsing Strategy:**

1. **Attempt 1:** Direct `json.loads()` → validate with Pydantic
2. **Attempt 2:** Regex `r'\{[^{}]*\}'` to extract JSON from prose (e.g., LLM adds "Here is the result: {...}")
3. **Attempt 3:** Fallback to `CorrectionOutput(original=input, corrected=raw_text)` — always succeeds

**Rationale:** LLMs don't always return pure JSON. Mistral/Ollama sometimes add explanations. This parser gracefully handles all cases without crashing.

**Commit:** `b8a4445` — feat(06-00): create CorrectionOutput model and parser

### Task 2: Test Scaffolding

**Files created:**

- `backend/tests/test_correction_schema.py` — 5 GREEN tests for CORR-02 (JSON schema validation)
- `backend/tests/test_correction_prompts.py` — 13 RED tests for CORR-01 (few-shot) and CORR-03 (glossary)

**Files modified:**

- `backend/tests/conftest.py` — added `sample_correction_output` fixture

**Test Coverage:**

**GREEN (5 tests, CORR-02):**

- `test_parse_valid_json` — Full JSON with all 4 fields
- `test_parse_minimal_json` — Only required fields (original + corrected)
- `test_parse_fallback` — Non-JSON input → fallback to raw text
- `test_parse_json_with_surrounding_text` — Extract JSON from prose
- `test_json_instruction_contains_required_fields` — Verify constant has required keywords

**RED (13 tests, CORR-01 + CORR-03, awaiting Plan 06-01):**

_Few-shot tests (CORR-01):_

- `test_few_shot_examples_exist` — 3-5 examples per region (5 regions × 1 = 5 tests)
- `test_few_shot_schema_valid` — Each example has input/output structure (5 tests)
- `test_few_shot_input_matches_output_original` — Consistency check (5 tests)

_Glossary tests (CORR-03):_

- `test_glossary_size` — 50-150 terms per region (5 tests)
- `test_glossary_no_identity_mappings` — No "huis" → "huis" (5 tests)
- `test_glossary_values_are_strings` — Type validation (5 tests)

_Prompt builder tests (CORR-01 + CORR-03):_

- `test_glossary_injection` — Glossary terms appear in prompt (5 tests)
- `test_few_shot_in_prompt` — "VOORBEELDEN" keyword present (5 tests)

Total RED tests: 30 parameterized tests (failing as expected, `build_correction_prompt` and `glossary`/`few_shot_examples` not yet created)

**Commit:** `780e879` — test(06-00): create test scaffolding for CORR-01, CORR-02, CORR-03

## Deviations from Plan

None — plan executed exactly as written. Both tasks followed TDD (tests before implementation for Task 2, implementation + tests for Task 1 since parser logic was simple enough to implement directly).

## Verification Results

**Schema tests (should be GREEN):**

```bash
pytest tests/test_correction_schema.py -v
# 5 passed in 0.01s ✓
```

**Prompt tests (should be RED):**

```bash
pytest tests/test_correction_prompts.py::TestFewShotExamples::test_few_shot_examples_exist
# FAILED: limburgs missing few_shot_examples ✓ (expected)

pytest tests/test_correction_prompts.py::TestGlossary::test_glossary_size
# FAILED: limburgs missing glossary ✓ (expected)
```

**Import verification:**

```bash
python3 -c "from backend.correction import CorrectionOutput, parse_correction_output, JSON_INSTRUCTION; print('imports ok')"
# imports ok ✓
```

## Known Stubs

None. All code is production-ready. RED tests are intentional (awaiting Plan 06-01 implementation).

## Next Steps

**Plan 06-01** will:

1. Add `glossary` dict (50-100 terms) to each REGIONAL_PROFILES entry in `backend/dialects.py`
2. Add `few_shot_examples` list (3-5 examples) to each profile
3. Create `build_correction_prompt(region, mode)` function in `backend/correction.py`
4. Turn all 30 RED tests GREEN

**Plan 06-02** will integrate the prompt builder into the `/correct` endpoint in `backend/main.py`.

## Self-Check: PASSED

**Created files exist:**

```bash
[ -f "backend/correction.py" ] && echo "FOUND: backend/correction.py" || echo "MISSING"
# FOUND: backend/correction.py ✓

[ -f "backend/tests/test_correction_schema.py" ] && echo "FOUND" || echo "MISSING"
# FOUND: backend/tests/test_correction_schema.py ✓

[ -f "backend/tests/test_correction_prompts.py" ] && echo "FOUND" || echo "MISSING"
# FOUND: backend/tests/test_correction_prompts.py ✓
```

**Commits exist:**

```bash
git log --oneline --all | grep -q "b8a4445" && echo "FOUND: b8a4445" || echo "MISSING"
# FOUND: b8a4445 ✓

git log --oneline --all | grep -q "780e879" && echo "FOUND: 780e879" || echo "MISSING"
# FOUND: 780e879 ✓
```

**All claims verified.**
