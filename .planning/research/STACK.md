# Stack Research

**Domain:** WebSocket/SSE Streaming Stability for SvelteKit + FastAPI
**Researched:** 2026-03-23
**Confidence:** HIGH

## Recommended Stack

### Frontend — WebSocket Reconnection

| Technology               | Version        | Purpose                                       | Why Recommended                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | -------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reconnecting-websocket   | 4.4.0          | WebSocket wrapper with automatic reconnection | Battle-tested (used in production for 6+ years), zero dependencies, configurable exponential backoff with jitter, works across Web/Node.js/React Native. Supports custom reconnection delays, max attempts, and connection timeout. **Note:** Last updated 2020, but stable and widely adopted. Alternative: `@slite/reconnecting-websocket` 4.4.1 (active fork). |
| N/A (native EventSource) | Browser native | Server-Sent Events client                     | Native browser API includes automatic reconnection with Last-Event-ID support. No library needed for basic SSE. Only use polyfill if custom headers or credentials required.                                                                                                                                                                                      |

### Frontend — SSE Enhanced Reconnection (Optional)

| Library                  | Version | Purpose                                        | When to Use                                                                                                                                                                         |
| ------------------------ | ------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sse.js                   | Latest  | EventSource polyfill with enhanced control     | Use when you need custom headers (e.g., Authorization), configurable retry strategy, or manual control over reconnection timing. Native EventSource doesn't support custom headers. |
| reconnecting-eventsource | Latest  | EventSource wrapper with advanced reconnection | Use for exponential backoff + jitter on SSE (native EventSource uses server-provided retry: field only). Recommended for production SSE with strict reliability requirements.       |

### Frontend — HTTP Retry with Rate Limit Handling

| Technology | Version | Purpose                               | Why Recommended                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ky         | 1.14.3+ | Modern fetch wrapper with retry logic | Built-in retry with exponential backoff (0.3 _ (2^attemptCount - 1) _ 1000), respects 408/413/429/5xx status codes by default, buffers streaming responses for retry support, TypeScript-native. Lighter alternative to axios. **Rationale:** Handles 429 rate limits automatically; configurable via `retry: {limit, methods, statusCodes, backoffLimit}`. |

### Backend — Python Retry Logic

| Technology | Version | Purpose                    | Why Recommended                                                                                                                                                                                                                                                                                                      |
| ---------- | ------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tenacity   | 9.0.0+  | Retry decorator for Python | Industry standard for Python retry logic. Supports exponential backoff, jitter, conditional retries (`retry_if_exception_type`), max attempts/delay limits, detailed logging. **Rationale:** Cleaner than custom retry loops; works with async/await; used in production at scale (Instructor, major ML frameworks). |

### Backend — Rate Limiting

| Technology | Version | Purpose                                 | Why Recommended                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| slowapi    | 0.1.9+  | FastAPI rate limiting with token bucket | Port of Flask-Limiter; supports Redis, Memcached, or in-memory storage; decorator-based syntax (`@limiter.limit("5/minute")`); returns 429 with Retry-After header automatically. **Rationale:** More mature than fastapi-limiter (production-tested with millions of requests/month), better documentation, active community (2026 updates). |

### Backend — Rate Limit Storage (Production)

| Technology | Version | Purpose                                | Why Recommended                                                                                                                                                                                  |
| ---------- | ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Redis      | 7.0+    | Distributed rate limit counter storage | Required for multi-instance FastAPI deployments. slowapi uses atomic Lua scripts for consistent rate limiting across replicas. In-memory storage only works for single-process dev environments. |

## Supporting Libraries

### Frontend

| Library                | Version     | Purpose                                            | When to Use                                                                                                                                             |
| ---------------------- | ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ky                     | 1.14.3+     | Fetch wrapper for API calls to Mistral/AssemblyAI  | Use for all HTTP requests that need retry logic. Configure `retry: {statusCodes: [408, 413, 429, 500, 502, 503, 504]}` to handle rate limits.           |
| native EventSource     | Browser API | SSE streaming for transcription/correction results | Use by default. Native API reconnects automatically with Last-Event-ID. Only replace with polyfill if custom headers needed.                            |
| reconnecting-websocket | 4.4.0       | WebSocket reconnection for AssemblyAI streaming    | Use for `/ws/transcribe-stream` endpoint. Configure `maxRetries: 5`, `reconnectInterval: 3000`, `maxReconnectInterval: 30000` with exponential backoff. |

### Backend

| Library  | Version | Purpose                                      | When to Use                                                                                                                                                                                                |
| -------- | ------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tenacity | 9.0.0+  | Retry logic for Mistral/AssemblyAI API calls | Wrap all external API calls with `@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))`. Use `retry_if_exception_type(httpx.HTTPStatusError)` for HTTP-specific retries. |
| slowapi  | 0.1.9+  | Rate limiting middleware                     | Apply globally to protect backend from abuse, or per-route for expensive operations (e.g., `/transcribe`, `/correct`). Use Redis storage in production.                                                    |
| httpx    | 0.27.0+ | Async HTTP client (already in stack)         | Continue using for Mistral/AssemblyAI calls. Pair with tenacity for retry logic. Check response headers for Retry-After on 429 errors.                                                                     |

## Installation

```bash
# Frontend
npm install ky@1.14.3
npm install reconnecting-websocket@4.4.0

# Optional (SSE with custom headers)
npm install @mpetazzoni/sse.js

# Backend
pip install tenacity==9.0.0
pip install slowapi==0.1.9
pip install redis==5.0.0  # For production rate limiting
```

## Alternatives Considered

| Recommended            | Alternative                     | When to Use Alternative                                                                                                                             |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ky                     | axios                           | Use axios if already in stack or if you need broader ecosystem (interceptors, cancel tokens). ky is lighter and more modern.                        |
| reconnecting-websocket | native WebSocket + custom retry | Use native if you need ultra-fine control over reconnection logic (e.g., custom backoff algorithm). reconnecting-websocket covers 95% of use cases. |
| native EventSource     | sse.js polyfill                 | Use polyfill only if you need custom headers (Authorization) or CORS credentials. Native API is faster and has no dependencies.                     |
| tenacity               | backoff library                 | Use backoff (0.1MB vs tenacity 0.3MB) if package size is critical. tenacity has richer API (conditional retries, logging, async support).           |
| slowapi                | fastapi-limiter                 | Use fastapi-limiter if you prefer dependency injection over decorators. slowapi is more mature and has better Retry-After header support.           |

## What NOT to Use

| Avoid                                                        | Why                                                                                                                                                                              | Use Instead                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| socket.io                                                    | Overkill for simple WebSocket streaming; requires socket.io server on backend (not compatible with FastAPI WebSocket); adds 200KB+ to bundle. AssemblyAI uses native WebSockets. | reconnecting-websocket (thin wrapper around native WebSocket) |
| Custom retry loops (e.g., `for i in range(8): try...except`) | Error-prone (no jitter, no exponential backoff cap, hard to test, logs not standardized). Current code in `backend/main.py` lines 310–334 has these issues.                      | tenacity with `@retry` decorator                              |
| In-memory rate limiting in production                        | Doesn't work across multiple FastAPI instances; each worker has separate counter.                                                                                                | slowapi with Redis storage                                    |
| EventSource polyfills without auto-reconnect                 | Native EventSource already reconnects; polyfills like `event-source-polyfill` don't add reconnection.                                                                            | Use native EventSource or reconnecting-eventsource wrapper    |
| Custom WebSocket heartbeat logic                             | Reinventing the wheel; reconnecting-websocket handles this with `pingTimeout` and `keepAlive` options.                                                                           | reconnecting-websocket with `pingTimeout: 30000`              |

## Stack Patterns by Variant

### Pattern 1: WebSocket Streaming (AssemblyAI Real-Time)

**Frontend:**

```typescript
import ReconnectingWebSocket from 'reconnecting-websocket';

const ws = new ReconnectingWebSocket('ws://localhost:8000/ws/transcribe-stream', [], {
	maxRetries: 5,
	reconnectInterval: 3000,
	maxReconnectInterval: 30000,
	reconnectDecay: 1.5,
	connectionTimeout: 10000
});

ws.addEventListener('error', (event) => {
	console.error('WebSocket error:', event);
	// Show user-facing error: "Connection lost, reconnecting..."
});

ws.addEventListener('open', () => {
	console.log('WebSocket connected');
	// Clear error message
});
```

**Backend:**

```python
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

@app.websocket("/ws/transcribe-stream")
async def transcribe_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            # Process audio...
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal server error")
```

### Pattern 2: SSE Streaming (Transcription/Correction Results)

**Frontend (Native EventSource):**

```typescript
const eventSource = new EventSource('/api/transcribe-api');

eventSource.addEventListener('message', (event) => {
	const data = JSON.parse(event.data);
	// Update UI with transcription progress
});

eventSource.addEventListener('error', (event) => {
	if (eventSource.readyState === EventSource.CLOSED) {
		console.error('SSE connection closed permanently');
		// Show error to user
	} else {
		console.warn('SSE connection lost, browser will auto-reconnect');
		// Show "Reconnecting..." status
	}
});

// Browser auto-reconnects with Last-Event-ID header
// Server should check Last-Event-ID to resume stream
```

**Backend:**

```python
from sse_starlette.sse import EventSourceResponse
import asyncio

async def transcribe_stream():
    # Track message IDs for resume support
    message_id = 0
    for segment in transcription_segments:
        message_id += 1
        yield {
            "id": str(message_id),  # Client sends Last-Event-ID on reconnect
            "event": "message",
            "data": json.dumps(segment)
        }
        await asyncio.sleep(0.1)

@app.get("/transcribe")
async def transcribe(request: Request):
    last_event_id = request.headers.get("Last-Event-ID")
    # Resume from last_event_id if present
    return EventSourceResponse(transcribe_stream())
```

### Pattern 3: API Rate Limit Handling (Mistral 429 Errors)

**Frontend (ky with retry):**

```typescript
import ky from 'ky';

const api = ky.create({
	retry: {
		limit: 5,
		methods: ['post'],
		statusCodes: [408, 413, 429, 500, 502, 503, 504],
		backoffLimit: 30000 // Cap at 30 seconds
	},
	hooks: {
		afterResponse: [
			async (request, options, response) => {
				if (response.status === 429) {
					const retryAfter = response.headers.get('Retry-After');
					if (retryAfter) {
						const delayMs = parseInt(retryAfter) * 1000;
						console.warn(`Rate limited, retrying after ${delayMs}ms`);
						await new Promise((resolve) => setTimeout(resolve, delayMs));
					}
				}
			}
		]
	}
});

// Use for Mistral API calls
const response = await api.post('/api/correct', { json: { text, dialect } });
```

**Backend (tenacity with Retry-After parsing):**

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx

def parse_retry_after(exception: httpx.HTTPStatusError) -> float:
    """Extract Retry-After header from 429 response."""
    if exception.response.status_code == 429:
        retry_after = exception.response.headers.get("Retry-After")
        if retry_after:
            return float(retry_after)
    return 0

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError)),
    reraise=True
)
async def call_mistral_api(text: str):
    try:
        response = await httpx_client.post(
            "https://api.mistral.ai/v1/chat/completions",
            json={"model": "mistral-small-latest", "messages": [...]},
            headers={"Authorization": f"Bearer {MISTRAL_API_KEY}"},
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            retry_after = parse_retry_after(e)
            if retry_after > 0:
                print(f"Rate limited, retry after {retry_after}s")
                await asyncio.sleep(retry_after)
        raise
```

### Pattern 4: Rate Limiting Backend (slowapi)

**Installation:**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize with Redis (production)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"  # Or in-memory:// for dev
)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply per-route
@app.post("/transcribe")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def transcribe(request: Request):
    # Process transcription...
    pass

# Response includes:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
# X-RateLimit-Reset: 1679568000
# Retry-After: 60 (if rate limited)
```

## Version Compatibility

| Package A                    | Compatible With                 | Notes                                                                     |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| reconnecting-websocket@4.4.0 | SvelteKit 2.x, Svelte 5.x       | Works with any JS framework. Import in browser context only (not SSR).    |
| ky@1.14.3                    | SvelteKit 2.x, Node 20+         | Uses native fetch API. Works in both browser and SvelteKit API routes.    |
| tenacity@9.0.0               | Python 3.10+, FastAPI 0.100+    | Async support requires Python 3.10+. Works with httpx, aiohttp, requests. |
| slowapi@0.1.9                | FastAPI 0.100+, Starlette 0.27+ | Requires Redis 5.0+ for production. In-memory storage for dev only.       |

## Confidence Assessment

| Area                   | Confidence | Rationale                                                                                                                                                                                                    |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WebSocket reconnection | HIGH       | reconnecting-websocket is battle-tested and widely adopted. Official docs + 6 years production use.                                                                                                          |
| SSE reconnection       | HIGH       | Native EventSource API has built-in reconnection (MDN docs, W3C spec). Polyfills verified via official repos.                                                                                                |
| HTTP retry (frontend)  | HIGH       | ky official docs confirm retry behavior + exponential backoff. Used in production at scale.                                                                                                                  |
| Python retry (backend) | HIGH       | tenacity is industry standard (official docs, used by major frameworks like Instructor).                                                                                                                     |
| Rate limiting          | MEDIUM     | slowapi well-documented and production-tested. Redis integration standard. **Caveat:** fastapi-limiter received 2026 updates (v0.2.0), but slowapi has broader adoption per search results.                  |
| Mistral 429 handling   | MEDIUM     | Retry-After header confirmed in Mistral discussions (GitHub issues). **Caveat:** Official Mistral docs don't explicitly document Retry-After; implementation based on community findings. Verify in testing. |
| AssemblyAI WebSocket   | HIGH       | Official AssemblyAI docs confirm StreamingError codes, on_error handler pattern, and session timeout behavior.                                                                                               |

## Migration Path from Current Code

### 1. Replace Custom Retry Loop (backend/main.py lines 310–334)

**Before:**

```python
for retry_attempt in range(8):
    try:
        response = mistral_client.chat.stream(...)
        break
    except Exception as e:
        if retry_attempt < 7:
            await asyncio.sleep(2 ** retry_attempt)
        else:
            raise
```

**After:**

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=1, max=10))
async def correct_chunk_mistral_stream(text: str, dialect: str):
    response = mistral_client.chat.stream(...)
    return response
```

**Why:** Eliminates hardcoded retry logic; adds jitter automatically; better logging; handles Retry-After parsing with custom hook.

### 2. Add WebSocket Reconnection (frontend +page.svelte lines 394–440)

**Before:**

```typescript
const ws = new WebSocket('ws://localhost:8000/ws/transcribe-stream');
ws.onerror = (e) => console.error('WebSocket error:', e);
```

**After:**

```typescript
import ReconnectingWebSocket from 'reconnecting-websocket';

const ws = new ReconnectingWebSocket('ws://localhost:8000/ws/transcribe-stream', [], {
	maxRetries: 5,
	reconnectInterval: 3000,
	maxReconnectInterval: 30000,
	connectionTimeout: 10000
});

ws.addEventListener('error', (event) => {
	console.error('WebSocket error:', event);
	errorMessage.set('Connection lost, reconnecting...');
});

ws.addEventListener('open', () => {
	errorMessage.set(''); // Clear error on reconnect
});
```

**Why:** Automatic reconnection with exponential backoff; user-facing error messages; no silent failures.

### 3. Add Backend Rate Limiting

**New (backend/main.py):**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")  # Use Redis in prod

@app.post("/transcribe")
@limiter.limit("10/minute")
async def transcribe(request: Request, file: UploadFile):
    # Existing logic...
    pass

@app.post("/correct")
@limiter.limit("5/minute")  # Lower limit for expensive correction
async def correct(request: Request):
    # Existing logic...
    pass
```

**Why:** Protects backend from abuse; returns 429 with Retry-After header; client (ky) will retry automatically.

## Sources

**WebSocket Reconnection:**

- [reconnecting-websocket npm](https://www.npmjs.com/package/reconnecting-websocket) — Official docs, configuration options
- [WebSocket.org FastAPI Guide](https://websocket.org/guides/frameworks/fastapi/) — Reconnection patterns, exponential backoff best practices

**SSE Reconnection:**

- [MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — Native EventSource API, Last-Event-ID behavior
- [javascript.info Server Sent Events](https://javascript.info/server-sent-events) — Reconnection mechanism, retry: field

**HTTP Retry:**

- [ky GitHub](https://github.com/sindresorhus/ky) — Retry configuration, status codes, exponential backoff formula
- [Atlassian Rate Limiting in JavaScript](https://www.atlassian.com/blog/developer/handling-rate-limiting-in-javascript) — Exponential backoff + jitter best practices
- [API Status Check Rate Limits Guide 2026](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits) — Retry-After header parsing, 429 handling

**Python Retry:**

- [tenacity GitHub](https://github.com/jd/tenacity) — Official docs, retry decorators, async support
- [tenacity PyPI](https://pypi.org/project/tenacity/) — Version compatibility, installation

**Rate Limiting:**

- [slowapi Medium Guide 2026](https://shiladityamajumder.medium.com/using-slowapi-in-fastapi-mastering-rate-limiting-like-a-pro-19044cb6062b) — Production patterns, Redis integration
- [FastAPI Production Rate Limiting](https://patrykgolabek.dev/guides/fastapi-production/rate-limiting/) — Token bucket algorithm, distributed rate limiting

**AssemblyAI:**

- [AssemblyAI Streaming Docs](https://www.assemblyai.com/docs/api-reference/streaming) — WebSocket error codes, StreamingEvents.Error handler
- [AssemblyAI Real-Time Python Guide](https://www.assemblyai.com/blog/real-time-transcription-in-python) — Connection resilience, session management

**Mistral API:**

- [Mistral Rate Limits Docs](https://docs.mistral.ai/deployment/ai-studio/tier) — Usage tiers, rate limit structure
- [Pydantic AI Issue #1885](https://github.com/pydantic/pydantic-ai/issues/1885) — Community discussion on 429 handling, Retry-After parsing

---

_Stack research for: WebSocket/SSE streaming stability in SvelteKit + FastAPI_
_Researched: 2026-03-23_
