# Architecture Research

**Research Date:** 2026-03-23
**Focus:** Architecture patterns for streaming resilience and error recovery

## Pattern 1: WebSocket Reconnection with Heartbeat

**Problem:** WebSocket to AssemblyAI via backend proxy silently fails on disconnect. User sees "recording" but receives no transcription.

**Recommended Pattern:**

```
Client ←→ Backend WS ←→ AssemblyAI WS
  │           │              │
  ├─ ping ──→├─ ping ──────→│  (heartbeat every 15s)
  ├←─ pong ──├←─ pong ──────│
  │           │              │
  ├─ timeout? → reconnect    │  (no pong in 30s = dead)
  ├─ backoff  → 1s, 2s, 4s  │  (exponential with jitter)
  └─ max 5    → error state  │  (give up after 5 attempts)
```

**Library:** `reconnecting-websocket` (4.4.0, 2KB gzipped)

- Drop-in replacement for native WebSocket
- Configurable: maxRetries, reconnectionDelayGrowFactor, maxReconnectionDelay
- Events: onreconnect, onmaximum (max retries exceeded)

**Backend Side:**

- FastAPI WebSocket endpoint needs ping/pong handler
- Forward AssemblyAI disconnect as explicit error message to frontend
- Add `type: 'error'` message with `code: 'upstream_disconnect'`

**Key Decision:** Reconnect at WS level only. Don't try to resume AssemblyAI session (new session on reconnect). Accept potential duplicate/gap in transcription around reconnect boundary.

## Pattern 2: SSE Reconnection with Last-Event-ID

**Problem:** SSE streams for transcription and correction can drop mid-stream.

**Recommended Pattern:**

- Use `EventSource` API's built-in reconnection (auto-retries with `Last-Event-ID`)
- Backend sends event IDs with each SSE message
- On reconnect, backend resumes from last acknowledged event

**Current BABL Approach:** Manual `fetch()` + `ReadableStream` reader — no auto-reconnect.

**Recommendation for Stability Milestone:** Keep current manual approach but add:

1. Stream timeout detection (no data for 30s = error)
2. Explicit error state on stream failure
3. Don't add SSE auto-reconnect now (scope creep)

## Pattern 3: Rate Limit Handling (HTTP 429)

**Problem:** Mistral returns 429 when rate limited. Backend retries 8x but frontend sees generic error.

**Recommended Pattern:**

```
Backend receives 429
  → Parse Retry-After header (seconds or HTTP-date)
  → Return structured error to frontend:
    { type: "error", code: "rate_limited", retry_after: 30, message: "..." }
  → Frontend shows: "API is tijdelijk overbelast. Probeer over 30 seconden."
  → Optional: auto-retry button with countdown
```

**Backend Changes (main.py):**

- Catch 429 in `correct_chunk_mistral_stream()`
- Parse `Retry-After` header
- Raise specific `RateLimitError` (not generic Exception)
- Return `{type: "rate_limit", retry_after: N}` via SSE

**Frontend Changes (+page.svelte):**

- Detect `rate_limit` event type in SSE reader
- Show user-friendly message with retry timer
- Don't show generic "mislukt" for rate limits

**Library Option:** `tenacity` (Python) for smarter retry:

- `retry_if_exception_type(RateLimitError)`
- `wait_exponential(multiplier=1, min=4, max=60)`
- `stop_after_attempt(5)`
- `before_sleep` callback to log retry

## Pattern 4: Audio Resource Cleanup

**Problem:** MediaRecorder + AudioContext not cleaned up on page unload/crash.

**Recommended Pattern:**

```javascript
// Register cleanup on mount
window.addEventListener('beforeunload', cleanup);
document.addEventListener('visibilitychange', handleVisibility);

function cleanup() {
	mediaRecorder?.stop();
	audioContext?.close();
	mediaStream?.getTracks().forEach((t) => t.stop());
	wsConnection?.close();
}

function handleVisibility() {
	if (document.hidden && status === 'recording') {
		// Optional: pause or warn
	}
}

// Cleanup on Svelte destroy
onDestroy(() => {
	cleanup();
	window.removeEventListener('beforeunload', cleanup);
});
```

**Svelte 5 Approach:** Use `$effect` with cleanup return:

```javascript
$effect(() => {
	window.addEventListener('beforeunload', cleanup);
	return () => {
		cleanup();
		window.removeEventListener('beforeunload', cleanup);
	};
});
```

## Pattern 5: Offset Filtering with Overlap Tolerance

**Problem:** `/transcribe-live` filters segments where `start < offset`, dropping segments that straddle the boundary.

**Current Code (main.py:532):**

```python
segments = [s for s in result["segments"] if s["start"] >= offset]
```

**Recommended Fix:**

```python
OVERLAP_TOLERANCE = 0.5  # seconds
segments = [s for s in result["segments"] if s["end"] > offset - OVERLAP_TOLERANCE]
```

**Why `end > offset` instead of `start >= offset`:**

- A segment with start=4.8s, end=5.3s, offset=5.0s contains new content (5.0-5.3s)
- Current filter drops it because start < offset
- New filter keeps it because end > offset

**Deduplication:** Frontend must handle potential duplicate words at boundaries. Simple approach: track last N words and skip if repeated.

## Architecture Principles for This Milestone

1. **Fix in place** — Don't refactor +page.svelte (1662 lines). Fix bugs where they are.
2. **Minimal new dependencies** — Only add `reconnecting-websocket` if needed. Prefer native patterns.
3. **Backend-first error propagation** — Backend should classify errors (rate_limit, timeout, upstream_error) and frontend displays them.
4. **No silent failures** — Every error path must either recover or inform the user.
5. **Defensive cleanup** — Always register cleanup handlers, even if they seem redundant.

---

_Research completed: 2026-03-23_
