# Research Summary: BABL Streaming Stability Milestone

**Research Date:** 2026-03-23
**Domain:** WebSocket/SSE streaming resilience for privacy-first speech-to-text
**Synthesized from:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

BABL's streaming architecture (SvelteKit + FastAPI with AssemblyAI and Mistral integration) suffers from three critical stability bugs: silent WebSocket failures, offset boundary filtering data loss, and rate-limited API feedback gaps. Experts build streaming audio applications with explicit state management (heartbeat patterns), tolerance in boundary filtering, and transparent error propagation. The recommended approach combines battle-tested libraries (`reconnecting-websocket`, `ky`, `tenacity`) with architectural patterns that separate connection state from processing state, implement exponential backoff with jitter, and propagate error context to users. Success depends on avoiding silent failures—every error must either recover transparently or inform the user with actionable guidance. The research reveals these aren't architectural redesigns but focused fixes: WebSocket heartbeat, offset filtering tolerance, and rate-limit error classification. All patterns are production-tested and well-documented.

---

## Key Findings

### From STACK.md: Recommended Technologies

| Area                      | Technology             | Version     | Rationale                                                                                                                         |
| ------------------------- | ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend WebSocket**    | reconnecting-websocket | 4.4.0       | Battle-tested (6+ years production), configurable exponential backoff + jitter, zero dependencies. Drop-in WebSocket replacement. |
| **Frontend HTTP Retry**   | ky                     | 1.14.3+     | Modern fetch wrapper, built-in 429 handling, respects Retry-After header, TypeScript-native. Lighter than axios.                  |
| **Backend Retry**         | tenacity               | 9.0.0+      | Industry standard for Python (used by Instructor, ML frameworks), supports async, conditional retries, detailed logging.          |
| **Backend Rate Limiting** | slowapi                | 0.1.9+      | More mature than fastapi-limiter (production-tested), better Retry-After support, Redis-ready for multi-instance.                 |
| **SSE Reconnection**      | Native EventSource     | Browser API | Built-in auto-reconnection with Last-Event-ID support, no library needed. Only replace if custom headers required.                |

**Key Version Requirements:**

- Python 3.10+ (for tenacity async support)
- FastAPI 0.100+
- SvelteKit 2.x / Svelte 5.x compatible
- Redis 5.0+ (production rate limiting only; use in-memory for dev)

**Critical Migration Path:**

- Replace custom retry loops (backend/main.py lines 310–334) with `@tenacity.retry` decorator
- Add `reconnecting-websocket` to handle WebSocket reconnection (not AssemblyAI session resume—new session on reconnect is acceptable)
- Implement `Retry-After` parsing in backend, propagate to frontend for user display

### From FEATURES.md: What Users Expect (Table Stakes)

**Critical Gaps (3 known bugs):**

1. **WebSocket auto-reconnect** — Currently missing; silent failure on disconnect. Users see "recording" but get no transcription.
2. **Rate limit user feedback** — Currently missing; generic "mislukt" error. Users don't know why it failed or how long to wait.
3. **Audio segment boundary handling** — Currently buggy; offset filtering drops segments straddling boundaries, losing words.

**Supporting Gaps:** 4. **Resource cleanup on unload** — Missing beforeunload handler; potential mic/AudioContext leaks 5. **Streaming timeout detection** — Missing client-side timeout; stalled streams hang indefinitely 6. **Error message consistency** — Mix of generic and specific messages; users can't take action

**Differentiators (keep these):**

- Limburgse dialect correction (5 regional profiles)
- Dual-mode per step (user chooses local vs API)
- Privacy-first (no PII, EU-only servers)
- Two-phase processing (show raw before correction)
- Live incremental transcription

### From ARCHITECTURE.md: Implementation Patterns

**Pattern 1: WebSocket Reconnection with Heartbeat**

```
Client ←→ Backend WS ←→ AssemblyAI WS
  ├─ ping every 15s, timeout 30s
  ├─ exponential backoff: 1s → 2s → 4s (with jitter)
  ├─ max 5 attempts → error state
  └─ don't resume AssemblyAI session; start fresh on reconnect
```

- **Library:** `reconnecting-websocket` with `maxRetries: 5`, `reconnectInterval: 3000`, `maxReconnectInterval: 30000`
- **Backend:** Forward explicit `{type: 'error', code: 'upstream_disconnect'}` messages to frontend
- **Key insight:** Reconnect at WS level, accept potential duplicate/gap in transcription

**Pattern 2: SSE Reconnection (Lower Priority)**

- Keep current manual `fetch() + ReadableStream` approach (no scope creep)
- Add stream timeout detection (no data for 30s = error)
- No immediate SSE auto-reconnect; defer to Phase 2

**Pattern 3: Rate Limit Handling (HTTP 429)**

```
Backend receives 429
  → Parse Retry-After header
  → Raise RateLimitError with retry_after value
  → Send to frontend: {type: "rate_limit", retry_after: 30}
  → Frontend shows: "Overbelast. Probeer over 30s."
```

- **Backend:** Catch 429 in `correct_chunk_mistral_stream()`, parse header, propagate to user
- **Frontend:** Detect rate_limit event type, show countdown timer, don't show generic error
- **Library:** Use `tenacity` for smarter retry logic with conditional handlers

**Pattern 4: Audio Resource Cleanup**

- Use `$effect` cleanup (Svelte 5 native) instead of `onDestroy`
- Stop MediaStreamTracks explicitly + close AudioContext
- Register `beforeunload` listener (pagehide for mobile)
- Safety net: auto-stop recording after 2 hours

**Pattern 5: Offset Filtering with Tolerance**

```python
# Current (drops boundary words):
segments = [s for s in result["segments"] if s["start"] >= offset]

# Fixed (tolerance window):
OVERLAP_TOLERANCE = 0.5  # seconds
segments = [s for s in result["segments"] if s["end"] > offset - OVERLAP_TOLERANCE]
```

- Accept segments that start before but end after offset boundary
- Tolerates timestamp estimation errors (Whisper segments vary 0.5–5s)
- Frontend handles potential duplicate words via deduplication

### From PITFALLS.md: Critical Risks & Prevention

**Top 5 Pitfalls (with consequences):**

| Pitfall                         | Consequence                                                            | Prevention Strategy                                               | Phase   |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| WebSocket silent failures       | User loses entire session, no error message                            | Heartbeat + timeout detection + explicit error propagation        | Phase 1 |
| Offset boundary filtering       | Words mysteriously missing from transcript                             | Tolerance window (0.5s) + overlap handling                        | Phase 1 |
| Rate limit feedback gap         | User retries immediately, hits limit again                             | Parse Retry-After, show countdown, distinguish error types        | Phase 1 |
| Resource leaks (audio cleanup)  | Mic stays on, battery drains, memory leaks accumulate                  | beforeunload + explicit track.stop() + $effect cleanup            | Phase 2 |
| SSE timeout (proxy closes idle) | Spinner hangs indefinitely, backend finishes but frontend doesn't know | Keepalive comments every 15-30s + frontend timeout + proxy config | Phase 2 |

**Additional risks to monitor:**

- Exponential backoff without jitter (thundering herd) — always add jitter to retry delays
- Silent failures with 200 OK (malformed response) — validate response schema, not just status code
- Duplicate text in overlapping chunks — use fuzzy deduplication (Levenshtein > 0.85 threshold)
- Mobile network transitions — SSE mode already used in Vercel; inherently more resilient than WebSocket

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Streaming Stability (Critical Bugs)**
_Goal:_ Fix three known bugs; enable reliable production use for 30–60 min recordings

**What it includes:**

1. WebSocket reconnection + heartbeat (prevents silent failures)
2. Offset filtering tolerance (fixes boundary word loss)
3. Rate limit feedback (Retry-After parsing, countdown display)
4. Exponential backoff with jitter (prevent thundering herd)

**Features from FEATURES.md:**

- WebSocket auto-reconnect (Table Stakes)
- Rate limit user feedback (Table Stakes)
- Audio segment boundary handling (Table Stakes)
- Streaming timeout detection (supporting)

**Pitfalls to avoid:**

- Pitfall 1 (WebSocket state sync)
- Pitfall 2 (offset filtering)
- Pitfall 3 (rate limit feedback)
- Pitfall 7 (jitter in backoff)

**Dependencies:**

- Install: `reconnecting-websocket@4.4.0`, `tenacity@9.0.0`, `ky@1.14.3`, `slowapi@0.1.9`
- Refactor: backend/main.py (retry decorator, rate limit middleware, Retry-After parsing)
- Update: src/routes/transcribe/+page.svelte (WebSocket reconnection, error message routing)
- Testing: unit tests for offset filtering tolerance, integration tests for rate limit scenarios

**Validation Gates:**

- WebSocket survives 5 consecutive disconnects (manual network kill)
- Offset filtering preserves words at boundaries (test with synthetic audio)
- Rate limited requests show countdown (manual API rate limit test)
- Backoff delays have jitter (log inspection)

---

**Phase 2: Resource & Connection Resilience**
_Goal:_ Prevent resource leaks and timeout hangs; improve experience on unreliable networks

**What it includes:**

1. Audio resource cleanup (MediaRecorder, AudioContext, MediaStreamTracks)
2. SSE keepalive comments (prevent proxy timeout on long processing)
3. Client-side stream timeout detection (fail fast instead of hanging)
4. Network change detection (mobile WiFi → cellular transitions)

**Features from FEATURES.md:**

- Resource cleanup on unload (Table Stakes)
- SSE reconnection improvement (Table Stakes)
- Consistent error messages (supporting)
- Graceful degradation (already present, enhance)

**Pitfalls to avoid:**

- Pitfall 5 (resource leaks)
- Pitfall 6 (SSE timeout without keepalive)
- Pitfall 9 (mobile network transitions)

**Dependencies:**

- No new packages (use native browser APIs)
- Refactor: SSE endpoints in main.py (add keepalive generator)
- Update: src/routes/transcribe/+page.svelte (beforeunload handler, $effect cleanup, EventSource timeout)
- Browser-specific testing (Chrome, Firefox, Safari mobile)

---

**Phase 3: Quality Improvements (Optional)**
_Goal:_ Polish transcription quality and handle edge cases

**What it includes:**

1. Duplicate text deduplication (fuzzy Levenshtein matching, > 0.85 threshold)
2. Audio quality presets (8kHz / 16kHz / 24kHz options, not critical)
3. Schema validation (detect malformed API responses)
4. Error message improvement (sanitize, make actionable)

**Pitfalls to avoid:**

- Pitfall 4 (silent 200 OK failures)
- Pitfall 8 (duplicate text)
- Pitfall 10 (audio quality one-size-fits-all)

**Lower priority:** Can be addressed post-launch based on user feedback

---

### Phase-Specific Research Flags

| Phase       | Needs Research                                                                                                                      | Well-Understood                                                               | Flags                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Phase 1** | WebSocket state machine edge cases (server restart, client timeout); Mistral rate limit behavior (exact limits, Retry-After format) | Exponential backoff, 429 handling (HTTP spec), reconnecting-websocket library | Test Retry-After format with actual Mistral rate limit; confirm AssemblyAI reconnection behavior |
| **Phase 2** | Proxy behavior on different CDNs (Vercel, Cloudflare); mobile Safari audio cleanup                                                  | SSE keepalive pattern, beforeunload reliability; EventSource API              | Empirical testing on mobile devices; Vercel SSE timeout verification                             |
| **Phase 3** | Whisper segment boundary behavior; deduplication threshold tuning                                                                   | Levenshtein distance, difflib Python stdlib                                   | Test offset tolerance with various audio types (fast speech, pauses, music)                      |

---

## Confidence Assessment

| Area             | Confidence | Rationale                                                                                                   | Gaps                                                                                          |
| ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Stack**        | HIGH       | All libraries battle-tested, official docs, production examples. reconnecting-websocket 6+ years stable.    | None; implementation gaps only                                                                |
| **Features**     | HIGH       | Three bugs clearly identified, behavior reproducible. Feature gaps validated by code inspection.            | None; all gaps documented in current codebase                                                 |
| **Architecture** | HIGH       | Patterns well-documented in official guides (WebSocket.org, MDN, API docs). Code examples provided.         | Whisper segment boundary timing (empirical test needed)                                       |
| **Pitfalls**     | HIGH       | Industry best practices, RFC specs, production examples. BABL-specific analysis validated against codebase. | Mistral Retry-After format (test with actual rate limit); browser-specific cleanup edge cases |

**Overall Confidence: HIGH** for Phase 1 (critical path is clear and documented). MEDIUM for Phase 2 (requires CDN/browser testing). LOW for Phase 3 (quality improvements, defer to feedback).

---

## Recommended Priority Order

1. **WebSocket reconnection** (highest user impact — recording appears to work but produces nothing)
2. **Rate limit feedback** (users have no way to know what went wrong)
3. **Offset filtering tolerance** (subtle data loss, hardest to detect)
4. **Exponential backoff jitter** (prevents cascading failures)
5. **Resource cleanup** (defensive, prevents mic/memory leaks)
6. **SSE keepalive** (prevents timeout hangs on long processing)

---

## Sources & Evidence

### STACK.md Sources

- reconnecting-websocket npm + official GitHub (6 years production, 4.4.0 stable)
- MDN Server-Sent Events (native EventSource API, Last-Event-ID behavior)
- ky GitHub (retry configuration, exponential backoff formula)
- tenacity GitHub/PyPI (industry standard Python retry, async support)
- slowapi Medium guide 2026 (production patterns, Redis integration)
- AssemblyAI official docs (streaming, error codes, session timeout)
- Mistral rate limits docs (usage tiers, rate limit structure)

### FEATURES.md Sources

- BABL codebase inspection (CONCERNS.md, +page.svelte, main.py)
- User expectations (streaming app conventions, accessibility)
- Differentiators documented in BABL.md

### ARCHITECTURE.md Sources

- WebSocket.org FastAPI guide (reconnection patterns, exponential backoff)
- BABL codebase analysis (lines 310–334, 394–440, 532–533)
- Official API documentation (AssemblyAI, Mistral, Whisper)
- Svelte 5 documentation ($effect cleanup pattern)

### PITFALLS.md Sources

- MDN Web Docs (AudioContext, MediaStreamTrack, EventSource)
- WebSocket.org best practices (reconnection, state management)
- 2026 technical blog posts (OneUpTime, DEV Community, Deepgram)
- W3C specifications (Media Capture, Server-Sent Events)
- BABL codebase inspection (production concerns, edge cases)

---

## Validation Checklist for Roadmapping

Use these criteria to validate implementation in each phase:

**Phase 1 Validation:**

- [ ] WebSocket survives 5 consecutive network disconnects (manual network kill test)
- [ ] Offset filtering preserves words at 0.1s–0.9s before offset (synthetic audio test)
- [ ] Rate limited responses show countdown timer matching Retry-After value
- [ ] Backoff delays log with jitter values (log inspection)
- [ ] No silent failures in WebSocket disconnect scenarios (error visible to user)

**Phase 2 Validation:**

- [ ] MediaRecorder stops and AudioContext closes on page unload
- [ ] Long processing (>2min) completes without SSE timeout (test on Vercel)
- [ ] Network change (WiFi ↔ cellular) triggers reconnection attempt
- [ ] EventSource timeout shows error instead of hanging spinner

**Phase 3 Validation:**

- [ ] Duplicate words at boundaries removed (Levenshtein > 0.85 match)
- [ ] Malformed API responses detected and logged
- [ ] Error messages user-facing (no stack traces or internal details)

---

## Ready for Requirements Definition

This research provides sufficient clarity to proceed with detailed requirements for Phase 1. Key inputs for requirements:

1. **WebSocket reconnection:** Specific heartbeat interval (15s recommended), timeout threshold (30s recommended), max retries (5 recommended)
2. **Offset filtering:** Tolerance window (0.5s recommended), word-level deduplication strategy
3. **Rate limiting:** Retry-After header parsing (both seconds and HTTP-date format), user message template, countdown timer UI
4. **Error taxonomy:** Error codes (upstream_disconnect, rate_limited, timeout, network_error, validation_error)

All patterns have production-tested implementations available in STACK.md. No architectural redesign required; focus on focused bug fixes.

---

**Synthesis completed:** 2026-03-23
**Next step:** Requirements definition for Phase 1 (WebSocket + offset + rate limiting)
**Follow-up research needed:** Phase 2 CDN/browser testing, Phase 3 Whisper boundary empirical testing
