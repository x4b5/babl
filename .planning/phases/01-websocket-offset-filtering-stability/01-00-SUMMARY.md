---
phase: 01-websocket-offset-filtering-stability
plan: 00
subsystem: testing
tags:
  - test-infrastructure
  - tdd
  - red-first
  - pytest
  - vitest
dependency_graph:
  requires: []
  provides:
    - backend test infrastructure (pytest)
    - offset filter test coverage (OF-01, OF-02)
    - heartbeat message structure tests (WS-03)
    - frontend dedup module with tests (OF-03)
  affects:
    - backend/main.py (filter_segments_by_offset extracted)
    - future Plan 01-01 (heartbeat implementation)
    - future Plan 01-02 (offset filter fix, dedup integration)
tech_stack:
  added:
    - pytest
    - pytest-asyncio
  patterns:
    - RED-first testing (boundary tests fail against buggy code)
    - Pure function extraction for testability
    - Parametrized test coverage
key_files:
  created:
    - backend/tests/__init__.py
    - backend/tests/test_offset_filter.py
    - backend/tests/test_heartbeat.py
    - src/lib/utils/dedup.ts
    - src/lib/utils/dedup.test.ts
  modified:
    - backend/requirements.txt (pytest dependencies)
    - backend/main.py (filter_segments_by_offset extracted)
decisions: []
metrics:
  duration_minutes: 2
  completed_date: '2026-03-23'
  tasks_completed: 2
  files_created: 5
  files_modified: 2
  test_coverage:
    backend_offset_filter: '19 tests (5 RED boundary, 14 GREEN basic)'
    backend_heartbeat: '7 tests (7 GREEN structure)'
    frontend_dedup: '12 tests (12 GREEN)'
---

# Phase 01 Plan 00: Test Scaffolding Summary

**One-liner:** RED-first test infrastructure for offset filtering (pytest), heartbeat protocol (pytest), and timestamp-based deduplication (vitest)

## Objective

Create Wave 0 test scaffolding to enable automated behavioral verification for Plans 01-01 and 01-02. Extract testable pure functions and write RED-first tests that expose existing bugs and define expected behavior.

## What Was Built

### Backend Test Infrastructure (Task 1)

**1. Pytest setup:**

- Installed `pytest` and `pytest-asyncio` in backend venv
- Created `backend/tests/__init__.py` package
- Added pytest dependencies to `requirements.txt`

**2. Offset filter extraction:**

- Extracted `filter_segments_by_offset()` as pure function from `transcribe_live` endpoint
- Added `OFFSET_TOLERANCE = 0.5` constant (OF-01 requirement)
- Preserved buggy behavior (`start >= offset`) for RED-first testing
- Updated inline filter at line 531 to call extracted function

**3. Offset filter tests (`test_offset_filter.py`):**

- **TestOffsetFilterBasic** (9 tests):
  - Zero offset returns all segments
  - Segments after offset are kept
  - Segments before offset are dropped
- **TestOffsetFilterBoundary** (10 tests):
  - Boundary-spanning segment preservation (OF-01)
  - Tolerance window tests (OF-02)
  - Parametrized boundary position coverage
- **Result:** 5 boundary tests FAIL (RED) - exposing the bug, 14 basic tests PASS

**4. Heartbeat structure tests (`test_heartbeat.py`):**

- **TestHeartbeatMessageStructure** (2 tests):
  - Ping message format: `{"type": "ping"}`
  - Pong message format: `{"type": "pong"}`
- **TestHeartbeatTimeoutLogic** (5 tests):
  - Timeout detection after 30s threshold
  - No timeout within threshold
  - Boundary condition (exactly 30s)
  - Heartbeat constants validation (15s interval, 30s timeout)
- **Result:** All 7 tests PASS (message format only, no implementation yet)

### Frontend Dedup Module (Task 2)

**1. Created `src/lib/utils/dedup.ts`:**

- `deduplicateSegments()` pure function for timestamp-based dedup
- `TranscriptionSegment` interface (`text`, `start`, `end`)
- `DEDUP_TOLERANCE = 0.5` constant (D-06 requirement)
- Filters segments overlapping with `lastSegmentEnd + tolerance`
- Returns `{ unique, newLastSegmentEnd }`

**2. Created `src/lib/utils/dedup.test.ts`:**

- **Basic behavior** (3 tests):
  - First batch (lastSegmentEnd=0) returns all
  - Empty input handling
  - Segments after lastSegmentEnd kept
- **Overlap detection** (4 tests):
  - Filters overlapping segments within tolerance
  - Filters segments at exactly lastSegmentEnd
  - Keeps segments outside tolerance window
  - Handles multiple overlaps in one batch
- **Custom tolerance** (2 tests):
  - Respects custom tolerance values
  - Zero tolerance behavior
- **lastSegmentEnd tracking** (2 tests):
  - Updates to last unique segment end
  - Preserves when all filtered
- **Constants** (1 test):
  - DEDUP_TOLERANCE = 0.5 per D-06
- **Result:** All 12 tests PASS (GREEN) - module and tests created together

## Deviations from Plan

None - plan executed exactly as written.

## Test Coverage

### Backend (pytest)

```bash
cd backend && source .venv/bin/activate && python -m pytest tests/ -v
```

- **test_offset_filter.py:** 19 tests (5 FAIL boundary, 14 PASS basic)
- **test_heartbeat.py:** 7 tests (7 PASS structure)
- **Total:** 26 tests, 5 expected failures (RED-first)

### Frontend (vitest)

```bash
npx vitest run src/lib/utils/dedup.test.ts
```

- **dedup.test.ts:** 12 tests (12 PASS)

### Type Safety

```bash
npm run check
```

- No new TypeScript errors introduced
- Pre-existing autofocus warning unchanged

## Integration Points

### For Plan 01-01 (WebSocket Heartbeat)

- `test_heartbeat.py` defines expected message format
- Heartbeat constants (`HEARTBEAT_INTERVAL`, `HEARTBEAT_TIMEOUT`) will be imported from `main.py`
- Tests verify ping/pong structure and timeout logic

### For Plan 01-02 (Offset Filter + Dedup)

- `test_offset_filter.py` boundary tests currently FAIL - will turn GREEN after fix
- `filter_segments_by_offset()` implementation will be corrected: `end > offset - tolerance`
- `deduplicateSegments()` ready to import in `+page.svelte` `sendLiveChunk()`

## Known Issues

None - all issues are expected (RED-first boundary test failures).

## Self-Check: PASSED

### Created Files Exist

```bash
[ -f "backend/tests/__init__.py" ] && echo "FOUND: backend/tests/__init__.py"
[ -f "backend/tests/test_offset_filter.py" ] && echo "FOUND: backend/tests/test_offset_filter.py"
[ -f "backend/tests/test_heartbeat.py" ] && echo "FOUND: backend/tests/test_heartbeat.py"
[ -f "src/lib/utils/dedup.ts" ] && echo "FOUND: src/lib/utils/dedup.ts"
[ -f "src/lib/utils/dedup.test.ts" ] && echo "FOUND: src/lib/utils/dedup.test.ts"
```

All files present ✅

### Commits Exist

```bash
git log --oneline --all | grep "cb83ab3"  # Task 1
git log --oneline --all | grep "c5328e6"  # Task 2
```

Both commits present ✅

### Tests Run

- Backend tests discoverable via `python -m pytest tests/` ✅
- Frontend tests pass via `npx vitest run src/lib/utils/dedup.test.ts` ✅
- TypeScript check passes ✅

## Next Steps

**Plan 01-01:** Implement WebSocket heartbeat (ping/pong protocol, 15s interval, 30s timeout) to satisfy `test_heartbeat.py` structure tests.

**Plan 01-02:** Fix `filter_segments_by_offset()` implementation to use `end > offset - tolerance`, turning boundary tests GREEN. Integrate `deduplicateSegments()` into `+page.svelte`.
