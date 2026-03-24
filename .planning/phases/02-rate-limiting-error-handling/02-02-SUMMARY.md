---
phase: 02-rate-limiting-error-handling
plan: 02
subsystem: error-handling
tags: [error-taxonomy, countdown-timer, retry-logic, ux, dutch-messages]

# Dependency graph
requires:
  - phase: 02-01
    provides: error-types.ts with ErrorType taxonomy, ERROR_MESSAGES, rateLimitMessage function, and structured SSE error event format
provides:
  - Frontend error classification utility for non-SSE errors (TypeError, DOMException)
  - Error message mapping with Dutch user-facing messages (no generic "mislukt")
  - Live countdown timer with auto-retry for rate limit errors (max 3 cycles)
  - Amber/red visual distinction for retry-able vs fatal errors
  - Structured error event handling in +page.svelte with error_type taxonomy
affects: [03-resource-cleanup, future-error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Error classification with classifyFrontendError for exception types
    - getUserMessage for taxonomy-based Dutch error messages
    - isRetryable to determine retry-able vs fatal errors
    - startCountdown with setInterval for live countdown + auto-retry
    - handleErrorEvent for SSE error event parsing
    - Amber styling for retry-able errors, red for fatal

key-files:
  created:
    - src/lib/utils/error-classifier.ts
    - src/lib/utils/error-classifier.test.ts
    - src/lib/utils/error-messages.test.ts
  modified:
    - src/routes/transcribe/+page.svelte

key-decisions:
  - 'Max 3 auto-retry cycles before showing exhausted message (RATE_LIMIT_EXHAUSTED)'
  - 'Countdown interval cleanup via $effect() return function'
  - 'Separate countdownSeconds state from recording countdown state'
  - 'role=alert and aria-live=assertive for accessible error announcements'
  - 'Amber (amber-500) for retry-able rate_limit, red (red-500) for fatal errors'

patterns-established:
  - 'classifyFrontendError: Maps TypeError → network_error, DOMException AbortError → timeout, HTTP 429 → rate_limit, HTTP 502/503 → upstream_disconnect'
  - "Error messages comply with EH-02: no generic 'mislukt', no 'Fout:', no HTTP status codes"
  - 'startCountdown triggers auto-retry at 0, increments retryCount, shows exhausted message after MAX_AUTO_RETRIES'
  - 'All error handling paths (fetchCorrection, sendAudioAssemblyAI, sendAudioLocal) use classifyFrontendError + getUserMessage'

requirements-completed: [RL-03, EH-01, EH-02]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 2 Plan 2: Frontend Error Taxonomy + Countdown UI

**Live countdown timer with auto-retry, amber/red error distinction, and Dutch taxonomy-based error messages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T19:00:00Z
- **Completed:** 2026-03-24T19:05:00Z
- **Tasks:** 3 (2 auto, 1 checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments

- Error classifier utility maps frontend exceptions to ErrorType taxonomy (TypeError → network_error, AbortError → timeout, etc.)
- All error messages specific per type with Dutch user-facing text (no generic "mislukt" or technical jargon)
- Live countdown timer "Overbelast. Wacht Xs..." with auto-retry at 0 (max 3 cycles)
- Amber styling for retry-able rate_limit errors, red for fatal errors (timeout, network_error, upstream_disconnect)
- Accessible error display with role="alert" and aria-live="assertive"

## Task Commits

Each task was committed atomically:

1. **Task 1: Error classifier utility + user message tests** - `12301fc` (feat)
2. **Task 2: Frontend countdown timer + error event handling + amber/red styling** - `ebc6034` (feat)
3. **Task 3: Visual verification checkpoint** - Approved by user (no commit)

## Files Created/Modified

- `src/lib/utils/error-classifier.ts` - Frontend error classification (classifyFrontendError, getUserMessage, isRetryable)
- `src/lib/utils/error-classifier.test.ts` - Tests for exception → error_type mapping (TypeError, DOMException, HTTP codes)
- `src/lib/utils/error-messages.test.ts` - Tests for Dutch messages compliance (no "mislukt", no HTTP codes)
- `src/routes/transcribe/+page.svelte` - Countdown timer, error event handler, amber/red styling, auto-retry logic

## Decisions Made

- **Max 3 auto-retry cycles**: After 3 failed retry attempts, show RATE_LIMIT_EXHAUSTED message without further auto-retry (prevents infinite loop)
- **Separate countdown state**: countdownSeconds state separate from existing recording countdown (line 11) to avoid conflicts
- **Amber vs red styling**: Amber (amber-500) for rate_limit (retry-able), red (red-500) for fatal errors (aligns with D-06)
- **Accessible error announcements**: role="alert" and aria-live="assertive" ensure screen readers announce errors immediately
- **$effect cleanup**: Countdown interval cleanup via $effect return function prevents memory leaks on component destroy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tests passed, TypeScript check passed, visual verification confirmed.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all error classification logic fully implemented and tested.

## Next Phase Readiness

**Ready for Phase 3 (Resource Cleanup):**

- Error handling system complete with taxonomy-based messages
- Countdown timer and auto-retry fully functional
- Visual distinction (amber/red) implemented
- All error paths unified under error-classifier utility

**No blockers:**

- Phase 3 focuses on resource cleanup (microfoon, AudioContext, WebSocket close), independent of error handling changes

---

## Self-Check: PASSED

All created files exist:

- src/lib/utils/error-classifier.ts ✓
- src/lib/utils/error-classifier.test.ts ✓
- src/lib/utils/error-messages.test.ts ✓

All commits exist:

- 12301fc ✓
- ebc6034 ✓

---

_Phase: 02-rate-limiting-error-handling_
_Completed: 2026-03-24_
