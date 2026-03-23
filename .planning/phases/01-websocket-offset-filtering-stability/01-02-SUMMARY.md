---
phase: 01-websocket-offset-filtering-stability
plan: 02
subsystem: audio-processing
tags: [offset-filtering, deduplication, sse-timeout, error-handling]
dependency_graph:
  requires: [01-00, 01-01]
  provides: [offset-tolerance-filter, timestamp-dedup, sse-timeout-detection]
  affects: [live-transcription, local-transcription, correction]
tech_stack:
  added: []
  patterns: [tolerance-window-filtering, timestamp-deduplication, resettable-timeout]
key_files:
  created: []
  modified:
    - backend/main.py
    - src/routes/transcribe/+page.svelte
decisions:
  - Use end > offset - tolerance instead of start >= offset for boundary capture
  - 0.5s tolerance window for both offset filtering and deduplication
  - Resettable 30s stall timeout per SSE chunk (not single overall timeout)
  - User-friendly Dutch error messages without technical jargon
metrics:
  duration_minutes: 3
  completed_date: 2026-03-23
  tasks_completed: 2
  files_modified: 2
  commits: 2
---

# Phase 01 Plan 02: Offset Filtering + SSE Timeout Summary

**One-liner:** Fixed offset boundary filtering with 0.5s tolerance and added timestamp-based deduplication (OF-03), plus 30-second SSE timeout detection for both transcription and correction streams (EH-03)

## Outcome

Offset filtering bug resolved and SSE streams no longer stall indefinitely. Live transcription now captures boundary-spanning segments via `end > offset - tolerance` filter, deduplicates overlapping segments using timestamps, and shows user-friendly timeout errors after 30 seconds of no SSE data.

## Completed Tasks

| Task | Description                                                         | Commit  | Files Modified                                      |
| ---- | ------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| 1    | Backend offset filter tolerance + frontend timestamp deduplication  | 8d6e0c0 | backend/main.py, src/routes/transcribe/+page.svelte |
| 2    | SSE stream timeout detection for sendAudioLocal and fetchCorrection | c313a33 | src/routes/transcribe/+page.svelte                  |

## Technical Implementation

### Task 1: Offset Filter Tolerance + Frontend Deduplication

**Backend (OF-01, OF-02):**

- Changed `filter_segments_by_offset()` from `s["start"] >= offset` to `s["end"] > offset - tolerance`
- Uses existing `OFFSET_TOLERANCE = 0.5` constant from Wave 0
- All 13 backend tests now PASS (5 boundary tests were RED before fix)

**Frontend (OF-03, D-06, D-07):**

- Imported `deduplicateSegments` from existing `src/lib/utils/dedup.ts` module (Wave 0)
- Added `lastSegmentEnd` state variable for timestamp tracking
- Modified `sendLiveChunk()` to deduplicate segments before appending to partialText
- Reset `lastSegmentEnd` in `startLiveTranscription()`
- Deduplication is invisible to user (no UI indicator per D-07)

### Task 2: SSE Stream Timeout Detection

**sendAudioLocal (EH-03):**

- Replaced 30-minute overall timeout with resettable 30-second stall timeout
- `resetStallTimeout()` called after each chunk received
- AbortError shows: "Transcriptie reageert niet meer. Controleer of de backend draait en probeer opnieuw." (D-08)

**fetchCorrection (EH-03):**

- Added AbortController with resettable 30-second stall timeout
- `resetStallTimeout()` called after each chunk received
- AbortError shows: "Verslaglegging duurt te lang — probeer een korter fragment of herstart de backend." (D-08, D-09)

**Pattern:**
Both functions use the same resettable timeout pattern: create controller + stallTimeout, define resetStallTimeout(), call it after each chunk, clear on done/error.

## Test Coverage

**Backend tests (pytest):**

- `tests/test_offset_filter.py` — 13 tests PASS
  - Basic: no offset, after offset, fully before offset
  - Boundary: spanning boundary, ending within tolerance, ending outside tolerance
  - Parametrized: 7 edge cases covering various boundary positions

**Frontend tests (vitest):**

- `src/lib/utils/dedup.test.ts` — 12 tests PASS
  - Basic behavior, overlap detection, custom tolerance, lastSegmentEnd tracking

**TypeScript check:** PASS (0 errors, 1 warning on unrelated autofocus in login page)

## Deviations from Plan

None — plan executed exactly as written.

## Known Issues / Stubs

None detected. All functionality is fully wired.

## Dependencies Impact

**Downstream effects:**

- Live transcription (`sendLiveChunk`) now receives deduplicated segments
- Local transcription (`sendAudioLocal`) aborts after 30s stall instead of infinite wait
- Correction (`fetchCorrection`) aborts after 30s stall instead of infinite wait
- Error messages are now consistent and user-friendly (Dutch, no technical terms)

**No breaking changes** — all changes are internal improvements to existing functions.

## Verification

- [x] `npm run check` passes (TypeScript/Svelte type checking)
- [x] `cd backend && pytest tests/test_offset_filter.py -v` — all 13 tests PASS
- [x] `npx vitest run src/lib/utils/dedup.test.ts` — all 12 tests PASS
- [x] `grep "OFFSET_TOLERANCE" backend/main.py` shows constant is defined
- [x] `grep -c 'start.*>=.*offset' backend/main.py` returns 0 (old filter removed)
- [x] `grep "deduplicateSegments" src/routes/transcribe/+page.svelte` shows import + usage
- [x] `grep "SSE_STALL_TIMEOUT_MS" src/routes/transcribe/+page.svelte` shows timeout constant
- [x] `grep "AbortError" src/routes/transcribe/+page.svelte` shows 2 handlers (sendAudioLocal + fetchCorrection)

## Self-Check: PASSED

All claims verified:

- FOUND: 01-02-SUMMARY.md
- FOUND: 8d6e0c0 (Task 1 commit)
- FOUND: c313a33 (Task 2 commit)
- FOUND: backend/main.py
- FOUND: src/routes/transcribe/+page.svelte

## Next Steps

Phase 01 Plan 02 complete. All offset filtering, deduplication, and SSE timeout detection requirements satisfied. Ready to proceed to verifier checks.

---

_Created: 2026-03-23_
_Phase: 01-websocket-offset-filtering-stability_
_Plan: 02_
