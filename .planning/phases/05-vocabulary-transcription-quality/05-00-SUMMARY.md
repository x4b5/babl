---
phase: 05-vocabulary-transcription-quality
plan: 00
subsystem: backend-testing
tags: [tdd, red-phase, fixtures, dialect-tests, hallucination-tests]
dependency_graph:
  requires: [backend/dialects.py, backend/tests/__init__.py]
  provides:
    [backend/tests/conftest.py, backend/tests/test_dialects.py, backend/tests/test_hallucination.py]
  affects: []
tech_stack:
  added: [pytest-fixtures, parametrized-tests]
  patterns: [red-green-refactor, tdd-first]
key_files:
  created:
    - backend/tests/conftest.py
    - backend/tests/test_dialects.py
    - backend/tests/test_hallucination.py
  modified: []
decisions:
  - Use pytest fixtures in conftest.py for shared test data
  - Parametrize tests over all 5 regional dialect keys
  - Set minimum thresholds: 50 word_boost, 15 custom_spelling per region
  - Define hallucination detection interface before implementation
metrics:
  duration: 140s (2 minutes)
  completed: 2026-04-18T01:12:20Z
  tasks: 3
  files: 3
---

# Phase 05 Plan 00: Test Scaffolding for Dialect Vocabulary & Hallucination Detection

## One-liner

RED tests for TRANS-01 (word_boost counts), TRANS-02 (custom_spelling coverage), and TRANS-03 (hallucination detection) — all fail as expected, ready for GREEN implementation.

## Objective

Create test scaffolding for Phase 5 dialect vocabulary and hallucination detection, following TDD pattern. Tests define expected behavior and FAIL initially (RED state), ready to go GREEN when Plans 01 and 02 implement the features.

## Changes Made

### Task 1: Created shared pytest fixtures (commit 7f7934b)

**File:** `backend/tests/conftest.py`

Created shared fixtures for all Phase 5 tests:

1. **`sample_dialect_config`**: Returns dict matching `get_dialect_config()` output shape with all required keys (initial_prompt, word_boost, custom_spelling, translation_key)

2. **`all_region_keys`**: Returns list of all 5 regional dialect keys (limburgs, mestreechs, zittesj, venloos, kirchroeadsj)

3. **`hallucination_test_strings`**: Returns 8 test cases covering:
   - Clean text (no hallucinations)
   - Excessive repetition ("ja ja ja..." 15x)
   - Whisper phantom phrases ("Thank you for watching...")
   - Dutch phantom phrases ("Ondertiteling door...")
   - Mixed legitimate + phantom content
   - Legitimate short repeats (should NOT be flagged)
   - Empty string
   - Nonsense loops

Follows existing test pattern with `sys.path.insert(0, str(Path(__file__).parent.parent))` for backend imports.

### Task 2: Created RED tests for dialect profile audit (commit 4d9f9a4)

**File:** `backend/tests/test_dialects.py`

Created 12 tests across 3 test classes:

**TestWordBoost (TRANS-01):**

- `test_minimum_word_boost_count`: ≥50 entries per region (currently 5-6, **FAILS RED**)
- `test_maximum_word_boost_count`: ≤100 entries per region (upper bound)
- `test_combined_boost_under_300`: Generic + regional ≤300 total
- `test_no_duplicate_word_boost`: No duplicates within region
- `test_word_boost_entries_are_nonempty_strings`: Validation

**TestCustomSpelling (TRANS-02):**

- `test_minimum_custom_spelling_count`: ≥15 entries per region (currently 3-5, **FAILS RED**)
- `test_custom_spelling_values_are_lists`: AssemblyAI format validation
- `test_mestreechs_has_accent_variants`: Known pronunciation variants coverage
- `test_no_circular_mappings`: Prevent circular replacement loops

**TestGetDialectConfig (Integration):**

- `test_returns_required_keys`: All 4 keys present
- `test_limburgs_word_boost_minimum`: Config has ≥50 entries
- `test_unknown_region_falls_back`: Fallback to "limburgs" for unknown regions

All tests parametrized over 5 regions using `@pytest.mark.parametrize`.

**Current state:** Tests run but **FAIL** with assertions like "mestreechs has only 6 word_boost entries, need >= 50" — confirming RED state.

### Task 3: Created RED tests for hallucination detection (commit 370acf8)

**File:** `backend/tests/test_hallucination.py`

Created 16 tests across 4 test classes:

**TestRepetitionDetection:**

- `test_no_repetition_returns_empty`: Clean text → empty list
- `test_excessive_repetition_detected`: 15x repeat → hallucination detected
- `test_nonsense_loop_detected`: "hallo hallo..." → detected
- `test_legitimate_short_repeat_not_flagged`: "ja ja dat klopt ja" → NOT flagged
- `test_empty_string_returns_empty`: Empty → empty list

**TestPhantomDetection:**

- `test_english_phantom_detected`: "Thank you for watching" → detected
- `test_dutch_phantom_detected`: "Ondertiteling door..." → detected
- `test_mixed_content_detects_phantom`: Mixed content → phantom detected

**TestCleanHallucinations:**

- `test_clean_text_unchanged`: Clean → unchanged
- `test_phantom_stripped`: Phantom phrase → removed
- `test_mixed_preserves_legitimate`: Legitimate text preserved, phantoms removed
- `test_repetition_cleaned`: Excessive repetition → reduced

**TestProcessTranscription (Pipeline):**

- `test_returns_required_keys`: Returns dict with cleaned_text, hallucinations, was_modified
- `test_clean_text_not_modified`: Clean text → was_modified=False
- `test_phantom_text_is_modified`: Phantom → was_modified=True
- `test_mixed_content_processed`: Mixed → cleaned_text has legitimate content only

**Current state:** Tests **FAIL** with `ImportError: No module named 'hallucination'` — confirming RED state. Module does not exist yet.

## Verification Results

Ran all verification checks from plan:

1. ✅ `pytest tests/test_dialects.py -x -q`: Runs but FAILS on word_boost count assertions (RED)
2. ✅ `pytest tests/test_hallucination.py --co -q`: Collection fails with ImportError (RED)
3. ✅ `python -c "import tests.conftest"`: Loads OK
4. ✅ `pytest tests/test_offset_filter.py tests/test_heartbeat.py -x -q`: 19 passed (existing tests unaffected)

## Deviations from Plan

None — plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None. These are test files defining expected behavior — no stubs.

## Next Steps

1. **Plan 05-01** will expand dialect profiles in `backend/dialects.py`:
   - Add ≥50 word_boost entries per region (currently 5-6)
   - Add ≥15 custom_spelling entries per region (currently 3-5)
   - Tests will go GREEN

2. **Plan 05-02** will create `backend/hallucination.py` module:
   - Implement `detect_hallucinations()`, `clean_hallucinations()`, `process_transcription()`
   - Tests will go GREEN

## Traceability

**Requirements covered:**

- TRANS-01: Word boost vocabulary targets (test scaffolding)
- TRANS-02: Multi-pronunciation custom_spelling (test scaffolding)
- TRANS-03: Hallucination detection (test scaffolding)

**Dependencies:**

- Requires: `backend/dialects.py` (existing), pytest framework
- Provides: Test scaffolding for Plans 01 and 02
- Blocks: Plan 05-01 (dialect expansion), Plan 05-02 (hallucination detection)

## Self-Check: PASSED

### Created files exist

```bash
[ -f "backend/tests/conftest.py" ] && echo "FOUND: backend/tests/conftest.py"
```

FOUND: backend/tests/conftest.py

```bash
[ -f "backend/tests/test_dialects.py" ] && echo "FOUND: backend/tests/test_dialects.py"
```

FOUND: backend/tests/test_dialects.py

```bash
[ -f "backend/tests/test_hallucination.py" ] && echo "FOUND: backend/tests/test_hallucination.py"
```

FOUND: backend/tests/test_hallucination.py

### Commits exist

```bash
git log --oneline --all | grep -q "7f7934b" && echo "FOUND: 7f7934b"
```

FOUND: 7f7934b

```bash
git log --oneline --all | grep -q "4d9f9a4" && echo "FOUND: 4d9f9a4"
```

FOUND: 4d9f9a4

```bash
git log --oneline --all | grep -q "370acf8" && echo "FOUND: 370acf8"
```

FOUND: 370acf8

All files and commits verified. Test scaffolding complete and ready for GREEN implementation.
