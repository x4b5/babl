# Phase 2: Rate Limiting + Error Handling - Research

**Researched:** 2026-03-24
**Domain:** HTTP rate limiting, error taxonomy, retry strategies, SSE error handling
**Confidence:** HIGH

## Summary

This phase implements robust error handling for API rate limits across both transcription (AssemblyAI) and correction (Mistral) flows. The core challenge is parsing Retry-After headers from 429 responses, displaying countdown timers with auto-retry, and replacing existing custom retry loops with tenacity decorators in the backend. The research confirms that both APIs return standard 429 status codes for rate limiting, with Retry-After headers providing retry timing in either seconds (integer) or HTTP-date format (RFC 7231). The tenacity Python library (version 9.1.4 available) provides async-compatible retry decorators with exponential backoff and jitter, though it explicitly does not support async generators — requiring a wrapper pattern for SSE streaming functions.

Error taxonomy requires distinguishing four types (rate_limit, timeout, upstream_disconnect, network_error) with user-facing Dutch messages that provide actionable guidance without technical jargon. The frontend countdown implementation follows established reactive patterns using setInterval with cleanup, while SSE error events require structured JSON payloads with error_type and retry_after fields.

**Primary recommendation:** Replace custom retry loops in backend/main.py and src/routes/api/correct/+server.ts with tenacity decorators, parse Retry-After headers to calculate retry delays, emit structured SSE error events with error_type taxonomy, and implement frontend countdown using setInterval with automatic retry triggering.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Rate Limit UX:**

- **D-01:** Inline error display — countdown verschijnt in het bestaande `error` element, geen nieuwe UI-componenten. Melding: "Overbelast. Wacht Xs..." met live aftelling (elke seconde update).
- **D-02:** Live countdown telt elke seconde af. Verdwijnt automatisch als timer op 0 staat.
- **D-03:** Auto-retry na countdown — correctie wordt automatisch opnieuw gestart zodra countdown afloopt. Gebruiker hoeft niks te doen.

**Error Taxonomy:**

- **D-04:** Universeel error systeem — zelfde error types en meldingen voor zowel transcriptie als correctie. Geldt voor alle API calls: AssemblyAI, Mistral, en lokale backend.
- **D-05:** Actiegericht zonder technische details — gebruiker ziet alleen wat te doen. Geen HTTP statuscodes, geen technische termen. Bijv. "Overbelast. Wacht 30s." niet "429 Too Many Requests".
- **D-06:** Visueel onderscheid tussen retry-bare fouten (amber/geel tint, "even geduld") en fatale fouten (rood, "actie vereist"). Beide inline in hetzelfde error element.

**Retry Transparantie:**

- **D-07:** Retries zijn onzichtbaar voor de gebruiker. Backend retry't op de achtergrond. Gebruiker ziet alleen de countdown als alle retries falen.
- **D-08:** Retry logica leeft alleen in backend (main.py met tenacity) en SvelteKit API routes (correct/+server.ts met tenacity-achtige logica). Frontend doet geen retries — als backend-respons een error is, toont frontend de foutmelding.

**Foutmelding Toon:**

- **D-09:** Kort en direct — "Overbelast. Wacht 30s." / "Geen internet." / "Backend niet bereikbaar." Geen "Helaas", "Sorry", of overbodige woorden.
- **D-10:** Consistent met Phase 1 beslissing: gebruiksvriendelijk Nederlands, geen technische termen (D-08/D-09 uit Phase 1).
- **D-11:** Alleen tekst, geen actieknoppen. Foutmelding beschrijft de actie in woorden. Past bij de bestaande minimale UI.

### Claude's Discretion

- Exacte error type mapping per backend endpoint (welke HTTP codes mappen naar welk error type)
- Tenacity decorator configuratie (max retries, backoff multiplier, jitter range)
- SSE error event JSON structuur (velden en formaat)
- Exacte amber/geel vs rood kleurtinten voor error severity (binnen bestaande design tokens)
- Of auto-retry na countdown oneindig herhaalt of na N pogingen definitief stopt

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                                       | Research Support                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RL-01 | Backend parsed Retry-After header bij Mistral 429 responses                                       | HTTP Retry-After header accepts two formats: integer seconds or HTTP-date. Parse logic needed for both formats. RFC 7231 specification.                                                                                                     |
| RL-02 | Backend stuurt gestructureerde rate_limit error via SSE met retry_after waarde                    | SSE events support structured JSON payloads via `data:` prefix. Error events require `type: 'error'`, `error_type: 'rate_limit'`, and `retry_after: <seconds>` fields.                                                                      |
| RL-03 | Frontend toont specifieke rate limit melding met countdown ("Probeer over X seconden")            | JavaScript setInterval pattern with 1-second interval. Countdown state decrements each tick. clearInterval on unmount or completion. Auto-retry triggered when countdown reaches 0.                                                         |
| RL-04 | Retry logica gebruikt tenacity decorator i.p.v. custom loop (exponential backoff, max 5 pogingen) | Tenacity 9.1.4 available on PyPI. `@retry(stop=stop_after_attempt(5), wait=wait_exponential_jitter())` pattern. AsyncGenerator caveat: tenacity does not support generators directly — wrapper function needed for SSE streaming endpoints. |
| EH-01 | Foutmeldingen zijn specifiek per type: rate_limit, timeout, upstream_disconnect, network_error    | Error taxonomy maps to HTTP patterns: 429→rate_limit, network errors→network_error, 502/503→upstream_disconnect, AbortController timeout→timeout. User-facing Dutch messages mapped per type.                                               |
| EH-02 | Geen generieke "mislukt" meldingen — gebruiker ziet altijd wat er fout ging                       | Each error type has specific Dutch message with actionable guidance. Rate_limit: "Overbelast. Wacht Xs." Timeout: "Duurt te lang — korter fragment." Network_error: "Geen internet." Upstream_disconnect: "Backend niet bereikbaar."        |

</phase_requirements>

## Standard Stack

### Core

| Library              | Version   | Purpose                                   | Why Standard                                                                                                                                                                                |
| -------------------- | --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tenacity             | 9.1.4     | Python retry decorator with async support | Industry standard for retry logic. Better than custom loops: async/await compatible, exponential backoff + jitter built-in, declarative configuration, battle-tested in production systems. |
| FastAPI              | (current) | Backend SSE streaming                     | Already in use. Native SSE support via `yield` in async functions.                                                                                                                          |
| @mistralai/mistralai | (current) | Mistral API client                        | Already in use. TypeScript SDK with streaming support.                                                                                                                                      |
| assemblyai           | (current) | AssemblyAI SDK                            | Already in use. Handles WebSocket streaming and polling.                                                                                                                                    |

### Supporting

| Library | Version   | Purpose            | When to Use                                                                             |
| ------- | --------- | ------------------ | --------------------------------------------------------------------------------------- |
| httpx   | (current) | Python HTTP client | Already installed. For extracting response headers (Retry-After) in exception handlers. |

### Alternatives Considered

| Instead of            | Could Use             | Tradeoff                                                                                                                    |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| tenacity              | backoff (Python)      | Similar feature set but less active maintenance (last update 2021). Tenacity has 7x more GitHub stars and active community. |
| tenacity              | Custom retry loops    | Custom code is error-prone (no jitter, hard to test, missing edge cases). Tenacity is 1200+ lines of battle-tested logic.   |
| setInterval countdown | requestAnimationFrame | RAF is for rendering animations (60fps). setInterval is correct for 1-second timer updates. Lower CPU usage for timers.     |

**Installation:**

```bash
# Backend dependency
pip install 'tenacity>=9.0.0'
```

**Version verification:**

```bash
pip3 index versions tenacity
# Latest: 9.1.4 (confirmed 2026-03-24)
```

## Project Constraints (from CLAUDE.md)

**Backend architecture:**

- FastAPI backend (Python) + SvelteKit API routes (TypeScript)
- SSE streaming for all long-running operations (transcription, correction)
- Dual mode: local (Whisper + Ollama) and API (AssemblyAI + Mistral)
- Privacy-first: no PII logging, EU servers only for API mode

**Error handling rules:**

- Always use try/catch with user-facing messages
- Set `error` state variable (reactive) for UI display
- Silent fail for non-critical operations (analytics)
- Network errors get Dutch messages: "API niet bereikbaar. Controleer je internetverbinding."

**Styling constraints:**

- Dark theme with glassmorphism — never `bg-white`
- Error display: existing `error` state variable renders inline alert
- Color tokens: `--color-neon`, `--color-accent-start`, `--color-glass`
- Animations: `animate-fade-in`, `animate-slide-up`, respect `prefers-reduced-motion`

**Testing:**

- Vitest 3.2.3 for frontend tests
- pytest + pytest-asyncio for backend tests
- Test commands: `npm run test:run` (frontend), `pytest` (backend)

## Architecture Patterns

### Recommended Error Flow

```
API call (backend or SvelteKit route)
  ↓
try/catch with tenacity retry decorator
  ↓
on 429: parse Retry-After header → calculate seconds
  ↓
emit SSE error event: { type: 'error', error_type: 'rate_limit', retry_after: 30 }
  ↓
Frontend SSE parser detects error event
  ↓
Set error state: "Overbelast. Wacht 30s."
  ↓
Start countdown timer (setInterval, decrement each 1s)
  ↓
On countdown = 0: auto-retry API call
```

### Pattern 1: Tenacity Retry Decorator (Backend)

**What:** Declarative retry logic with exponential backoff and jitter
**When to use:** All API calls to external services (Mistral, AssemblyAI)

**Example:**

```python
# Source: https://github.com/jd/tenacity (verified 2026-03-24)
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential_jitter(initial=1, max=30, jitter=2),
    retry=retry_if_exception_type((httpx.TimeoutException, ConnectionError))
)
async def call_mistral_api(text: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json={"text": text})
        response.raise_for_status()
        return response.json()
```

**Configuration values:**

- `stop_after_attempt(5)`: Maximum 5 retry attempts before giving up
- `wait_exponential_jitter(initial=1, max=30, jitter=2)`: Wait 1s, 2s, 4s, 8s, 16s (capped at 30s) with ±2s random jitter to prevent thundering herd
- `retry_if_exception_type()`: Only retry on transient errors (timeout, connection). Don't retry on 400/401 (client errors).

### Pattern 2: AsyncGenerator Wrapper for Tenacity

**What:** Tenacity does not support async generators directly. Wrap streaming functions.
**When to use:** SSE streaming endpoints that need retry logic

**Example:**

```python
# Source: https://github.com/jd/tenacity README caveat section
from tenacity import retry, stop_after_attempt

@retry(stop=stop_after_attempt(5))
async def _call_mistral_stream_inner(text: str):
    """Non-generator wrapper that returns the stream object."""
    response = await mistral_client.chat.stream(...)
    return response  # Return the stream, don't yield from it

async def call_mistral_stream(text: str):
    """Retryable wrapper around streaming function."""
    for attempt in range(5):
        try:
            stream = await _call_mistral_stream_inner(text)
            for event in stream:
                yield event.data.choices[0].delta.content
            return  # Success
        except Exception as e:
            if "429" in str(e) and attempt < 4:
                retry_after = parse_retry_after(e)
                await asyncio.sleep(retry_after)
            else:
                # Final attempt failed — emit error event
                yield json.dumps({"type": "error", "error_type": "rate_limit", "retry_after": retry_after})
                return
```

**Why this pattern:** Tenacity wraps function calls, not generator execution. Generators are lazy — decorator only wraps the generator creation, not iteration. Manual retry loop needed for streaming, but parse Retry-After and calculate backoff using tenacity patterns.

### Pattern 3: Retry-After Header Parsing

**What:** Extract retry delay from HTTP 429 response header
**When to use:** All 429 error handlers

**Example:**

```python
# Source: RFC 7231 Retry-After header specification (MDN verified 2026-03-24)
from datetime import datetime
import httpx

def parse_retry_after(response: httpx.Response) -> int:
    """Parse Retry-After header, return seconds to wait."""
    retry_after = response.headers.get("Retry-After")
    if not retry_after:
        return 3  # Default fallback

    # Try parsing as integer (seconds)
    try:
        return int(retry_after)
    except ValueError:
        pass

    # Parse as HTTP-date (RFC 1123 format)
    try:
        retry_date = datetime.strptime(retry_after, "%a, %d %b %Y %H:%M:%S GMT")
        delta = (retry_date - datetime.utcnow()).total_seconds()
        return max(0, int(delta))
    except ValueError:
        return 3  # Fallback if parsing fails
```

### Pattern 4: SSE Error Event Structure

**What:** Standardized JSON structure for error events in SSE streams
**When to use:** All SSE endpoints (backend and SvelteKit routes)

**Example:**

```python
# Backend (FastAPI)
@app.post("/correct")
async def correct_text(request: CorrectionRequest):
    async def event_stream():
        try:
            for token in generate_correction(request.text):
                yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                retry_after = parse_retry_after(e.response)
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'rate_limit', 'retry_after': retry_after})}\n\n"
            elif e.response.status_code in (502, 503):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'upstream_disconnect', 'message': 'Backend niet bereikbaar.'})}\n\n"
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'type': 'error', 'error_type': 'timeout', 'message': 'Duurt te lang.'})}\n\n"
        except (httpx.ConnectError, httpx.NetworkError):
            yield f"data: {json.dumps({'type': 'error', 'error_type': 'network_error', 'message': 'Geen internet.'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**TypeScript (SvelteKit API route):**

```typescript
// src/routes/api/correct/+server.ts
const stream = new ReadableStream({
	async start(controller) {
		const encoder = new TextEncoder();
		const send = (data: Record<string, unknown>) => {
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
		};

		try {
			for await (const token of mistralStream) {
				send({ type: 'token', text: token });
			}
			send({ type: 'done' });
		} catch (e) {
			const error_type = classifyError(e);
			const retry_after = error_type === 'rate_limit' ? parseRetryAfter(e) : undefined;
			send({ type: 'error', error_type, retry_after, message: getUserMessage(error_type) });
		} finally {
			controller.close();
		}
	}
});
```

### Pattern 5: Frontend Countdown Timer

**What:** Reactive countdown with auto-retry trigger
**When to use:** Rate limit errors with retry_after value

**Example:**

```typescript
// Source: JavaScript setInterval pattern (MDN verified 2026-03-24)
let countdown = $state(0);
let countdownInterval: number | undefined;

function startCountdown(seconds: number) {
	countdown = seconds;
	error = `Overbelast. Wacht ${countdown}s...`;

	countdownInterval = setInterval(() => {
		countdown -= 1;
		if (countdown > 0) {
			error = `Overbelast. Wacht ${countdown}s...`;
		} else {
			clearInterval(countdownInterval);
			countdownInterval = undefined;
			error = '';
			// Auto-retry
			fetchCorrection();
		}
	}, 1000);
}

// Cleanup on component destroy
$effect(() => {
	return () => {
		if (countdownInterval) clearInterval(countdownInterval);
	};
});
```

### Anti-Patterns to Avoid

- **Infinite retries without backoff:** Always cap retry attempts (max 5-8) and use exponential backoff with jitter. Prevents API bans and thundering herd.
- **Retry on 4xx client errors:** Only retry transient errors (429, 5xx, network issues). Don't retry 400 (bad request), 401 (unauthorized), 404 (not found).
- **Generic error messages:** "Fout opgetreden" tells user nothing. Specific messages with action: "Overbelast. Wacht 30s." / "Geen internet."
- **Countdown without cleanup:** Always clear setInterval in cleanup function to prevent memory leaks.
- **Parsing Retry-After as integer only:** Header can be HTTP-date format. Parse both formats.

## Don't Hand-Roll

| Problem                              | Don't Build                                      | Use Instead                                                       | Why                                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retry logic with exponential backoff | Custom sleep loops with 2^attempt calculation    | tenacity library                                                  | Edge cases: jitter (prevent thundering herd), retry on specific exceptions only, max attempts vs max time, async/await compatibility. Custom implementation misses these. Tenacity is 1200+ lines of battle-tested logic. |
| Countdown timer state management     | Manual setInterval with state updates in closure | Svelte 5 `$state` + `$effect` cleanup                             | Memory leaks if interval not cleared. Race conditions if multiple timers run. Svelte reactivity handles cleanup automatically via effect return function.                                                                 |
| HTTP-date parsing                    | Custom datetime string parsing                   | Python `datetime.strptime` with RFC 1123 format                   | HTTP-date has strict format requirements. Timezones, locales, leap seconds. Standard library handles edge cases.                                                                                                          |
| SSE connection handling              | Custom EventSource with manual reconnect         | Browser EventSource API (auto-reconnects) + manual stream parsing | EventSource auto-reconnects on disconnect. Manual fetch + ReadableStream gives more control for error events. Project already uses manual approach — consistent with existing pattern.                                    |

**Key insight:** Retry logic is deceptively complex. Tenacity handles: async/await, generators (with caveats), coroutines (asyncio/trio/tornado), exception filtering, statistics, callbacks, exponential backoff variants (fixed, random, exponential, jitter combinations), stop conditions (attempts, time, custom predicates). Custom implementation will miss critical edge cases and take weeks to stabilize. Use the library.

## Common Pitfalls

### Pitfall 1: Retry-After Ignored Leading to API Bans

**What goes wrong:** Backend retries 429 errors immediately without checking Retry-After header. API provider sees aggressive retry pattern and bans the IP or revokes API key.
**Why it happens:** Developers assume exponential backoff is sufficient. Mistral/AssemblyAI may return Retry-After: 60 but backoff calculates 3s → immediate ban.
**How to avoid:** Always parse Retry-After header first. Use value as minimum wait time. Ignore exponential backoff if Retry-After is present and longer.
**Warning signs:** Multiple 429s in quick succession in logs. API key suddenly stops working. "Too Many Requests" errors escalate instead of resolving.

### Pitfall 2: Tenacity Decorator on Async Generator Functions

**What goes wrong:** `@retry` decorator applied directly to async generator function. Decorator wraps generator creation, not iteration. Retry never triggers because generator returns immediately (lazy evaluation). Errors occur during iteration (yield statements), after decorator scope.
**Why it happens:** Tenacity docs are clear but easy to miss: "retry does not support generator or async generator functions." Developers see `async def` and assume async support covers generators.
**How to avoid:** Use wrapper pattern (Pattern 2 above). Create non-generator function that returns the stream object. Manually iterate and handle retries. Or use manual retry loop for streaming endpoints.
**Warning signs:** Tenacity decorator never triggers retry. Errors propagate directly to frontend. Logs show decorator applied but retry count stays at 1.

### Pitfall 3: SSE Error Events Not Closing Stream

**What goes wrong:** Backend emits error event but continues trying to yield tokens. Stream stalls. Frontend hangs waiting for `done` event. User sees spinner forever.
**Why it happens:** Error event emitted in `except` block but stream generator continues after exception is caught. No explicit `return` statement after error event.
**How to avoid:** Always `return` immediately after emitting error event. Treat error event as terminal for that stream. Frontend closes connection on error event.
**Warning signs:** Frontend shows error message but spinner still animates. Network tab shows SSE connection open indefinitely. No `done` event ever arrives.

### Pitfall 4: Countdown State Race Conditions

**What goes wrong:** User triggers multiple API calls before countdown expires. Multiple countdowns run simultaneously. UI shows conflicting countdown values. Auto-retry triggers multiple times, creating duplicate requests.
**Why it happens:** No guard to prevent new API calls while countdown active. Each call starts its own countdown timer. No cleanup of previous timer.
**How to avoid:** Check `countdown > 0` before allowing new API calls. Clear existing countdown interval before starting new one. Or disable UI buttons while countdown active.
**Warning signs:** Error message flickers between different countdown values. Multiple identical API requests in network tab. Backend logs show burst of retries at same timestamp.

### Pitfall 5: HTTP-Date Retry-After Parsing Without UTC

**What goes wrong:** Retry-After header contains HTTP-date in GMT. Parser uses local timezone. Calculates negative wait time if local time is ahead of GMT. Immediate retry → 429 again → ban.
**Why it happens:** `datetime.now()` uses local time. HTTP-dates are always GMT/UTC. Delta calculation subtracts GMT time from local time.
**How to avoid:** Use `datetime.utcnow()` for delta calculation. Or parse header as UTC-aware datetime and compare with `datetime.now(timezone.utc)`.
**Warning signs:** Retry-After parsing returns negative values or very large values. Retries happen immediately despite header saying "wait 60s." More common for users in timezones ahead of GMT (Asia, Australia).

### Pitfall 6: Mistral SDK Exception Message Parsing

**What goes wrong:** Code checks `if "429" in str(e)` to detect rate limits. Mistral SDK changes exception message format. String no longer contains "429". Rate limits not detected. No retry logic triggered.
**Why it happens:** Brittle error detection relies on unstructured error message strings. SDK updates change wording. Python exception message not part of stable API contract.
**How to avoid:** Catch `httpx.HTTPStatusError` and check `e.response.status_code == 429`. Or use SDK-specific exception types if available. Never rely on string content of exception messages for control flow.
**Warning signs:** Rate limit handling stops working after dependency update. Logs show exceptions but retry logic doesn't trigger. Error detection worked in testing but fails in production (different SDK version).

## Code Examples

Verified patterns from official sources and project codebase:

### Backend: Tenacity Retry with Retry-After Parsing

```python
# Source: Tenacity docs + RFC 7231 Retry-After spec
from tenacity import retry, stop_after_attempt, wait_exponential_jitter
import httpx
import asyncio
from datetime import datetime

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential_jitter(initial=1, max=30, jitter=2),
    retry=retry_if_exception_type(httpx.HTTPStatusError)
)
async def call_mistral_with_retry(text: str) -> dict:
    """Non-streaming Mistral call with automatic retry."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.mistral.ai/v1/...",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"text": text}
        )

        if response.status_code == 429:
            retry_after = parse_retry_after(response)
            # Override tenacity wait strategy if API provides specific retry time
            if retry_after > 10:  # If API says wait longer than our backoff
                await asyncio.sleep(retry_after)

        response.raise_for_status()
        return response.json()

def parse_retry_after(response: httpx.Response) -> int:
    """Parse Retry-After header (seconds or HTTP-date)."""
    header = response.headers.get("Retry-After", "")
    if not header:
        return 3

    try:
        return int(header)  # Try as seconds
    except ValueError:
        try:
            # Parse as HTTP-date
            retry_date = datetime.strptime(header, "%a, %d %b %Y %H:%M:%S GMT")
            delta = (retry_date - datetime.utcnow()).total_seconds()
            return max(0, int(delta))
        except ValueError:
            return 3  # Fallback
```

### Backend: SSE Streaming with Error Events

```python
# Source: backend/main.py existing pattern + structured error events
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

@app.post("/correct")
async def correct_endpoint(req: CorrectionRequest):
    async def event_generator():
        attempt = 0
        max_attempts = 5

        while attempt < max_attempts:
            try:
                async for token in correct_with_mistral(req.text):
                    yield f"data: {json.dumps({'type': 'token', 'text': token})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return  # Success

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    retry_after = parse_retry_after(e.response)

                    if attempt < max_attempts - 1:
                        # Retry silently (D-07: user doesn't see backend retries)
                        await asyncio.sleep(retry_after)
                        attempt += 1
                        continue
                    else:
                        # Final attempt failed — show user countdown
                        yield f"data: {json.dumps({{'type': 'error', 'error_type': 'rate_limit', 'retry_after': {retry_after}}})\n\n"
                        return

                elif e.response.status_code in (502, 503):
                    yield f"data: {json.dumps({'type': 'error', 'error_type': 'upstream_disconnect'})}\n\n"
                    return

            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'timeout'})}\n\n"
                return

            except (httpx.ConnectError, httpx.NetworkError):
                yield f"data: {json.dumps({'type': 'error', 'error_type': 'network_error'})}\n\n"
                return

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### Frontend: SSE Error Handling with Countdown

```typescript
// Source: src/routes/transcribe/+page.svelte existing pattern + countdown logic
let error = $state('');
let countdown = $state(0);
let countdownInterval: number | undefined;

async function fetchCorrection() {
	try {
		const resp = await fetch('/api/correct', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: raw })
		});

		if (!resp.ok) {
			throw new Error(`HTTP ${resp.status}`);
		}

		const reader = resp.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				const event = JSON.parse(line.slice(6));

				if (event.type === 'token') {
					corrected += event.text;
				} else if (event.type === 'done') {
					// Success
				} else if (event.type === 'error') {
					handleErrorEvent(event);
					return;
				}
			}
		}
	} catch (e) {
		console.error('Correction error:', e);
		error = 'Backend niet bereikbaar.';
	} finally {
		status = 'idle';
	}
}

function handleErrorEvent(event: { error_type: string; retry_after?: number }) {
	const messages: Record<string, string> = {
		rate_limit: event.retry_after
			? `Overbelast. Wacht ${event.retry_after}s...`
			: 'Overbelast. Probeer later.',
		timeout: 'Duurt te lang — probeer een korter fragment.',
		upstream_disconnect: 'Backend niet bereikbaar.',
		network_error: 'Geen internet.'
	};

	error = messages[event.error_type] || 'Fout bij verwerking.';

	// Start countdown if rate limit with retry_after
	if (event.error_type === 'rate_limit' && event.retry_after) {
		startCountdown(event.retry_after);
	}
}

function startCountdown(seconds: number) {
	countdown = seconds;

	// Clear existing countdown if any
	if (countdownInterval) {
		clearInterval(countdownInterval);
	}

	countdownInterval = setInterval(() => {
		countdown -= 1;
		error = `Overbelast. Wacht ${countdown}s...`;

		if (countdown <= 0) {
			clearInterval(countdownInterval!);
			countdownInterval = undefined;
			error = '';
			// Auto-retry (D-03)
			fetchCorrection();
		}
	}, 1000);
}

// Cleanup interval on component unmount
$effect(() => {
	return () => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	};
});
```

### TypeScript: Error Classification Helper

```typescript
// Source: Project conventions + error taxonomy (EH-01)
type ErrorType = 'rate_limit' | 'timeout' | 'upstream_disconnect' | 'network_error';

function classifyError(e: unknown): ErrorType {
	const message = e instanceof Error ? e.message : String(e);

	// Rate limit
	if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
		return 'rate_limit';
	}

	// Upstream errors (502 Bad Gateway, 503 Service Unavailable)
	if (message.includes('502') || message.includes('503') || message.includes('ECONNREFUSED')) {
		return 'upstream_disconnect';
	}

	// Timeout
	if (e instanceof DOMException && e.name === 'AbortError') {
		return 'timeout';
	}
	if (message.toLowerCase().includes('timeout')) {
		return 'timeout';
	}

	// Network errors
	if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
		return 'network_error';
	}

	// Default to network error for unknown
	return 'network_error';
}

function getUserMessage(errorType: ErrorType): string {
	const messages: Record<ErrorType, string> = {
		rate_limit: 'Overbelast. Even geduld.',
		timeout: 'Duurt te lang — probeer een korter fragment.',
		upstream_disconnect: 'Backend niet bereikbaar.',
		network_error: 'Geen internet.'
	};
	return messages[errorType];
}
```

## State of the Art

| Old Approach                                               | Current Approach                                | When Changed                         | Impact                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Custom retry loops with hardcoded delays                   | tenacity library with declarative config        | tenacity 9.0+ (2023)                 | Less error-prone. Jitter prevents thundering herd. Async/await compatible out of box.                               |
| Generic "Fout opgetreden" messages                         | Error taxonomy with specific user actions       | Modern UX best practices (2024+)     | Users know what to do. Reduces support requests. Better trust/transparency.                                         |
| EventSource API for SSE                                    | Manual fetch + ReadableStream                   | SvelteKit pattern (project standard) | More control over error handling. Can parse structured error events. EventSource auto-reconnects but less flexible. |
| String parsing for exception detection (`"429" in str(e)`) | httpx.HTTPStatusError with status_code property | httpx 0.23+ (2022)                   | Brittle string matching fails on SDK updates. Status code is stable API contract.                                   |

**Deprecated/outdated:**

- `exponential_backoff()` in tenacity: Replaced by `wait_exponential_jitter()` which combines backoff + jitter in single strategy (tenacity 8.0+, 2021)
- Polling AssemblyAI status endpoint every 1s: Official docs recommend 3-5s to avoid rate limits (confirmed 2026)

## Open Questions

1. **Auto-retry infinite loop behavior**
   - What we know: D-03 specifies auto-retry after countdown. Does not specify if this repeats forever.
   - What's unclear: After auto-retry, if 429 happens again, does countdown restart indefinitely? Or does it eventually give up and require manual user action?
   - Recommendation: Limit auto-retries to 3 cycles (3 countdown → retry loops). After 3rd failure, show final error without auto-retry: "Nog steeds overbelast. Probeer later handmatig." Prevents infinite loops if API is down for extended period. User can still manually retry via UI.

2. **Retry-After header availability from Mistral/AssemblyAI**
   - What we know: Both APIs return 429 status codes. RFC 7231 says Retry-After is recommended but not required.
   - What's unclear: Do Mistral and AssemblyAI consistently include Retry-After headers? Testing required.
   - Recommendation: Implement fallback to exponential backoff (3s, 6s, 12s, 24s, 48s) if Retry-After header missing. Parse header if present and use that value. Log cases where header is missing to track API behavior.

3. **SvelteKit API route retry logic**
   - What we know: D-08 says retry logic lives in backend + SvelteKit API routes. tenacity is Python-only.
   - What's unclear: Should SvelteKit routes implement equivalent retry logic in TypeScript? Or should they proxy to backend endpoints that handle retries?
   - Recommendation: Implement manual retry loop in SvelteKit routes (src/routes/api/correct/+server.ts) following tenacity pattern: max 5 attempts, exponential backoff with jitter, parse Retry-After. TypeScript has no tenacity equivalent, so manual implementation needed. Keep logic consistent with backend (same max attempts, same backoff formula).

## Environment Availability

| Dependency  | Required By                | Available | Version            | Fallback |
| ----------- | -------------------------- | --------- | ------------------ | -------- |
| Python 3.14 | Backend (FastAPI)          | ✓         | 3.14.3             | —        |
| pip         | Python package install     | ✓         | 26.0               | —        |
| Node.js     | Frontend build + SvelteKit | ✓         | v24.4.1            | —        |
| npm         | Frontend dependencies      | ✓         | 11.4.2             | —        |
| tenacity    | Retry decorator (new)      | ✗         | Will install 9.1.4 | —        |
| Vitest      | Frontend tests             | ✓         | 3.2.3              | —        |
| pytest      | Backend tests              | ✓         | (installed)        | —        |

**Missing dependencies with no fallback:**

- `tenacity>=9.0.0` — Required for RL-04. Must install before implementation.

**Missing dependencies with fallback:**

- None — all other dependencies already available.

## Validation Architecture

### Test Framework

| Property           | Value                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| Framework          | Vitest 3.2.3 (frontend), pytest + pytest-asyncio (backend)                       |
| Config file        | vite.config.ts (frontend), pytest.ini or pyproject.toml (backend — check Wave 0) |
| Quick run command  | `npm run test:run` (frontend), `pytest -x` (backend)                             |
| Full suite command | `npm run test:run` (frontend), `pytest` (backend)                                |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                  | Test Type   | Automated Command                                                          | File Exists? |
| ------ | ------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- | ------------ |
| RL-01  | Backend parses Retry-After header (seconds and HTTP-date formats)         | unit        | `pytest backend/tests/test_retry_after.py::test_parse_retry_after -x`      | ❌ Wave 0    |
| RL-02  | Backend emits structured SSE error events with error_type and retry_after | integration | `pytest backend/tests/test_sse_errors.py::test_rate_limit_error_event -x`  | ❌ Wave 0    |
| RL-03  | Frontend countdown decrements each second and triggers auto-retry at 0    | unit        | `npm run test:run -- src/lib/utils/countdown.test.ts`                      | ❌ Wave 0    |
| RL-04  | tenacity decorator retries with exponential backoff (mock external API)   | unit        | `pytest backend/tests/test_tenacity_retry.py::test_exponential_backoff -x` | ❌ Wave 0    |
| EH-01  | Error classifier maps exceptions to error_type taxonomy                   | unit        | `npm run test:run -- src/lib/utils/error-classifier.test.ts`               | ❌ Wave 0    |
| EH-02  | Each error_type has specific Dutch user message (no generic "mislukt")    | unit        | `npm run test:run -- src/lib/utils/error-messages.test.ts`                 | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm run test:run` (frontend) + `pytest -x` (backend) — quick smoke test
- **Per wave merge:** `npm run test:run && pytest` — full suite both frontend and backend
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_retry_after.py` — covers RL-01 (parse seconds + HTTP-date formats)
- [ ] `backend/tests/test_sse_errors.py` — covers RL-02 (structured error event schema)
- [ ] `backend/tests/test_tenacity_retry.py` — covers RL-04 (retry attempts, backoff timing)
- [ ] `src/lib/utils/countdown.test.ts` — covers RL-03 (setInterval countdown + auto-retry)
- [ ] `src/lib/utils/error-classifier.test.ts` — covers EH-01 (exception → error_type mapping)
- [ ] `src/lib/utils/error-messages.test.ts` — covers EH-02 (error_type → Dutch message)
- [ ] `backend/requirements.txt` — add `tenacity>=9.0.0` (RL-04 dependency)

## Sources

### Primary (HIGH confidence)

- [Tenacity GitHub Repository](https://github.com/jd/tenacity) - Async support, exponential backoff, jitter configuration, AsyncGenerator caveat
- [Retry-After header - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After) - RFC 7231 specification, format variants (seconds vs HTTP-date)
- [Using server-sent events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) - SSE error event handling, onerror callback
- Project codebase: `backend/main.py`, `src/routes/api/correct/+server.ts`, `src/routes/transcribe/+page.svelte` - Current retry patterns and error handling

### Secondary (MEDIUM confidence)

- [Mistral API Rate Limits Documentation](https://docs.mistral.ai/deployment/ai-studio/tier) - Rate limit behavior and tiers
- [AssemblyAI API Overview](https://www.assemblyai.com/docs/api-reference/overview) - 429 error code usage
- [429 handling issue - pydantic-ai](https://github.com/pydantic/pydantic-ai/issues/1885) - Real-world Mistral 429 handling patterns
- [Python Retry Policies with Tenacity - Medium](https://medium.com/@hadiyolworld007/python-retry-policies-with-tenacity-jitter-backoff-and-idempotency-that-survives-chaos-12bba4fc8d32) - Jitter and backoff best practices

### Tertiary (LOW confidence)

- [API Rate Limit Exceeded Guide](https://www.digitalapi.ai/blogs/api-rate-limit-exceeded) - General rate limiting patterns (not API-specific)
- [Countdown Timer Tutorial - W3Schools](https://www.w3schools.com/howto/howto_js_countdown.asp) - Basic setInterval pattern

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - tenacity 9.1.4 verified on PyPI, async support confirmed in official docs
- Architecture: HIGH - Patterns verified in project codebase, RFC 7231 specification for Retry-After, MDN docs for SSE
- Pitfalls: MEDIUM - Based on tenacity documentation caveats + common production issues, not project-specific testing
- API behavior (Retry-After headers): MEDIUM - API docs confirm 429 support, but Retry-After header presence needs testing
- Error taxonomy mapping: MEDIUM - HTTP status codes well-defined, but specific SDK exception types may vary

**Research date:** 2026-03-24
**Valid until:** 30 days (2026-04-23) — tenacity stable, HTTP specs stable, API patterns unlikely to change
