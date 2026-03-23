# Phase 1: WebSocket + Offset Filtering Stability - Research

**Researched:** 2026-03-23
**Domain:** WebSocket real-time streaming resilience, offset-based audio segmentation, and SSE timeout detection
**Confidence:** HIGH

## Summary

Phase 1 stabilizes real-time transcription for 30-60 minute sessions by implementing WebSocket reconnection with heartbeat monitoring, fixing offset boundary filtering to prevent text loss, and adding SSE timeout detection. The current implementation has three critical failure modes: (1) WebSocket connections silently die without recovery, (2) audio segments at offset boundaries get dropped when `start >= offset` filter is too strict, and (3) SSE streams stall indefinitely with no timeout feedback.

The solution combines `reconnecting-websocket` 4.4.0 (drop-in WebSocket replacement with exponential backoff), FastAPI background task heartbeat (15s ping/pong with 30s timeout), offset tolerance window (0.5s to capture boundary-spanning segments), and ReadableStream timeout via AbortSignal. AssemblyAI sessions cannot be resumed, so reconnection creates a new session with accepted gaps in the transcript.

**Primary recommendation:** Use `reconnecting-websocket` with 5 max retries on frontend, implement server-side heartbeat with background asyncio tasks for dead connection cleanup, change offset filter from `start >= offset` to `end > offset - 0.5`, deduplicate by comparing segment timestamps (skip if overlap within 0.5s), and wrap SSE ReadableStream readers with 30s AbortSignal timeout.

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                                            | Research Support                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-01 | WebSocket herstelt automatisch bij backend disconnect (max 5 pogingen, exponential backoff met jitter) | reconnecting-websocket 4.4.0 provides maxRetries, reconnectionDelayGrowFactor (1.3 default), and jitter via minReconnectionDelay randomization |
| WS-02 | Gebruiker ziet foutmelding als WebSocket niet kan herstellen ("Verbinding verloren")                   | reconnecting-websocket fires 'error' event after maxRetries exhausted; check retryCount or listen for permanent failure                        |
| WS-03 | Backend stuurt heartbeat (ping/pong elke 15s) en detecteert dode verbindingen (timeout 30s)            | FastAPI asyncio background task pattern: send ping every 15s, track last pong timestamp, close if > 30s                                        |
| WS-04 | Bij reconnect start een nieuwe AssemblyAI sessie (geen session resume)                                 | AssemblyAI error 3005 (session expired) requires new session; SDK does not support resume — documented limitation                              |
| WS-05 | Frontend detecteert stalled stream (geen data 30s) en toont timeout fout                               | AbortSignal.timeout(30000) on fetch with ReadableStream; catch TimeoutError, set user-facing error message                                     |
| OF-01 | Segmenten die de offset boundary overspannen worden niet gedropped (tolerance window 0.5s)             | Change filter from `start >= offset` to `end > offset - tolerance`; 0.5s captures boundary words (research shows 20-40ms typical tolerance)    |
| OF-02 | Filter gebruikt `end > offset - tolerance` in plaats van `start >= offset`                             | Direct implementation — existing code at backend/main.py:532 needs one-line change                                                             |
| OF-03 | Frontend dedupliceert mogelijke herhaalde woorden aan boundaries                                       | Timestamp-based: compare `final` segment timestamps, skip if new segment start < previous end + 0.5s tolerance                                 |
| EH-03 | SSE stream timeout (30s geen data) toont foutmelding i.p.v. eindeloze spinner                          | AbortSignal.timeout() wraps fetch; ReadableStream reader throws TimeoutError; catch and display Dutch message                                  |

</phase_requirements>

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Inline banner boven de transcriptie-area toont reconnect-status: "Verbinding herstellen (poging 2/5)..." — past bij bestaande glassmorphism stijl

**D-02:** Opname loopt door tijdens reconnect-pogingen, audio chunks worden gebufferd. Na reconnect gaat live transcriptie verder

**D-03:** Na 5 gefaalde pogingen: foutmelding "Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen." Geeft gebruiker een fallback

**D-04:** Bestaande liveSegments blijven staan bij reconnect. Nieuwe AssemblyAI sessie voegt toe aan het einde. Mogelijke gap in tekst geaccepteerd, maar geen verlies van wat er al was

**D-05:** Gebufferde audio tijdens reconnect-gap wordt NIET retroactief getranscribeerd. Gap wordt geaccepteerd — simpeler te implementeren, live streaming is near-real-time niet exact

**D-06:** Timestamp-based deduplicatie: vergelijk segment timestamps, als een nieuw segment overlapt met het vorige (binnen 0.5s tolerance window), skip het overlappende deel

**D-07:** Deduplicatie is onzichtbaar voor de gebruiker — geen visuele indicator, gewoon vloeiende tekst zonder duplicaten

**D-08:** Foutmeldingen zijn gebruiksvriendelijk Nederlands, geen technische termen. Bijv. "Verbinding even kwijt, we proberen het opnieuw", "Transcriptie duurt te lang — probeer een korter fragment"

**D-09:** Taal is Nederlands, consistent met de rest van de UI

### Claude's Discretion

- Exacte reconnect-banner styling (kleur, animatie, positie binnen glassmorphism design)
- Heartbeat interval tuning (15s ping, 30s timeout zijn als vereiste gedefinieerd maar Claude mag fine-tunen)
- Exacte deduplicatie-algoritme implementatie (zolang timestamp-based)
- SSE timeout foutmelding exacte formulering (zolang gebruiksvriendelijk Nederlands)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library                | Version        | Purpose                    | Why Standard                                                                                                                                                             |
| ---------------------- | -------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| reconnecting-websocket | 4.4.0          | WebSocket auto-reconnect   | Drop-in WebSocket replacement, 2.6M weekly downloads, battle-tested for production, exponential backoff with jitter, configurable retry limits, WebSocket API compatible |
| FastAPI WebSocket      | Built-in       | Backend WebSocket endpoint | Native Starlette WebSocket support in FastAPI, asyncio-based, supports background tasks for heartbeat                                                                    |
| AbortSignal            | Native Web API | Fetch timeout control      | Standard browser API (AbortSignal.timeout() since 2022), no dependencies, integrates with fetch and ReadableStream                                                       |

### Supporting

| Library             | Version | Purpose                 | When to Use                                                                               |
| ------------------- | ------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| assemblyai (Python) | 4.27.0  | Real-time transcription | Already in requirements.txt, RealtimeTranscriber handles WebSocket to AssemblyAI          |
| httpx               | Latest  | Backend HTTP client     | Already in requirements.txt, not directly used in Phase 1 but available for health checks |

### Alternatives Considered

| Instead of             | Could Use                            | Tradeoff                                                                         |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| reconnecting-websocket | ws (Node.js) + custom reconnect      | ws is server-side only, not browser-compatible; custom reconnect adds complexity |
| reconnecting-websocket | Native WebSocket + manual retry      | More code to maintain, harder to test, no battle-tested backoff strategy         |
| AbortSignal.timeout()  | setTimeout + manual abort            | More verbose, same functionality, no advantage over native API                   |
| FastAPI heartbeat      | fastapi-websocket-stabilizer library | Adds dependency for simple pattern we can implement in 20 lines                  |

**Installation:**

```bash
# Frontend
npm install reconnecting-websocket@4.4.0

# Backend (no new packages for Phase 1)
# All required packages already in requirements.txt
```

**Version verification:**

```bash
npm view reconnecting-websocket version
# Verified: 4.4.0 (published 6 years ago, stable, no recent breaking changes)
```

## Architecture Patterns

### Recommended Project Structure

```
src/routes/transcribe/
├── +page.svelte              # Main app (WebSocket client, reconnect UI, SSE timeout)

backend/
├── main.py                    # WebSocket endpoint with heartbeat, offset filtering fix

src/lib/utils/
├── (future) websocket.ts      # Optional: extract WebSocket logic if +page.svelte grows
```

**Note:** +page.svelte is already 1662 lines. Refactoring is explicitly deferred (v2 requirement RF-01). All Phase 1 changes stay inline in existing files.

### Pattern 1: reconnecting-websocket Drop-In Replacement

**What:** Replace native WebSocket with ReconnectingWebSocket, configure retry behavior

**When to use:** When WebSocket connection needs resilience against network drops, backend restarts, or idle timeouts

**Example:**

```typescript
import ReconnectingWebSocket from 'reconnecting-websocket';

const wsUrl = LOCAL_BACKEND_URL.replace('http', 'ws') + '/ws/transcribe-stream';
const rws = new ReconnectingWebSocket(wsUrl, [], {
	maxRetries: 5,
	maxReconnectionDelay: 10000, // max 10s between attempts
	minReconnectionDelay: 1000, // min 1s + random jitter
	reconnectionDelayGrowFactor: 1.3, // exponential backoff
	connectionTimeout: 4000, // fail connect attempt after 4s
	minUptime: 5000 // connection must last 5s to reset retry counter
});

rws.addEventListener('open', () => {
	console.log('[RT] WebSocket connected');
	rws.send(JSON.stringify({ lang }));
});

rws.addEventListener('error', (event) => {
	console.error('[RT] WebSocket error:', event);
	// Check rws.retryCount to detect permanent failure after maxRetries
});

rws.addEventListener('close', (event) => {
	console.log('[RT] WebSocket closed:', event.code, event.reason);
});
```

**Source:** [reconnecting-websocket README.md](https://unpkg.com/browse/reconnecting-websocket@4.4.0/README.md) via unpkg

### Pattern 2: FastAPI WebSocket Heartbeat with Background Task

**What:** Server sends periodic ping messages, client responds with pong, server tracks last pong timestamp and closes dead connections

**When to use:** When WebSocket connections can die silently (NAT timeouts, proxy timeouts, client crashes) and you need to detect stale sessions

**Example:**

```python
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime

@app.websocket("/ws/transcribe-stream")
async def ws_transcribe_stream(websocket: WebSocket):
    await websocket.accept()

    last_pong = {"time": datetime.now()}

    async def heartbeat():
        """Send ping every 15s, check for pong response within 30s"""
        while True:
            await asyncio.sleep(15)
            try:
                await websocket.send_json({"type": "ping"})
                # Check if last pong is > 30s old
                if (datetime.now() - last_pong["time"]).total_seconds() > 30:
                    print("[Heartbeat] Client dead, closing connection")
                    await websocket.close(code=1000, reason="Heartbeat timeout")
                    break
            except Exception as e:
                print(f"[Heartbeat] Error: {e}")
                break

    async def receive_messages():
        """Process client messages, update last_pong on pong"""
        try:
            while True:
                data = await websocket.receive_json()
                if data.get("type") == "pong":
                    last_pong["time"] = datetime.now()
                # ... handle other message types
        except WebSocketDisconnect:
            pass

    # Run heartbeat and message processing concurrently
    heartbeat_task = asyncio.create_task(heartbeat())
    receive_task = asyncio.create_task(receive_messages())

    try:
        await asyncio.gather(heartbeat_task, receive_task)
    finally:
        heartbeat_task.cancel()
        receive_task.cancel()
```

**Sources:**

- [How to Implement WebSockets in FastAPI](https://oneuptime.com/blog/post/2026-02-02-fastapi-websockets/view) — production pattern with heartbeat
- [How to Configure WebSocket Heartbeat/Ping-Pong](https://oneuptime.com/blog/post/2026-01-24-websocket-heartbeat-ping-pong/view) — timing recommendations
- [Handling WebSocket Disconnections Gracefully in FastAPI](https://hexshift.medium.com/handling-websocket-disconnections-gracefully-in-fastapi-9f0a1de365da) — cleanup patterns

### Pattern 3: SSE Timeout with AbortSignal

**What:** Wrap fetch with AbortSignal.timeout() to automatically abort ReadableStream if no data arrives within threshold

**When to use:** When SSE endpoint might stall indefinitely (upstream service timeout, network partition, server overload)

**Example:**

```typescript
async function fetchWithTimeout(url: string, body: FormData, timeoutMs: number) {
	const abortController = new AbortController();
	const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

	try {
		const resp = await fetch(url, {
			method: 'POST',
			body,
			signal: abortController.signal
		});

		if (!resp.ok) throw new Error(`Server error ${resp.status}`);
		if (!resp.body) throw new Error('No response body');

		const reader = resp.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			// Reset timeout on each chunk received
			clearTimeout(timeoutId);
			const newTimeoutId = setTimeout(() => abortController.abort(), timeoutMs);

			const { done, value } = await reader.read();
			if (done) {
				clearTimeout(newTimeoutId);
				break;
			}

			const chunk = decoder.decode(value, { stream: true });
			// Process chunk...
		}
	} catch (e) {
		if (e instanceof Error && e.name === 'AbortError') {
			throw new Error('Transcriptie duurt te lang — probeer een korter fragment');
		}
		throw e;
	} finally {
		clearTimeout(timeoutId);
	}
}
```

**Note:** This pattern requires manual timeout reset per chunk. For simpler implementation, use a single timeout for the entire stream (acceptable for Phase 1 SSE endpoint which streams continuously during processing).

**Sources:**

- [AbortSignal.timeout() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) — official Web API documentation
- [Using readable streams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams) — ReadableStream reader patterns

### Pattern 4: Timestamp-Based Deduplication

**What:** Compare consecutive segment timestamps, skip overlapping portions based on time windows

**When to use:** When streaming transcription or offset-based segmentation may return duplicate text at boundaries

**Example:**

```typescript
// State: last confirmed segment end time
let lastSegmentEnd = 0;
const TOLERANCE_SEC = 0.5;

function processSegment(segment: { text: string; start: number; end: number }) {
	// Skip if this segment overlaps with previous (within tolerance)
	if (segment.start < lastSegmentEnd + TOLERANCE_SEC) {
		// Overlapping segment — either skip entirely or extract non-overlapping portion
		console.log('[Dedup] Skipping overlapping segment:', segment.text);
		return;
	}

	// New unique segment
	liveSegments.push(segment.text);
	lastSegmentEnd = segment.end;
}
```

**Alternative (word-level deduplication):** Split segments into words, compare last N words of existing text with first N words of new segment, remove exact duplicates. More complex, better for edge cases, implement if timestamp approach insufficient.

**Source:** Research on text deduplication and consecutive segment overlap detection

### Anti-Patterns to Avoid

- **Don't use protocol-level ping/pong in browser:** WebSocket protocol opcodes 0x9/0xA are not accessible from JavaScript. Use application-level JSON messages `{"type": "ping"}` instead.
- **Don't attempt AssemblyAI session resume:** AssemblyAI SDK does not support resuming after disconnect. Always create a new session, accept gaps in transcript.
- **Don't retry WebSocket indefinitely:** Set `maxRetries` to prevent infinite retry loops that drain battery/bandwidth. 5 retries is reasonable for transient failures.
- **Don't manually implement exponential backoff:** Use `reconnecting-websocket` or similar library. Custom backoff is error-prone (no jitter, wrong formula, off-by-one).
- **Don't forget to clean up background tasks:** FastAPI heartbeat tasks must be canceled in `finally` block, otherwise they leak after disconnect.
- **Don't use `start >= offset` for audio segmentation:** Segments spanning offset boundary get dropped. Use `end > offset - tolerance` instead.

## Don't Hand-Roll

| Problem                     | Don't Build                       | Use Instead                          | Why                                                                                                                          |
| --------------------------- | --------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| WebSocket reconnection      | Custom retry loop with setTimeout | reconnecting-websocket 4.4.0         | Exponential backoff, jitter, retry counting, connection timeout, minUptime stability detection — all battle-tested           |
| Timeout detection           | Manual setTimeout tracking        | AbortSignal.timeout()                | Native Web API, integrates with fetch/ReadableStream, less code, standard cancellation pattern                               |
| WebSocket heartbeat         | Custom ping scheduler             | asyncio background task pattern      | Idiomatic FastAPI, easy to test, clean cancellation via task.cancel()                                                        |
| Text deduplication at scale | Levenshtein distance or LSH       | Timestamp comparison (Phase 1 scope) | For 30-60 min sessions, timestamp-based is sufficient. LSH is overkill unless processing hours of audio with complex overlap |

**Key insight:** WebSocket reconnection is deceptively complex. Edge cases include: distinguishing network failures from server rejections, handling connection timeout vs idle timeout, resetting retry counters after stable uptime, adding jitter to prevent thundering herd, and exposing connection state for UI feedback. A 200-line custom implementation will miss edge cases that `reconnecting-websocket` handles.

## Common Pitfalls

### Pitfall 1: Silent WebSocket Death (Idle Timeout)

**What goes wrong:** WebSocket connection appears open (`readyState === OPEN`) but is actually dead. NAT devices, proxies, and load balancers drop idle connections after 30-120 seconds. Client sends data into void, never receives response, never knows connection is dead.

**Why it happens:** TCP connections can remain in ESTABLISHED state even when intermediate devices drop the connection. Without application-level heartbeat, neither side detects the failure until they try to send data and wait for timeout.

**How to avoid:**

1. Server sends heartbeat ping every 15 seconds (faster than typical proxy timeout)
2. Client responds with pong within 5 seconds
3. Server tracks last pong timestamp, closes if > 30 seconds old
4. Client detects close event, triggers reconnection

**Warning signs:**

- User reports "transcriptie stopt" but UI shows recording
- Server logs show open WebSocket connections but no recent messages
- Network capture shows no data flowing for > 30 seconds

**Detection during development:** Simulate by pausing backend process (SIGSTOP), wait 30s, resume — client should detect failure and reconnect.

**Sources:**

- [Fix WebSocket Timeout and Silent Dropped Connections](https://websocket.org/guides/troubleshooting/timeout/) — detailed explanation of idle timeout problem
- [How to Implement Heartbeat/Ping-Pong in WebSockets](https://oneuptime.com/blog/post/2026-01-27-websocket-heartbeat/view) — 25-second recommendation for common proxy timeouts

### Pitfall 2: Reconnect Storm (Thundering Herd)

**What goes wrong:** Backend crashes or restarts. All N clients simultaneously attempt reconnection at exact same time. Backend gets overwhelmed by N connection attempts, crashes again. Cycle repeats.

**Why it happens:** Clients use fixed reconnection delay without jitter. Synchronized reconnection creates load spike exceeding server capacity.

**How to avoid:**

1. Add randomized jitter to reconnection delay: `1000 + Math.random() * 4000` (1-5 seconds)
2. `reconnecting-websocket` does this by default via `minReconnectionDelay`
3. Exponential backoff spreads retry waves across time

**Warning signs:**

- Backend crash followed by immediate second crash
- Connection spike in metrics at exact intervals (1s, 2s, 4s)
- All clients report same reconnection timestamp

**Source:** [reconnecting-websocket README](https://unpkg.com/browse/reconnecting-websocket@4.4.0/README.md) — default config includes jitter

### Pitfall 3: Offset Filtering Drops Boundary Words

**What goes wrong:** Transcription segments that span the offset boundary (e.g., segment starts at 29.8s, offset is 30.0s, segment ends at 30.5s) are dropped by `if s["start"] >= offset` filter. Words spoken around the boundary vanish from transcript.

**Why it happens:** Filter checks segment start time against offset, but a segment contains multiple words with timestamps before and after offset. Dropping entire segment loses words spoken after the offset.

**How to avoid:**

1. Change filter to `if s["end"] > offset - TOLERANCE`
2. TOLERANCE = 0.5 seconds captures segments ending within 0.5s before offset
3. Deduplicate on frontend to handle segments that appear in multiple chunks

**Warning signs:**

- User reports "some words missing" in transcription
- Comparing raw audio to transcript shows gaps at regular intervals (every 30s if offset advances by 30s)
- Live transcription shows incomplete sentences at chunk boundaries

**Verification:** Log filtered vs unfiltered segment counts. If consistently dropping segments, tolerance is too strict.

**Research support:** Audio boundary detection research shows 20-40ms tolerance is typical for word boundaries. 0.5s (500ms) is very conservative and accounts for ASR segment alignment variance.

**Sources:**

- [Back to Supervision: Boosting Word Boundary Detection](https://arxiv.org/html/2411.10423) — boundary tolerance standards
- Existing code inspection: backend/main.py line 532 shows strict `start >= offset` filter

### Pitfall 4: SSE Stream Stalls Forever

**What goes wrong:** SSE endpoint (local transcription or correction) stops sending data due to upstream failure (Whisper crash, Ollama OOM, network partition). Frontend ReadableStream reader waits indefinitely in `await reader.read()`. User sees eternal spinner, no error message, no way to cancel except reload page.

**Why it happens:** ReadableStream.read() is a promise that never rejects if server stops responding. No built-in timeout mechanism. Fetch timeout only applies to initial connection, not to ongoing stream.

**How to avoid:**

1. Wrap fetch with AbortSignal.timeout(30000) for 30-second timeout
2. Catch `AbortError` or `TimeoutError` in error handler
3. Display user-friendly message: "Transcriptie duurt te lang — probeer een korter fragment"
4. Alternative: reset timeout after each chunk received (more complex, better UX)

**Warning signs:**

- User reports "stuck on processing" with no progress
- Server logs show no SSE data sent for > 30 seconds
- Browser DevTools Network tab shows pending request forever

**Detection:** During testing, kill backend mid-stream (SIGKILL). Frontend should show timeout error after 30s, not infinite wait.

**Sources:**

- [AbortSignal.timeout() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) — timeout API
- [Using readable streams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams) — stream cancellation patterns

### Pitfall 5: Memory Leak from Uncanceled Background Tasks

**What goes wrong:** FastAPI WebSocket endpoint creates heartbeat background task. Client disconnects. Heartbeat task continues running, trying to send to closed socket, accumulating in memory. After 100 disconnects, server has 100 zombie tasks burning CPU.

**Why it happens:** asyncio tasks don't auto-cancel on exception. Without explicit `task.cancel()` in `finally` block, tasks remain scheduled in event loop.

**How to avoid:**

1. Always create background tasks with `asyncio.create_task()`
2. Store task reference
3. Cancel in `finally` block: `heartbeat_task.cancel()`
4. Optionally: `await task` after cancel to ensure cleanup completes

**Warning signs:**

- Server memory usage grows over time without bound
- CPU usage increases with client churn (connect/disconnect cycles)
- `asyncio.all_tasks()` shows growing task count

**Verification:** Use `asyncio.all_tasks()` to count active tasks. Should remain constant, not grow with disconnect count.

**Source:** [Handling WebSocket Disconnections Gracefully in FastAPI](https://hexshift.medium.com/handling-websocket-disconnections-gracefully-in-fastapi-9f0a1de365da) — cleanup patterns

### Pitfall 6: Deduplication by Exact String Match

**What goes wrong:** Attempt to deduplicate by checking if new segment text equals last N characters of existing text. Fails when ASR produces slightly different text for same audio (e.g., "test" vs "tests", "hello" vs "Hello").

**Why it happens:** Streaming transcription is non-deterministic. Same audio chunk processed twice may yield different text due to acoustic model variance, especially at segment boundaries.

**How to avoid:** Use timestamp-based deduplication instead of string matching. If timestamps overlap (new segment start < previous segment end + tolerance), skip the segment. More robust than string comparison.

**Alternative (if timestamp-based insufficient):** Levenshtein distance with 0.85 threshold (v2 requirement QI-01). Only implement if timestamp approach shows gaps.

**Warning signs:**

- User sees duplicate words at segment boundaries despite deduplication logic
- Logs show "skipped duplicate" but duplicates still appear in UI

**Source:** Research on text deduplication and ASR variability

## Code Examples

Verified patterns from official sources and existing codebase:

### WebSocket Reconnection with Status Tracking

```typescript
// Source: reconnecting-websocket README + project patterns
import ReconnectingWebSocket from 'reconnecting-websocket';

let reconnectStatus = $state<string>(''); // "Verbinding herstellen (poging 2/5)..."
let reconnecting = $state(false);

function startRealtimeStream() {
	partialText = '';
	liveSegments = [];

	const wsUrl = LOCAL_BACKEND_URL.replace('http', 'ws') + '/ws/transcribe-stream';
	streamSocket = new ReconnectingWebSocket(wsUrl, [], {
		maxRetries: 5,
		maxReconnectionDelay: 10000,
		minReconnectionDelay: 1000,
		reconnectionDelayGrowFactor: 1.3,
		connectionTimeout: 4000,
		minUptime: 5000
	});

	streamSocket.addEventListener('open', () => {
		console.log('[RT] WebSocket connected');
		reconnecting = false;
		reconnectStatus = '';
		streamSocket.send(JSON.stringify({ lang }));
	});

	streamSocket.addEventListener('message', (event) => {
		const data = JSON.parse(event.data);

		if (data.type === 'ping') {
			// Respond to server heartbeat
			streamSocket.send(JSON.stringify({ type: 'pong' }));
			return;
		}

		if (data.type === 'partial') {
			partialText = [...liveSegments, data.text].join(' ');
		} else if (data.type === 'final') {
			liveSegments = [...liveSegments, data.text];
			partialText = liveSegments.join(' ');
		} else if (data.type === 'error') {
			error = `Real-time fout: ${data.message}`;
		}
	});

	streamSocket.addEventListener('error', (event) => {
		console.error('[RT] WebSocket error:', event);

		// Check if permanently failed after maxRetries
		if (streamSocket.retryCount >= 5) {
			reconnecting = false;
			error =
				'Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen.';
		} else {
			reconnecting = true;
			reconnectStatus = `Verbinding herstellen (poging ${streamSocket.retryCount + 1}/5)...`;
		}
	});

	streamSocket.addEventListener('close', () => {
		console.log('[RT] WebSocket closed');
	});
}
```

### Backend WebSocket Heartbeat

```python
# Source: FastAPI patterns + research findings
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime

@app.websocket("/ws/transcribe-stream")
async def ws_transcribe_stream(websocket: WebSocket):
    await websocket.accept()

    last_pong = {"time": datetime.now()}

    async def heartbeat():
        """Send ping every 15s, close if no pong within 30s"""
        while True:
            await asyncio.sleep(15)
            try:
                # Check if last pong is too old
                elapsed = (datetime.now() - last_pong["time"]).total_seconds()
                if elapsed > 30:
                    print(f"[Heartbeat] No pong for {elapsed:.1f}s, closing connection")
                    await websocket.close(code=1000, reason="Heartbeat timeout")
                    break

                # Send ping
                await websocket.send_json({"type": "ping"})
            except Exception as e:
                print(f"[Heartbeat] Error: {e}")
                break

    async def process_messages():
        """Handle client messages"""
        try:
            while True:
                data = await websocket.receive_json()

                if data.get("type") == "pong":
                    last_pong["time"] = datetime.now()
                    continue

                # ... handle audio data, config, etc.
        except WebSocketDisconnect:
            print("[RT] Client disconnected")

    # Start heartbeat in background
    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        await process_messages()
    finally:
        # Clean up background task
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass
```

### Offset Filtering with Tolerance

```python
# Source: backend/main.py (existing code) + research on boundary tolerance
# BEFORE (drops boundary segments):
if offset > 0:
    segments = [s for s in segments if s["start"] >= offset]

# AFTER (captures boundary segments):
TOLERANCE_SEC = 0.5
if offset > 0:
    segments = [s for s in segments if s["end"] > offset - TOLERANCE_SEC]
```

### SSE Timeout Detection

```typescript
// Source: MDN AbortSignal.timeout + existing SSE pattern in +page.svelte
async function fetchWithTimeout(url: string, body: FormData) {
	const TIMEOUT_MS = 30000; // 30 seconds

	try {
		const resp = await fetch(url, {
			method: 'POST',
			body,
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});

		if (!resp.ok) {
			const text = await resp.text();
			throw new Error(`Server error: ${text}`);
		}

		if (!resp.body) throw new Error('No response body');

		const reader = resp.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			// Process SSE chunk...
		}
	} catch (e) {
		if (e instanceof Error && e.name === 'AbortError') {
			throw new Error('Transcriptie duurt te lang — probeer een korter fragment');
		}
		throw e;
	}
}
```

### Timestamp-Based Deduplication

```typescript
// Source: Research on overlap detection + project patterns
let lastSegmentEnd = 0;
const TOLERANCE_SEC = 0.5;

function processFinalSegment(segment: { text: string; start: number; end: number }) {
	// Skip if segment overlaps with previous
	if (segment.start < lastSegmentEnd + TOLERANCE_SEC) {
		console.log('[Dedup] Skipping overlapping segment at', segment.start);
		return;
	}

	// Unique segment, add to confirmed list
	liveSegments.push(segment.text);
	lastSegmentEnd = segment.end;
	partialText = liveSegments.join(' ');
}
```

## State of the Art

| Old Approach                           | Current Approach                  | When Changed                     | Impact                                                                 |
| -------------------------------------- | --------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| Manual WebSocket retry with setTimeout | reconnecting-websocket library    | Last 5 years                     | Standard pattern, prevents custom retry bugs                           |
| Protocol-level ping/pong (opcode 0x9)  | Application-level JSON messages   | Browser limitations              | Only option in browser; protocol ping unavailable to JavaScript        |
| SSE with no timeout                    | AbortSignal.timeout()             | AbortSignal.timeout() added 2022 | Native timeout support, replaces manual Promise.race patterns          |
| Exact string deduplication             | Timestamp-based overlap detection | Recent ASR improvements          | ASR variance makes string matching unreliable                          |
| Session resume after disconnect        | New session creation              | AssemblyAI limitation            | SDK does not support resume; accept gaps instead of complex state sync |

**Deprecated/outdated:**

- `EventSource` auto-reconnect for SSE: Not used in current implementation (POST SSE via fetch), manual timeout sufficient
- WebSocket protocol ping in browser: Not accessible from JavaScript, use application-level messages
- AssemblyAI Streaming v2 API: Migrated to v3 (current SDK uses v3), error codes differ

## Open Questions

1. **Should reconnect-banner be dismissible?**
   - What we know: D-01 specifies inline banner, no mention of dismissibility
   - What's unclear: User may want to dismiss banner to see more transcription text
   - Recommendation: Make non-dismissible during reconnection (user needs to know status), auto-hide on success

2. **What happens to buffered audio if reconnect takes > 5 retries?**
   - What we know: D-03 says show fallback message, D-05 says don't retroactively transcribe buffered audio
   - What's unclear: Does user lose buffered audio or can they save it for file upload?
   - Recommendation: Offer download option for recorded audio blob before fallback message

3. **Should deduplication tolerance be configurable or hardcoded?**
   - What we know: D-06 specifies 0.5s tolerance, research shows 20-40ms is typical for word boundaries
   - What's unclear: 0.5s is conservative, may miss edge cases where segments are farther apart
   - Recommendation: Hardcode 0.5s for Phase 1, add telemetry to measure duplicate rate, adjust in later phase if needed

## Validation Architecture

### Test Framework

| Property           | Value                      |
| ------------------ | -------------------------- |
| Framework          | Vitest 4.0.18              |
| Config file        | None detected — see Wave 0 |
| Quick run command  | `npm run test:run`         |
| Full suite command | `npm run test:run`         |

### Phase Requirements → Test Map

| Req ID | Behavior                               | Test Type   | Automated Command                                                  | File Exists? |
| ------ | -------------------------------------- | ----------- | ------------------------------------------------------------------ | ------------ |
| WS-01  | WebSocket auto-reconnect (max 5)       | integration | Manual: kill backend mid-stream, verify reconnect banner           | ❌ Wave 0    |
| WS-02  | Permanent failure message shown        | integration | Manual: block backend 6 times, verify error message                | ❌ Wave 0    |
| WS-03  | Backend heartbeat detects dead clients | unit        | `pytest backend/test_heartbeat.py -x`                              | ❌ Wave 0    |
| WS-04  | Reconnect starts new session           | integration | Manual: verify liveSegments persist, new transcripts append        | ❌ Wave 0    |
| WS-05  | SSE timeout detection (30s)            | unit        | `npm run test:run -- src/lib/utils/sse-timeout.test.ts`            | ❌ Wave 0    |
| OF-01  | Boundary segments not dropped          | unit        | `pytest backend/test_offset_filter.py::test_boundary_tolerance -x` | ❌ Wave 0    |
| OF-02  | Filter uses `end > offset - tolerance` | unit        | Same as OF-01                                                      | ❌ Wave 0    |
| OF-03  | Frontend timestamp deduplication       | unit        | `npm run test:run -- src/lib/utils/dedup.test.ts`                  | ❌ Wave 0    |
| EH-03  | SSE timeout shows error message        | unit        | Same as WS-05                                                      | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm run test:run` (fast unit tests only, < 10s)
- **Per wave merge:** Full suite + manual integration tests (reconnect, timeout scenarios)
- **Phase gate:** All tests green + 30-minute live recording test before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_heartbeat.py` — covers WS-03 (ping/pong/timeout logic)
- [ ] `backend/tests/test_offset_filter.py` — covers OF-01, OF-02 (boundary tolerance)
- [ ] `src/lib/utils/sse-timeout.test.ts` — covers WS-05, EH-03 (AbortSignal timeout)
- [ ] `src/lib/utils/dedup.test.ts` — covers OF-03 (timestamp overlap detection)
- [ ] Framework install: Already installed (Vitest 4.0.18 in package.json)
- [ ] Backend test framework: `pip install pytest pytest-asyncio` — not in requirements.txt

**Integration test guidance:** Manual testing required for WebSocket reconnection scenarios (can't easily mock network failures in automated tests). Use Docker container stop/start or `kill -STOP` on backend process to simulate disconnect.

## Sources

### Primary (HIGH confidence)

- [reconnecting-websocket@4.4.0 README](https://unpkg.com/browse/reconnecting-websocket@4.4.0/README.md) - Configuration options, retry behavior, API documentation
- [reconnecting-websocket - npm](https://www.npmjs.com/package/reconnecting-websocket) - Package metadata, version verification
- Project codebase inspection:
  - `backend/main.py` lines 699-803 (WebSocket endpoint)
  - `backend/main.py` lines 531-533 (offset filtering)
  - `src/routes/transcribe/+page.svelte` lines 393-451 (WebSocket client)
  - `.planning/codebase/ARCHITECTURE.md` - Streaming patterns
  - `.planning/codebase/INTEGRATIONS.md` - AssemblyAI integration details
  - `.planning/codebase/CONVENTIONS.md` - Error handling patterns

### Secondary (MEDIUM confidence)

- [How to Implement WebSockets in FastAPI](https://oneuptime.com/blog/post/2026-02-02-fastapi-websockets/view) - Production patterns, heartbeat implementation (February 2026)
- [How to Configure WebSocket Heartbeat/Ping-Pong](https://oneuptime.com/blog/post/2026-01-24-websocket-heartbeat-ping-pong/view) - Timing recommendations (January 2026)
- [Handling WebSocket Disconnections Gracefully in FastAPI](https://hexshift.medium.com/handling-websocket-disconnections-gracefully-in-fastapi-9f0a1de365da) - Cleanup patterns
- [Fix WebSocket Timeout and Silent Dropped Connections](https://websocket.org/guides/troubleshooting/timeout/) - Idle timeout problem explanation
- [How to Implement Heartbeat/Ping-Pong in WebSockets](https://oneuptime.com/blog/post/2026-01-27-websocket-heartbeat/view) - 25-second timing for proxy timeouts (January 2026)
- [Common session errors and closures | AssemblyAI](https://www.assemblyai.com/docs/universal-streaming/common-session-errors-and-closures) - Error code 3005 documentation
- [AbortSignal.timeout() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - Official Web API documentation
- [Using readable streams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams) - ReadableStream patterns
- [Back to Supervision: Boosting Word Boundary Detection](https://arxiv.org/html/2411.10423) - Audio boundary tolerance standards (20-40ms typical)

### Tertiary (LOW confidence - context/background only)

- [Real-time transcription in Python with Universal-Streaming](https://www.assemblyai.com/blog/real-time-transcription-in-python) - SDK overview
- [WebSocket Reconnection: State Sync and Recovery Guide](https://websocket.org/guides/reconnection/) - General reconnection strategies
- Text deduplication research (LSHBloom, near-duplicate detection) - Overkill for Phase 1, timestamp approach sufficient

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - `reconnecting-websocket` is battle-tested with 2.6M weekly downloads, FastAPI WebSocket is native, AbortSignal is Web API standard
- Architecture: HIGH - Patterns verified in recent production articles (February 2026), aligned with existing project conventions
- Pitfalls: HIGH - Researched known failure modes (idle timeout, thundering herd, boundary drops), cross-verified with official sources

**Research date:** 2026-03-23
**Valid until:** 2026-05-23 (60 days) - WebSocket patterns are stable, library versions unchanged for years, AbortSignal is standardized Web API

---

_Research completed: 2026-03-23_
_Phase: 01-websocket-offset-filtering-stability_
_Next step: Planning (create PLAN.md files for 3 sub-plans)_
