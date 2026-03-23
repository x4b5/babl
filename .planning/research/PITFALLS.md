# Domain Pitfalls: Streaming Audio Applications

**Domain:** Real-time speech-to-text with WebSocket/SSE streaming
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Streaming audio applications face three critical pitfall categories: **connection lifecycle management** (reconnection logic, state synchronization), **audio processing boundaries** (chunking, overlap, duplicate filtering), and **API reliability** (rate limiting, silent failures, timeout handling). Based on research and the existing codebase (BABL), the most dangerous pitfalls are silent failures in WebSocket forwarding, offset filtering at segment boundaries, and rate limit handling that provides no user feedback. These issues compound because they only manifest under production conditions (network interruptions, load spikes, long recordings) rather than local development.

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or major reliability issues.

---

### Pitfall 1: WebSocket Reconnection Without State Sync

**What goes wrong:** Backend WebSocket connection to streaming service (AssemblyAI) drops, but frontend WebSocket to backend stays open. User sees "recording" indefinitely with no transcription output and no error message. This is a **silent failure** — the system appears to be working but is actually broken.

**Why it happens:**

- Reconnection logic treats connection status and processing status as the same thing
- Backend connection state isn't communicated to frontend
- No timeout detection on frontend (if no events arrive for N seconds, assume failure)
- State kept in server memory (which disappears on restart or connection drop)

**Consequences:**

- User loses entire recording session (no partial results recovered)
- No indication that failure occurred until user manually stops recording
- Trust in application reliability is destroyed
- In production: appears as "app randomly stops working" bug reports

**Prevention:**

1. **Implement heartbeat/keepalive on both sides:**
   - Backend → Frontend: Send \`{"type": "heartbeat"}\` every 10-15 seconds
   - Frontend → Backend: Expect heartbeat; if >30s without event, trigger error state
   - Prevents silent failures where connection is open but no data flows

2. **Separate connection state from processing state:**
   - Track: \`wsConnected\`, \`backendStreamActive\`, \`receivingTranscription\`
   - If \`wsConnected && !receivingTranscription\` for >30s → show error
   - Frontend should timeout and fail fast, not hang indefinitely

3. **Store partial results client-side:**
   - Buffer transcription chunks in frontend state/IndexedDB
   - On reconnection, send last processed timestamp to resume
   - Backend should support resume via offset parameter (already exists in \`/transcribe-live\`)

4. **Exponential backoff with jitter for reconnection:**
   \`\`\`typescript
   const delay = Math.min(1000 _ (2 \*\* attempt), 32000) + Math.random() _ 1000;
   \`\`\`
   - Without jitter: all clients reconnect simultaneously → thundering herd
   - Prevents DDoS-ing your own backend during outages

**Detection (warning signs):**

- User reports "stuck on recording screen"
- Backend logs show AssemblyAI disconnect but no frontend error
- WebSocket connection count increases without transcription throughput
- No timeout errors in frontend analytics

**Phase to address:** Phase 1 (WebSocket reliability) — first priority
**BABL-specific notes:** Current code has no heartbeat mechanism (lines 394–440 in +page.svelte), no timeout detection, no partial result recovery. Backend forwards AssemblyAI events but doesn't track connection health separately.

---

### Pitfall 2: Audio Segment Offset Filtering Loses Boundary Words

**What goes wrong:** When using offset-based filtering (\`start < offset\` = skip segment), words that straddle the boundary get dropped. Example: segment starts at 4.9s with offset=5s → entire segment discarded, even though most of its content is new.

**Why it happens:**

- Hard boundary filtering (\`if start < offset: skip\`) is naive
- Whisper segments don't align perfectly to boundaries (vary 0.5–5s)
- No tolerance window or overlap handling in filtering logic
- Timestamps are estimates, not exact frame-level precision

**Consequences:**

- Words/phrases randomly missing from transcription (especially at 5s intervals)
- User sees gaps or nonsensical text (e.g., "I went to the store" → "I went store")
- Worse in live transcription mode (every 5s chunk loses boundary words)
- Creates "Swiss cheese" transcripts with unpredictable holes

**Prevention:**

1. **Use tolerance window, not hard boundary:**
   \`\`\`python

   # Bad (current):

   if segment["start"] < offset:
   continue

   # Good:

   TOLERANCE_SECONDS = 0.5 # Allow 500ms before offset
   if segment["end"] < (offset - TOLERANCE_SECONDS):
   continue
   \`\`\`
   - Accepts segments that start slightly before but end after offset
   - Tolerates timestamp estimation errors

2. **Track word-level positions, not just segment start:**
   - If segment overlaps offset, filter at word level within segment
   - Only skip words with \`word["end"] < offset\`
   - Preserves partial segments that contain new content

3. **Maintain 2-3s overlap in audio chunks, filter duplicates post-transcription:**
   - Send overlapping audio to Whisper (already doing 3s overlap)
   - Accept duplicate transcription
   - Deduplicate in frontend based on text similarity (Levenshtein distance)
   - More resilient than trying to prevent duplication server-side

4. **Log boundary decisions for debugging:**
   \`\`\`python
   if segment["start"] < offset and segment["end"] > offset:
   logger.info(f"Boundary segment: start={segment['start']}, end={segment['end']}, offset={offset}, decision=accept")
   \`\`\`
   - Makes it visible when boundary logic is triggered
   - Helps diagnose missing words in production

**Detection (warning signs):**

- User reports "transcription misses words"
- Missing words correlate with 5-second intervals (live mode)
- Segments logged with \`start < 5\` but \`end > 5\` getting skipped
- Manual comparison of audio vs transcript shows gaps

**Phase to address:** Phase 1 (live transcription offset filtering)
**BABL-specific notes:** Current implementation (line 532–533 in main.py) uses hard boundary \`if segment["start"] < offset\`. No tolerance, no word-level filtering, no boundary logging. Affects \`/transcribe-live\` endpoint.

---

### Pitfall 3: Rate Limiting Without User-Facing Feedback

**What goes wrong:** API returns 429 rate limit error → backend retries with exponential backoff → all retries fail → generic "Verslaglegging mislukt" error shown to user. User doesn't know (a) why it failed, (b) how long to wait, or (c) that they triggered a rate limit.

**Why it happens:**

- Retry logic conflates transient errors (network) with rate limits (need to wait)
- \`Retry-After\` header not parsed or propagated to frontend
- Error messages designed for developers, not users
- No rate limit state tracking (how close am I to limit?)

**Consequences:**

- User immediately retries → hits rate limit again → thinks app is broken
- No guidance on when to retry (30s? 5min? 1hr?)
- Support burden increases ("why isn't correction working?")
- Users abandon task instead of waiting appropriate time

**Prevention:**

1. **Parse and propagate \`Retry-After\` header:**
   \`\`\`python
   if response.status_code == 429:
   retry_after = response.headers.get("Retry-After", "60") # seconds or HTTP-date
   raise RateLimitError(f"Rate limited. Retry after {retry_after}s", retry_after=int(retry_after))
   \`\`\`
   - Don't guess retry time — API tells you exactly when to retry
   - Frontend shows countdown: "Rate limit reached. Retry in 43s..."

2. **Distinguish error types in frontend:**
   \`\`\`typescript
   if (error.type === "RATE_LIMIT") {
   showError(\`Too many requests. Please wait \${error.retryAfter} seconds.\`);
   // Disable button until countdown finishes
   } else if (error.type === "NETWORK") {
   showError("Connection failed. Check your internet and retry.");
   }
   \`\`\`
   - Different errors → different user actions
   - Rate limit = wait, network = check connection, service = contact support

3. **Implement client-side rate limit tracking:**
   - Track requests in last 60s (e.g., via local state)
   - Show warning before hitting limit: "You've made 9 of 10 allowed requests in the last minute"
   - Throttle button enabling based on known limits

4. **Graceful degradation for heavy users:**
   - If rate limited repeatedly, suggest switching to local mode (Ollama)
   - Or batch corrections (wait and submit multiple at once)
   - Educate user on API constraints

**Detection (warning signs):**

- Multiple 429 errors in backend logs
- User repeatedly clicks "Correct" button rapidly
- Generic error shown but logs show rate limit
- No \`Retry-After\` header value logged

**Phase to address:** Phase 1 (Mistral rate limiting)
**BABL-specific notes:** Current implementation (lines 310–334 in main.py, lines 161–169 in +server.ts) retries up to 8 times with exponential backoff but doesn't parse \`Retry-After\`. Frontend receives generic "Verslaglegging mislukt" with no indication it's a rate limit. No client-side tracking.

---

### Pitfall 4: Silent Failures (200 OK with Invalid Data)

**What goes wrong:** API responds with HTTP 200 status, but response body contains incomplete, malformed, or empty data. System treats this as success, displays broken results to user, and never logs an error.

**Why it happens:**

- Validation only checks HTTP status code, not response schema
- Streaming APIs may return 200 even if processing partially failed
- Business logic errors (e.g., empty transcript) don't map to HTTP errors
- Monitoring focuses on uptime, not correctness

**Consequences:**

- "It worked" but results are garbage (blank transcript, truncated text, corrupted audio)
- Hard to debug because no errors logged
- Discovered by users ("why is my transcript empty?") not monitoring
- Degrades trust even though system is "up"

**Prevention:**

1.  **Validate response schema, not just status:**
    \`\`\`typescript
    if (response.status === 200) {
    const data = await response.json();

        // Validate expected structure
        if (!data.text || data.text.trim().length === 0) {
            throw new ValidationError("Empty transcript returned");
        }

        if (!data.id || !data.status) {
            throw new ValidationError("Malformed API response");
        }

    }
    \`\`\`
    - 200 OK + invalid data = failure, not success

2.  **Log unexpected response patterns:**
    \`\`\`python
    if response.status_code == 200:
    data = response.json()
    if len(data.get("segments", [])) == 0:
    logger.warning(f"Successful response but zero segments: {data}")
    \`\`\`
    - Makes silent failures visible in logs
    - Can trigger alerts for anomaly patterns

3.  **Implement synthetic monitoring:**
    - Periodically submit test audio → validate output quality
    - Detects regressions in API behavior (upstream model changes, rate limits, service degradation)
    - Catches issues before users report them

4.  **Business-level success metrics:**
    - Track: average transcript length, error rate per endpoint, empty responses
    - Alert when metrics deviate (e.g., 50% drop in avg transcript length = likely issue)
    - Complements traditional uptime monitoring

**Detection (warning signs):**

- User reports "blank transcript" but no errors in logs
- API response times spike but status codes are 200
- Transcript length drops significantly without explanation
- Users manually retry same audio and get different (better) results

**Phase to address:** Phase 2 (error handling improvements) — after reconnection logic
**BABL-specific notes:** Current code checks \`response.ok\` but doesn't validate response content structure. No schema validation for AssemblyAI or Mistral responses. No monitoring of transcript quality metrics.

---

## Moderate Pitfalls

Cause user frustration or require workarounds, but not catastrophic.

---

### Pitfall 5: Resource Leaks from Improper Audio Cleanup

**What goes wrong:** Browser crashes, page navigation during recording, or component unmount leaves MediaRecorder stream and AudioContext running. Microphone indicator stays lit, battery drains, memory leaks accumulate.

**Why it happens:**

- \`beforeunload\` event is unreliable (doesn't fire on mobile, background tab kills)
- AudioContext not closed in cleanup (only suspended)
- MediaStreamTracks not explicitly stopped
- Event listeners not removed, creating reference cycles

**Consequences:**

- Microphone permission stays active → privacy concern
- Battery drain from active audio processing
- Memory leaks compound over time (especially in SPAs with navigation)
- Mobile devices kill tab due to excessive resource usage

**Prevention:**

1. **Use \`pagehide\` instead of \`beforeunload\` for cleanup:**
   \`\`\`typescript
   window.addEventListener("pagehide", () => {
   stopRecording();
   cleanupAudioResources();
   });
   \`\`\`
   - \`pagehide\` is more reliable than \`beforeunload\` (fires on mobile, bfcache)
   - Chrome is deprecating \`unload\` event; \`pagehide\` is the future

2. **Stop all MediaStreamTracks explicitly:**
   \`\`\`typescript
   function cleanupAudioResources() {
   if (mediaRecorder?.stream) {
   mediaRecorder.stream.getTracks().forEach(track => track.stop());
   }
   if (audioContext?.state !== "closed") {
   audioContext.close(); // Not just suspend()
   }
   mediaRecorder = null;
   audioContext = null;
   }
   \`\`\`
   - Must stop tracks AND close context
   - Deprecated \`MediaStream.stop()\` doesn't work; use \`track.stop()\` on each track

3. **Svelte 5 \`$effect\` cleanup for component unmount:**
   \`\`\`typescript
   $effect(() => {
   // Setup audio
   return () => {
   cleanupAudioResources(); // Runs on unmount
   };
   });
   \`\`\`
   - Ensures cleanup even if user navigates away without stopping

4. **Implement recording timeout (safety net):**
   - Auto-stop recording after 2 hours (max supported duration)
   - Prevents accidental infinite recording

**Detection (warning signs):**

- Microphone indicator stays on after leaving page
- Memory usage grows with each recording session
- Mobile Safari kills tab during long recordings
- AudioContext count increases in heap snapshot

**Phase to address:** Phase 2 (resource cleanup)
**BABL-specific notes:** Current code (lines 281–318, 488–494 in +page.svelte) creates MediaRecorder and AudioContext but only has basic cleanup in \`stopRecording()\`. No \`pagehide\` listener, AudioContext is closed but may not be in all paths. No timeout safety net.

---

### Pitfall 6: SSE Streaming Connection Timeout Without Keepalive

**What goes wrong:** Server-Sent Events (SSE) connection stays open waiting for transcription results, but intermediate proxies (load balancers, CDNs) close "idle" connections after 60-120 seconds. Frontend doesn't detect closure, thinks it's still waiting for results.

**Why it happens:**

- No keepalive/heartbeat comments sent during long processing
- Proxies interpret no data = idle, even if processing is active
- Frontend EventSource auto-reconnects, but server starts new request (not resume)
- User doesn't know if processing is still happening or connection died

**Consequences:**

- Long audio files (>2min processing) trigger timeouts
- User sees spinner indefinitely, doesn't know if it failed
- Backend continues processing but results never reach frontend
- Wasted compute (backend finishes, frontend already disconnected)

**Prevention:**

1.  **Send keepalive comments every 15-30 seconds:**
    \`\`\`python
    async def transcribe_sse(audio_data):
    async def event_generator():
    yield {"event": "progress", "data": '{"status": "starting"}'}

            # During processing:
            last_keepalive = time.time()
            for chunk in process_audio(audio_data):
                yield {"event": "data", "data": json.dumps(chunk)}

                # Keepalive every 20s
                if time.time() - last_keepalive > 20:
                    yield {"event": "keepalive", "data": "{}"}
                    last_keepalive = time.time()

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    \`\`\`
    - Keeps connection alive even during slow processing
    - Proxies see activity, don't timeout

2.  **Configure timeout for SSE endpoints specifically:**
    - In Nginx, Istio, etc: set longer timeout for SSE paths
    - Example (Nginx): \`proxy_read_timeout 300s;\` for \`/transcribe\*\` routes
    - Prevents infrastructure from killing legitimate long-running streams

3.  **Frontend timeout with user feedback:**
    \`\`\`typescript
    const sse = new EventSource("/transcribe");
    const timeoutId = setTimeout(() => {
    sse.close();
    showError("Processing is taking longer than expected. Please try a shorter recording.");
    }, 180000); // 3 minutes

    sse.addEventListener("message", (e) => {
    clearTimeout(timeoutId); // Reset on each message
    });
    \`\`\`
    - Fails fast with clear message instead of indefinite spinner

4.  **Log connection lifecycle:**
    - Backend: log when SSE connection opens, closes, times out
    - Frontend: log EventSource state changes (open, error, close)
    - Correlate logs to diagnose where failure occurred

**Detection (warning signs):**

- Processing completes in backend logs but frontend shows spinner
- EventSource reconnects repeatedly during long transcription
- Proxy logs show connection timeouts on \`/transcribe\` routes
- User reports "stuck processing" for files >2min

**Phase to address:** Phase 2 (SSE reliability)
**BABL-specific notes:** Current SSE endpoints (\`/transcribe\`, \`/correct\`, \`/transcribe-api\`) send data chunks but no keepalive comments. No explicit timeout handling in frontend. Backend logs don't track SSE connection lifecycle.

---

### Pitfall 7: Exponential Backoff Without Jitter (Thundering Herd)

**What goes wrong:** Multiple clients hit rate limit at same time → all retry with exponential backoff → all retry at exactly same time again (1s, 2s, 4s, 8s) → create synchronized "thundering herd" that continuously triggers rate limiting.

**Why it happens:**

- Deterministic retry timing (no randomness)
- Clients batch at end of delay intervals
- Rate limit resets, all clients hit it simultaneously again

**Consequences:**

- Rate limiting never resolves (herd keeps retriggering it)
- Backend sees wave pattern of requests instead of smooth distribution
- Legitimate requests get caught in rate limit cycle
- System appears to be in permanent failure state

**Prevention:**

1. **Add jitter to exponential backoff:**
   \`\`\`python
   import random

   def get_retry_delay(attempt: int, base: float = 1.0, max_delay: float = 32.0) -> float:
   exponential = min(base _ (2 \*\* attempt), max_delay)
   jitter = random.uniform(0, exponential _ 0.3) # ±30% jitter
   return exponential + jitter
   \`\`\`
   - Spreads retries across time window
   - Prevents synchronization of retry attempts

2. **Prefer server-specified \`Retry-After\` over calculated backoff:**
   - API knows its rate limit reset time better than client guesses
   - Still add small jitter (1-3s) to \`Retry-After\` to prevent bunching

3. **Circuit breaker pattern for repeated failures:**
   \`\`\`python
   if consecutive_429_errors > 5: # Open circuit: don't retry for 5 minutes
   raise CircuitBreakerOpen("API rate limited repeatedly. Waiting 5 minutes.")
   \`\`\`
   - Stops hammering API after clear pattern of failure
   - Gives system time to recover

**Detection (warning signs):**

- Rate limit errors come in waves (e.g., every 8 seconds)
- Multiple clients show identical retry timing in logs
- Backend sees request spikes at predictable intervals
- Rate limiting never resolves despite long delays

**Phase to address:** Phase 1 (Mistral rate limiting) — when improving retry logic
**BABL-specific notes:** Current retry logic (lines 310–334 in main.py) uses exponential backoff but no jitter. All clients retry at deterministic intervals. No circuit breaker.

---

## Minor Pitfalls

Cause occasional issues or quality degradation, not critical.

---

### Pitfall 8: Duplicate Text in Overlapping Audio Chunks

**What goes wrong:** Send audio with 3s overlap to Whisper for context → transcription contains duplicate words/phrases at boundaries → displayed text shows repetition (e.g., "I went to the store to the store and bought milk").

**Why it happens:**

- Overlap is necessary for Whisper context (prevents missing boundary words)
- Deduplication strategy is naive (assumes exact text match)
- Whisper non-deterministic: same audio → slightly different text each time
- No fuzzy matching for "similar enough" phrases

**Consequences:**

- User sees stuttering text, looks unprofessional
- Manual editing required to remove duplicates
- Confusing for downstream processing (word counts wrong, search broken)

**Prevention:**

1.  **Use fuzzy deduplication (Levenshtein distance):**
    \`\`\`python
    from difflib import SequenceMatcher

    def is_duplicate(text1: str, text2: str, threshold: float = 0.85) -> bool:
    ratio = SequenceMatcher(None, text1, text2).ratio()
    return ratio > threshold
    \`\`\`
    - Catches duplicates even when wording varies slightly
    - Example: "to the store" vs "to the store" = 1.0, "to the store" vs "to the shop" = 0.82

2.  **Word-level deduplication with timestamp windowing:**
    \`\`\`python
    def deduplicate_segments(segments: list, overlap_window: float = 3.0):
    deduplicated = []
    for i, seg in enumerate(segments):
    if i == 0:
    deduplicated.append(seg)
    continue

            prev_end_time = deduplicated[-1]["end"]
            if seg["start"] < prev_end_time + overlap_window:
                # In overlap zone: check for duplicates at word level
                # Only add words not in previous segment
                new_words = [w for w in seg["words"] if w["start"] >= prev_end_time]
                deduplicated.append({**seg, "words": new_words})
            else:
                deduplicated.append(seg)
        return deduplicated

    \`\`\`
    - More surgical than segment-level deduplication
    - Preserves unique content even in overlap zone

3.  **Configure Whisper with higher temperature for consistency:**
    - Lower temperature (0.0–0.2) → more deterministic output
    - Reduces variation in repeated transcriptions of same audio
    - Trade-off: may be less creative/accurate on ambiguous audio

**Detection (warning signs):**

- User reports "repeated words in transcript"
- Duplicates occur at 5-second intervals (aligns with chunk size)
- Manual comparison shows overlap = duplication pattern
- High string similarity between adjacent segments

**Phase to address:** Phase 3 (quality improvements) — after critical bugs fixed
**BABL-specific notes:** Current implementation sends 3s overlap (lines 322–366 in +page.svelte) but no deduplication logic in frontend or backend. Whisper segments are concatenated directly.

---

### Pitfall 9: Mobile Network Transitions Kill WebSocket

**What goes wrong:** Mobile user switches from WiFi to cellular (or between cell towers) → WebSocket connection drops → app doesn't reconnect → user loses recording session.

**Why it happens:**

- Network change = IP address change = TCP connection broken
- WebSocket doesn't survive network interface transitions
- No detection of network state changes
- Application assumes stable network throughout session

**Consequences:**

- Mobile users have terrible experience ("app never works on my phone")
- Lost work (recording can't be recovered)
- Bad reviews mentioning "always crashes" or "unreliable"

**Prevention:**

1. **Detect network changes and preemptively reconnect:**
   \`\`\`typescript
   let connection: WebSocket;

   // Listen for online/offline events
   window.addEventListener("online", () => {
   if (connection.readyState !== WebSocket.OPEN) {
   reconnect();
   }
   });

   // Network Information API (where supported)
   if ("connection" in navigator) {
   navigator.connection.addEventListener("change", () => {
   // Network type changed (e.g., wifi → cellular)
   reconnect();
   });
   }
   \`\`\`
   - Proactively handles known transition points

2. **Prefer SSE over WebSocket for mobile:**
   - SSE auto-reconnects natively in browser
   - Survives network transitions better than WebSocket
   - For BABL: already have SSE fallback for Vercel; make it default on mobile

3. **Buffer data locally during recording:**
   - Store audio chunks in IndexedDB as they're recorded
   - On reconnection, resume from last successfully sent chunk
   - Acts as crash recovery mechanism

4. **Show network status indicator:**
   - User sees "reconnecting..." when network drops
   - Clear feedback that issue is network, not app bug

**Detection (warning signs):**

- High failure rate on mobile vs desktop
- Errors correlate with network type (cellular > WiFi)
- WebSocket close events with code 1006 (abnormal closure)
- User reports "works at home, fails on train/bus"

**Phase to address:** Phase 3 (mobile resilience) — after core stability
**BABL-specific notes:** No network change detection. WebSocket is local-dev only (doesn't deploy to Vercel). SSE mode is primary for deployed app, which is inherently more resilient.

---

### Pitfall 10: Audio Quality Presets Missing (One-Size-Fits-All)

**What goes wrong:** All audio downsampled to 16kHz mono regardless of source quality or user needs. High-quality recordings lose fidelity, low-quality recordings waste bandwidth, and users on slow connections struggle with upload times.

**Why it happens:**

- Whisper trained on 16kHz audio → assumed optimal for all cases
- No configuration UI for quality selection
- Developers optimize for "average" case, ignore edge cases

**Consequences:**

- Professional users with high-end mics lose quality unnecessarily
- Users on 3G connections wait 5+ minutes for large file upload
- Music/podcast transcription suffers (16kHz insufficient for music)

**Prevention:**

1. **Implement quality presets:**
   \`\`\`typescript
   const QUALITY_PRESETS = {
   LOW: { sampleRate: 8000, channels: 1, bitrate: 64 }, // Speech-only, slow connection
   STANDARD: { sampleRate: 16000, channels: 1, bitrate: 128 }, // Default (Whisper optimal)
   HIGH: { sampleRate: 24000, channels: 1, bitrate: 192 }, // High-quality speech
   };
   \`\`\`
   - Give users control based on their needs

2. **Auto-detect connection speed and suggest preset:**
   - Use Network Information API to estimate bandwidth
   - Recommend LOW on slow connections, HIGH on fast

3. **Adaptive quality during recording:**
   - Start with STANDARD
   - If upload lags behind recording, downgrade to LOW
   - If upload is fast, offer to upgrade to HIGH post-recording

**Detection (warning signs):**

- User complaints about audio quality
- Upload times exceed recording duration
- Requests for "better quality" or "faster upload"

**Phase to address:** Phase 4 (feature enhancements) — optional improvement
**BABL-specific notes:** Hardcoded 16kHz mono (lines 254–279 in +page.svelte). No quality selection UI. Not critical for current use case (short recordings, dialect correction doesn't need high fidelity).

---

## Phase-Specific Warnings

Mistakes likely to occur when implementing specific phases of the roadmap.

| Phase Topic                    | Likely Pitfall                                                                 | Mitigation Strategy                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **WebSocket Reconnection**     | Infinite reconnection loop (attempt → fail → attempt immediately)              | Cap max attempts (10), exponential backoff with jitter, circuit breaker   |
| **Offset Filtering**           | Over-correction (adding tolerance causes duplication, not just boundary words) | Test with variety of audio lengths, log filtering decisions               |
| **Rate Limit Handling**        | Parsing \`Retry-After\` incorrectly (HTTP-date vs seconds)                     | Handle both formats, add tests for each                                   |
| **Resource Cleanup**           | Forgetting cleanup in all code paths (error paths, timeout paths)              | Centralize cleanup function, use \`finally\` blocks, test error scenarios |
| **SSE Keepalive**              | Keepalive comments sent too frequently (waste bandwidth) or not at all         | Balance: 15-30s interval, only during long processing, monitor bandwidth  |
| **Deduplication Logic**        | Fuzzy matching too aggressive (removes non-duplicate similar phrases)          | Tune threshold (0.85–0.95), test with edge cases, make configurable       |
| **Mobile Network Transitions** | Network change detection API not supported on all browsers                     | Feature detect, fallback to periodic connection health checks             |
| **Error Message Improvement**  | Exposing internal error details (stack traces, API keys in messages)           | Sanitize errors: user-facing message != logged message                    |
| **Schema Validation**          | Overly strict validation breaks when API adds new fields                       | Validate required fields only, ignore unknown fields, version responses   |
| **Audio Quality Presets**      | Higher sample rates don't improve Whisper accuracy (diminishing returns)       | Research optimal Whisper settings, benchmark accuracy vs quality          |

## Vulnerability Map: Where Research Flags Point

Research reveals these phases need **deeper investigation** during implementation:

### Phase 1: High Risk

- **WebSocket reconnection:** Complex state machine (connected, streaming, processing), many edge cases (server restart, network partition, client timeout)
- **Rate limiting:** API behavior varies (Mistral vs AssemblyAI), need to handle both

### Phase 2: Medium Risk

- **SSE keepalive:** Proxy/CDN behavior varies by provider (Vercel, Cloudflare, Nginx)
- **Resource cleanup:** Browser behavior varies (mobile Safari, Chrome, Firefox)

### Phase 3: Low Risk

- **Deduplication:** Well-understood problem, existing algorithms (Levenshtein), lower consequence if imperfect

---

## Research Confidence Assessment

| Pitfall                        | Confidence | Source Quality                                                                                 |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| WebSocket reconnection         | HIGH       | Official WebSocket.org guides, 2026 blog posts with production examples, RFC 6455              |
| Audio segment offset filtering | MEDIUM     | Domain knowledge + BABL codebase analysis, no official docs on Whisper segmentation boundaries |
| Rate limiting                  | HIGH       | Official API docs (OpenAI, Anthropic), HTTP 429 spec, 2026 rate limit handling guides          |
| Silent failures                | HIGH       | Production API monitoring guides, Dotcom Monitor 2026 articles, industry best practices        |
| Resource cleanup               | HIGH       | MDN Web Docs (AudioContext, MediaStreamTrack), Chrome deprecation notices, W3C specs           |
| SSE timeout handling           | MEDIUM     | MDN EventSource docs, 2026 blog posts, Istio/proxy configuration docs, some anecdotal evidence |
| Exponential backoff jitter     | HIGH       | Rate limiting guides, AWS/Google Cloud retry best practices, RFC 7231                          |
| Duplicate text deduplication   | MEDIUM     | Hugging Face Whisper guides, Deepgram docs, difflib Python stdlib docs, domain knowledge       |
| Mobile network transitions     | MEDIUM     | WebSocket.org best practices, 2026 streaming guides, Network Information API spec              |
| Audio quality presets          | LOW        | Domain knowledge, not critical for BABL use case, no specific research done                    |

**Sources consulted:**

- MDN Web Docs (AudioContext, MediaStreamTrack, EventSource, WebSocket APIs)
- WebSocket.org (reconnection, best practices, SSE comparison)
- Official API documentation (AssemblyAI, Mistral AI, OpenAI Whisper)
- 2026 technical blog posts (OneUpTime, DEV Community, Medium, Deepgram, Dotcom Monitor)
- W3C specifications (Media Capture and Streams, Server-Sent Events)
- BABL codebase analysis (CONCERNS.md, main.py, +page.svelte)

---

## Gaps & Open Questions

Areas where research was inconclusive or needs phase-specific investigation:

1. **Whisper segment boundary behavior:** Exact logic for segment start/end timestamps not documented. Need empirical testing with various audio types (music, rapid speech, silence).

2. **AssemblyAI rate limits:** Documentation doesn't specify exact rate limits (requests/minute). Need to test in production or contact support for enterprise limits.

3. **Mistral AI \`Retry-After\` header format:** Unclear if Mistral returns seconds or HTTP-date format. Need to test with rate-limited request.

4. **Browser-specific MediaRecorder cleanup:** Memory leak reports vary by browser (Chrome vs Firefox vs Safari). Need per-browser testing to confirm cleanup strategy works universally.

5. **Vercel SSE timeout behavior:** Docs unclear on exact timeout for streaming responses. Community reports vary (60s–300s). Need to test empirically.

6. **Mobile network transition resilience:** Limited testing on actual mobile devices. Desktop simulation doesn't capture cellular tower handoff behavior accurately.

---

**Confidence Summary:** Research is HIGH confidence for WebSocket/SSE patterns, rate limiting, and resource cleanup (well-documented, official sources). MEDIUM confidence for audio-specific issues (offset filtering, deduplication, mobile resilience) due to less official documentation and more reliance on domain knowledge and anecdotal evidence. LOW confidence for audio quality presets (out of scope for current phase, minimal research conducted).

**Recommendation for roadmap:** Prioritize Phase 1 (WebSocket reliability, offset filtering, rate limiting) as these are highest confidence and highest impact. Phase 2 (SSE keepalive, resource cleanup) are well-understood but require testing. Phase 3+ (deduplication, mobile, quality presets) are lower priority and can be addressed incrementally based on user feedback.

---

_Researched: 2026-03-23_
_Researcher: GSD Project Research Agent_
_Review status: Pending validation from roadmap planning phase_
