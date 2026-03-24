---
phase: 02-rate-limiting-error-handling
plan: 01
subsystem: backend-api-error-handling
tags: [rate-limiting, error-handling, retry-logic, sse-events]
dependency_graph:
  requires: []
  provides:
    - structured-sse-error-events
    - retry-after-header-parsing
    - tenacity-pattern-retry
    - error-type-taxonomy
  affects:
    - backend/main.py
    - src/routes/api/correct/+server.ts
    - src/routes/api/transcribe-api/+server.ts
    - src/routes/api/transcribe-api/[id]/+server.ts
tech_stack:
  added:
    - tenacity>=9.0.0
  patterns:
    - exponential-backoff-with-jitter
    - retry-after-header-parsing
    - structured-sse-error-events
key_files:
  created:
    - src/lib/utils/error-types.ts
    - backend/tests/test_retry_after.py
    - backend/tests/test_sse_errors.py
  modified:
    - backend/requirements.txt
    - backend/main.py
    - src/routes/api/correct/+server.ts
    - src/routes/api/transcribe-api/+server.ts
    - src/routes/api/transcribe-api/[id]/+server.ts
decisions:
  - Manual tenacity-patterned retry loop for async generators (tenacity doesn't support them)
  - Max 5 retry attempts (down from 8) per RL-04
  - Exponential backoff with jitter (random 0-2s) to prevent thundering herd
  - Retry-After header takes precedence over exponential backoff
  - Four error types: rate_limit, timeout, upstream_disconnect, network_error
  - Backend and SvelteKit API routes emit identical structured SSE error format
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_modified: 8
  tests_added: 17
  completed_date: '2026-03-24'
---

# Phase 02 Plan 01: Backend Retry Logic + Structured SSE Errors

**One-liner:** Tenacity-patterned retry with Retry-After parsing and structured SSE error events (rate_limit, timeout, upstream_disconnect, network_error)

## What Was Built

### Shared Error Type Definitions

Created `src/lib/utils/error-types.ts`:

- ErrorType taxonomy: `'rate_limit' | 'timeout' | 'upstream_disconnect' | 'network_error'`
- ERROR_MESSAGES map for user-facing Dutch messages
- Helper functions: `rateLimitMessage(seconds)`, `RATE_LIMIT_EXHAUSTED`

### Backend (FastAPI) Changes

**backend/main.py:**

- Added `parse_retry_after(response_or_headers) -> int` function
  - Parses integer seconds format (e.g., "30")
  - Parses HTTP-date format (RFC 1123: "Sun, 06 Nov 1994 08:49:37 GMT")
  - Falls back to 3 seconds if header missing or unparseable
  - Returns minimum 1 second (never 0 or negative)
- Replaced `correct_chunk_mistral_stream` retry loop:
  - **Before:** `max_retries = 8`, hardcoded `3 * (2 ** attempt)`, `"429" in str(e)`
  - **After:** `max_attempts = 5`, exponential backoff with jitter, proper error classification
  - Retry-After header parsing for rate limit errors
  - Retries on 429 (rate limit) and 500/502/503 (server errors)
  - Added `random.uniform(0, 2)` jitter to prevent thundering herd
- Updated `/correct` endpoint error handler:
  - **Before:** `{'type': 'error', 'message': str(e)}`
  - **After:** `{'type': 'error', 'error_type': 'rate_limit', 'retry_after': 30}`
  - Classifies errors into 4 types: rate_limit, timeout, upstream_disconnect, network_error
  - Includes `retry_after` field for rate_limit errors

**backend/requirements.txt:**

- Added `tenacity>=9.0.0` dependency

### SvelteKit API Routes

**src/routes/api/correct/+server.ts:**

- Added `classifyError(e) -> {errorType, retryAfter?}` helper
  - Checks status codes (429, 502, 503)
  - Parses error messages for rate limit, timeout, connection errors
  - Extracts Retry-After from response headers
- Added `parseRetryAfter(headers) -> number` helper
  - Parses integer seconds and HTTP-date formats
  - Falls back to 3 seconds
- Updated `correctChunkMistralStream` retry logic:
  - **Before:** `maxRetries = 8`, `msg.includes('429')`, hardcoded backoff
  - **After:** `maxAttempts = 5`, error classification, exponential backoff + jitter
  - Retry-After header parsing
  - Retries on rate_limit and upstream_disconnect errors only
- Updated ReadableStream error handler:
  - **Before:** `{type: 'error', message: e.message}`
  - **After:** `{type: 'error', error_type: 'rate_limit', retry_after: 30}`

**src/routes/api/transcribe-api/+server.ts and [id]/+server.ts:**

- Added error_type classification to catch blocks
- Returns `{error: msg, error_type: 'rate_limit' | 'timeout' | 'upstream_disconnect' | 'network_error'}`

### Tests

**backend/tests/test_retry_after.py (11 tests):**

- Integer seconds parsing
- HTTP-date (RFC 1123) parsing
- Empty/missing header fallback (3s)
- Zero/negative returns minimum 1s
- Dict and response-like object support

**backend/tests/test_sse_errors.py (6 tests):**

- Structured SSE error event format validation
- Required fields for each error type
- Valid JSON serialization

All 17 tests pass.

## Deviations from Plan

None — plan executed exactly as written.

## Technical Decisions

**D-01: Manual tenacity-patterned retry loop instead of @retry decorator**

- **Reason:** tenacity doesn't support decorating async generators (RESEARCH.md Pitfall 2)
- **Implementation:** Manual loop with exponential backoff + jitter pattern
- **Outcome:** Same behavior as tenacity without library limitation

**D-02: Max 5 attempts (down from 8)**

- **Reason:** Per RL-04 requirement and RESEARCH.md recommendations
- **Impact:** Reduces max wait time from ~12 minutes to ~2 minutes
- **Benefit:** Faster feedback to user when retries are exhausted

**D-03: Jitter range 0-2 seconds**

- **Reason:** Prevent thundering herd (RESEARCH.md D-06)
- **Formula:** `backoff = min(30, 1 * 2^attempt) + random.uniform(0, 2)`
- **Outcome:** Spreads retry attempts across time window

**D-04: Retry-After takes precedence over backoff**

- **Implementation:** `wait = max(backoff, retry_after)` for rate limits
- **Reason:** Respect server-provided wait time (RL-01)
- **Outcome:** Compliant with RFC 7231

**D-05: Four error types (not more granular)**

- **Types:** rate_limit, timeout, upstream_disconnect, network_error
- **Reason:** EH-01 taxonomy, sufficient for user-facing messages
- **Benefit:** Simple, consistent error handling across frontend

**D-06: Backend and SvelteKit emit identical SSE error format**

- **Format:** `{type: 'error', error_type: ErrorType, retry_after?: number}`
- **Reason:** Unified frontend parsing (Plan 02 will consume both)
- **Outcome:** Single error handler in frontend

## Integration Points

**Frontend (Plan 02 will consume):**

- Parse SSE events with `error_type` field
- Display user-facing Dutch messages from `ERROR_MESSAGES`
- Show countdown timer for rate_limit errors using `retry_after` field
- Handle all 4 error types consistently

**Existing endpoints unchanged:**

- `/health`, `/transcribe`, `/transcribe-live` — no SSE error events emitted
- `/ws/transcribe-stream` — WebSocket errors handled separately (Phase 1)

## Known Stubs

None. All functionality is fully wired.

## Verification

**Automated tests:**

```bash
cd backend && pytest tests/test_retry_after.py tests/test_sse_errors.py -x -v
# Result: 17 passed in 9.94s
```

**TypeScript check:**

```bash
npm run check
# Result: 0 errors, 1 warning (unrelated autofocus a11y)
```

**Manual verification:**

- Backend retries on 429 with Retry-After header parsing: ✓ (unit tested)
- Backend emits structured SSE error events: ✓ (format tested)
- SvelteKit routes emit structured errors: ✓ (TypeScript enforced)

## Acceptance Criteria

- [x] backend/requirements.txt contains `tenacity>=9.0.0`
- [x] backend/main.py contains `def parse_retry_after(`
- [x] backend/main.py contains `'error_type': 'rate_limit'` in SSE error event
- [x] backend/main.py contains `'retry_after':` in SSE error event
- [x] backend/main.py correct_chunk_mistral_stream has `max_attempts = 5`
- [x] backend/main.py correct_chunk_mistral_stream contains `random.uniform` (jitter)
- [x] backend/main.py /correct endpoint error handler contains `error_type`
- [x] backend/main.py does NOT contain `"429" in str(e)` in correct_chunk_mistral_stream
- [x] backend/tests/test_retry_after.py contains `test_integer_seconds` and `test_http_date_format`
- [x] backend/tests/test_sse_errors.py contains `test_rate_limit_event_has_required_fields`
- [x] src/lib/utils/error-types.ts exports `ErrorType` and `ERROR_MESSAGES`
- [x] src/routes/api/correct/+server.ts contains `import type { ErrorType }`
- [x] src/routes/api/correct/+server.ts contains `function classifyError(`
- [x] src/routes/api/correct/+server.ts contains `function parseRetryAfter(`
- [x] src/routes/api/correct/+server.ts contains `maxAttempts = 5`
- [x] src/routes/api/correct/+server.ts contains `Math.random() * 2` (jitter)
- [x] src/routes/api/correct/+server.ts SSE error contains `error_type`
- [x] src/routes/api/transcribe-api/+server.ts catch block contains `error_type`
- [x] src/routes/api/transcribe-api/[id]/+server.ts catch block contains `error_type`
- [x] `pytest backend/tests/test_retry_after.py backend/tests/test_sse_errors.py -x` exits 0
- [x] `npm run check` exits 0 (TypeScript passes)

All acceptance criteria met.

## Self-Check: PASSED

**Created files exist:**

```bash
[ -f "src/lib/utils/error-types.ts" ] && echo "FOUND: src/lib/utils/error-types.ts"
# FOUND: src/lib/utils/error-types.ts

[ -f "backend/tests/test_retry_after.py" ] && echo "FOUND: backend/tests/test_retry_after.py"
# FOUND: backend/tests/test_retry_after.py

[ -f "backend/tests/test_sse_errors.py" ] && echo "FOUND: backend/tests/test_sse_errors.py"
# FOUND: backend/tests/test_sse_errors.py
```

**Commits exist:**

```bash
git log --oneline --all | grep "e34a269"
# e34a269 feat(02-01): add retry-after parsing, tenacity-pattern retry, structured SSE errors

git log --oneline --all | grep "c1b1e29"
# c1b1e29 feat(02-01): add retry logic and structured errors to SvelteKit API routes
```

All files and commits verified.

## Next Steps

**Plan 02-02:** Frontend error display and retry countdown

- Parse structured SSE error events
- Display Dutch error messages from `ERROR_MESSAGES`
- Show countdown timer for `rate_limit` errors using `retry_after` field
- Handle all 4 error types (`rate_limit`, `timeout`, `upstream_disconnect`, `network_error`)
- Update UI state to show errors inline (not toast notifications per D-03)
