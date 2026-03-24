---
phase: 03
plan: 01
subsystem: resource-cleanup
tags:
  - resource-management
  - browser-lifecycle
  - tdd-green
  - abort-controller
  - confirmation-dialog
dependency_graph:
  requires:
    - cleanup.ts (stub from Plan 00)
    - cleanup.test.ts (RED phase tests from Plan 00)
  provides:
    - cleanup.ts (GREEN phase implementation)
    - Resource cleanup at all exit paths
    - Confirmation dialog for active states
    - AbortController integration for fetch/SSE
  affects:
    - src/routes/transcribe/+page.svelte (lifecycle management)
tech_stack:
  added:
    - jsdom (Vitest browser API mocking)
    - vitest.setup.ts (global test environment)
  patterns:
    - TDD GREEN phase (stubs to implementation)
    - Browser lifecycle hooks (beforeunload, pagehide)
    - Svelte 5 $effect cleanup
    - AbortController for request cancellation
    - Idempotent cleanup design
key_files:
  created:
    - vitest.setup.ts
  modified:
    - src/lib/utils/cleanup.ts
    - src/routes/transcribe/+page.svelte
    - vite.config.ts
    - package.json
    - src/lib/utils/cleanup.test.ts
decisions:
  - Component-scope AbortController (replaced local instances) to enable cleanup on page unload
  - Confirmation dialog only for recording/processing/correcting states (not idle/preparing)
  - beforeunload + pagehide dual registration (desktop + mobile coverage)
  - $effect cleanup runs same cleanup as page unload (consistent behavior)
  - AbortError handled silently (not user-facing errors)
metrics:
  duration: 1
  completed: 2026-03-24T21:19:01Z
requirements:
  - RC-01
  - RC-02
  - RC-03
---

# Phase 03 Plan 01: Implement Resource Cleanup at All Exit Paths

**One-liner:** Full resource cleanup implementation (GREEN phase) with beforeunload confirmation dialog, mic LED shutoff, fetch/SSE abort, and WebSocket close on page unload and component destroy.

## Summary

Completed TDD GREEN phase by implementing all three cleanup utility functions (filling stubs from Plan 00) and integrating them into +page.svelte with comprehensive lifecycle management. All browser resources (MediaRecorder, MediaStream tracks, AudioContext, WebSocket, fetch/SSE requests, timers) are now cleaned up at every exit path: page unload (beforeunload + pagehide), component destroy ($effect cleanup), and browser tab close. Confirmation dialog appears when user tries to leave during active recording/processing/correcting states. All 12 unit tests pass. Manual browser verification confirmed mic LED shutoff, network request cancellation, and confirmation dialog behavior.

## What Was Built

### 1. cleanup.ts Implementation (GREEN Phase)

Filled in all three stub functions from Plan 00 with complete implementation:

**cleanupMediaResources:**

- Stops MediaRecorder if state is 'recording' (wrapped in try/catch for already-stopped edge case)
- Stops all MediaStream tracks (turns off microphone LED)
- Cancels animation frame if active
- Closes AudioContext if not already closed (prevents double-close error)
- Clears analyser reference

**cleanupNetworkResources:**

- Aborts all AbortController instances (transcribe, correction, live chunk, API poll)
- Closes WebSocket connection with proper close frame

**cleanupTimers:**

- Clears all interval timers (recording timer, processing timer, live interval, countdown)
- Clears all timeout timers (stream stall timeout)

All functions are idempotent (safe to call multiple times with same references).

### 2. +page.svelte Lifecycle Integration

**Component-scope variables added:**

- `stream: MediaStream | undefined` (moved from local closure per D-05)
- `transcribeController: AbortController | undefined`
- `correctionController: AbortController | undefined`
- `liveChunkController: AbortController | undefined`
- `apiPollController: AbortController | undefined`

**cleanupAllResources function:**
Three-phase cleanup orchestrator:

1. Abort network requests (signals backend immediately)
2. Stop media resources (MediaRecorder, tracks, AudioContext)
3. Clear timers (intervals and timeouts)
4. Null out references (prevent double-cleanup)

**Browser lifecycle hooks:**

- beforeunload: Shows confirmation dialog if status is recording/processing/correcting, runs cleanup regardless of user choice
- pagehide: Fallback for mobile browsers (no dialog possible), runs cleanup
- $effect cleanup: Runs cleanupAllResources on component destroy (navigation, unmount)

**AbortController integration:**

- Replaced local AbortController instances in sendAudioLocal and fetchCorrection with component-scope variables
- Added AbortController to sendAudioApi (submit + poll fetch calls)
- Added AbortController to sendLiveChunk (incremental transcription)
- All catch blocks handle AbortError silently (not user-facing)
- Controllers set to undefined in finally blocks (single-use pattern)

### 3. Test Infrastructure (Rule 1 Auto-fix)

Added Vitest environment setup to make cleanup tests pass:

- Updated vite.config.ts with jsdom environment and setup file
- Created vitest.setup.ts with browser API mocks (cancelAnimationFrame, requestAnimationFrame)
- Installed jsdom dependency
- Fixed TypeScript errors in cleanup.test.ts

**Test results:** All 12 tests pass (GREEN phase achieved).

### 4. Manual Browser Verification (Task 2 - Approved)

All 6 test scenarios passed:

1. Confirmation dialog appears during recording - PASS
2. No dialog when idle - PASS
3. Microphone LED turns off on tab close - PASS
4. Network requests show "cancelled" status in DevTools - PASS
5. Confirmation dialog appears during processing - PASS
6. No console errors during normal flow - PASS

## Verification

**Automated:**

- `npm run test:run -- src/lib/utils/cleanup.test.ts` - All 12 tests PASS
- `npm run check` - TypeScript compilation clean

**Manual (Task 2 checkpoint):**

- User verified all 6 browser test scenarios - APPROVED

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test infrastructure missing**

- **Found during:** Task 1, when running cleanup tests
- **Issue:** Vitest was not configured with jsdom environment. Tests failed with "cancelAnimationFrame is not defined". Test file also had TypeScript errors (wrong import paths, wrong mock types).
- **Fix:** Added Vitest config with jsdom environment, created vitest.setup.ts with browser API mocks, installed jsdom dependency, fixed test file imports and types.
- **Files modified:** vite.config.ts, vitest.setup.ts (new), package.json, src/lib/utils/cleanup.test.ts
- **Commit:** 938025c (included in same commit as main implementation)

No other deviations - plan executed as written.

## Decisions Made

1. **Component-scope AbortController pattern:** Moved AbortController instances from local function scope to component scope. This enables cleanupAllResources to abort active requests on page unload. No double-abort risk because local variables are removed entirely (not kept alongside component-scope ones).

2. **Confirmation dialog only for active states:** beforeunload dialog appears only when status is recording, processing, or correcting. No dialog for idle or preparing states (user intent is clear - they want to leave).

3. **Dual event registration (beforeunload + pagehide):** beforeunload handles desktop browsers and shows confirmation dialog. pagehide handles mobile browsers as fallback (no dialog possible on mobile). Both call the same cleanup function.

4. **Consistent cleanup across all paths:** $effect cleanup calls the same cleanupAllResources function as page unload handlers. Component destroy, page unload, and tab close all run identical cleanup logic.

5. **Silent AbortError handling:** AbortError is not shown to user (it's an intentional cancellation, not a failure). All catch blocks check for e.name === 'AbortError' and return early without error UI.

## Requirements Satisfied

- **RC-01:** All resources cleaned up at every exit path (page unload, component destroy, navigation)
- **RC-02:** Component destroy runs same cleanup as page unload ($effect cleanup)
- **RC-03:** WebSocket closed with proper close frame on page leave
- **D-01:** Confirmation dialog during active states (recording/processing/correcting)
- **D-02:** No confirmation dialog during idle state
- **D-03:** All audio resources cleaned up (MediaRecorder, AudioContext, MediaStreamTracks, WebSocket)
- **D-04:** Active fetch/SSE aborted via AbortController (within RC-01 scope)
- **D-05:** stream moved to component scope
- **D-06:** No new user-facing error messages (cleanup is silent)

## Known Stubs

None - all stubs from Plan 00 have been implemented. All tests pass.

## Self-Check: PASSED

All modified files exist:

- FOUND: src/lib/utils/cleanup.ts
- FOUND: src/routes/transcribe/+page.svelte
- FOUND: vite.config.ts
- FOUND: vitest.setup.ts
- FOUND: package.json

Task commits exist:

- FOUND: 938025c (Task 1 - GREEN phase implementation)

Verification results:

- All 12 cleanup tests pass
- TypeScript compilation clean
- User approved manual browser verification
