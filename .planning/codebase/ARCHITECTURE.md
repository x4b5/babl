# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Dual-backend, event-driven SPA with streaming response architecture

**Key Characteristics:**

- Frontend-driven dual-mode audio processing (local FastAPI backend + cloud API)
- Real-time streaming for long recordings (WebSocket + SSE for transcription and correction)
- Svelte 5 state-first architecture with single source of truth
- Session-based access control (password-protected, token-verified)
- Two-phase processing: transcription → correction (both user-selectable per mode)
- Privacy-first: no PII logging, all sensitive processing routed through EU servers

## Layers

**UI Layer (Frontend - SvelteKit):**

- Purpose: React to user interactions, display state, stream responses incrementally
- Location: `src/routes/transcribe/+page.svelte` (main app), `src/routes/login/+page.svelte` (auth gate)
- Contains: Recording controls, audio visualizer, transcription display, correction UI, cost estimators
- Depends on: Svelte 5 runes (`$state`, `$derived`, `$effect`), MediaRecorder API, Web Audio API
- Used by: End users via browser

**State Layer (Frontend - Stores):**

- Purpose: Single source of truth for app state (recording status, text, quality settings, availability)
- Location: `src/lib/stores/game.svelte.ts` (game phase state), `src/lib/stores/ui.svelte.ts` (modal/accordion state)
- Contains: `$state` declarations for recording/processing status, raw/corrected text, language, quality, temperature
- Depends on: Svelte 5 runes
- Used by: `+page.svelte` via `getGameState()` getters, never direct mutations from components

**Engine Layer (Frontend - Pure Functions):**

- Purpose: Audio processing, format conversion (exists as placeholder structure)
- Location: `src/lib/engine/` (directory exists, currently empty/minimal)
- Contains: (Intended for WAV encoding, downsampling logic — currently inline in +page.svelte)
- Depends on: Web Audio API, ArrayBuffer operations
- Used by: UI layer for audio preparation before sending

**API Routes (SvelteKit - Serverless):**

- Purpose: Proxy calls to cloud services, authenticate with API keys, stream results back
- Location: `src/routes/api/` subdirectories
- Contains: `/health` (availability check), `/transcribe-api` (AssemblyAI submit), `/transcribe-api/[id]` (AssemblyAI poll), `/correct` (Mistral correction)
- Depends on: AssemblyAI SDK, Mistral SDK, environment variables for API keys
- Used by: Frontend fetch calls during API mode

**Backend (FastAPI - Local Python Server):**

- Purpose: Whisper transcription and Ollama correction for local processing mode
- Location: `backend/main.py` (running on localhost:8000)
- Contains: `/health` (local availability), `/transcribe` (SSE streaming transcription), `/transcribe-live` (incremental transcription with offset), `/correct` (SSE streaming correction), `/ws/transcribe-stream` (WebSocket real-time streaming via AssemblyAI)
- Depends on: mlx-whisper (Apple Silicon), Ollama API, httpx for HTTP calls
- Used by: Frontend when `transcribeMode === 'local'` or `mode === 'local'`

**Authentication Layer:**

- Purpose: Session management and access control
- Location: `src/hooks.server.ts` (auth middleware), `src/routes/login/+page.server.ts` (login form), `src/routes/logout/+page.server.ts` (logout)
- Contains: HMAC-SHA256 token generation/verification, cookie-based session persistence
- Depends on: Node.js crypto module, SvelteKit handle hook
- Used by: All protected routes (redirect unauth to `/login`)

**Analytics Layer:**

- Purpose: Privacy-respecting event tracking (no PII, EU endpoint, no user profiles)
- Location: `src/lib/utils/analytics.ts`
- Contains: PostHog initialization and event capture functions (`initAnalytics`, `trackPageViewed`, `setupAbandonmentTracking`)
- Depends on: PostHog JS SDK, environment variables
- Used by: `+layout.svelte` for session abandonment tracking

## Data Flow

**Recording → Transcription (Local Mode):**

1. User clicks record button → `startRecording()` initiates MediaRecorder with 500ms chunks
2. Audio chunks accumulate in `chunks: Blob[]` array
3. Every 5 seconds: `sendLiveChunk()` sends overlap-aware chunks to `POST /transcribe-live`
4. Backend (mlx-whisper) transcribes segments, returns via SSE with segment boundaries
5. Frontend accumulates `partialText` and updates `liveAudioDuration` from segment offsets
6. On stop: final unprocessed chunks sent to `/transcribe-live`, `raw` text set, status → `idle`

**Recording → Transcription (API Mode):**

1. User clicks record or selects real-time API mode
2. If real-time (WebSocket): `startRealtimeStream()` opens WS connection to local backend `/ws/transcribe-stream`
3. Each MediaRecorder chunk → `sendChunkToStream()` converts to PCM-Int16 and sends via WebSocket
4. Local backend proxies to AssemblyAI; results stream back as `partial` (work-in-progress) and `final` (confirmed)
5. If batch (poll): full audio sent on stop to `POST /api/transcribe-api`, receives transcript ID
6. Frontend polls `GET /api/transcribe-api/[id]` every 3 seconds until status = `completed`
7. Result set in `raw` text, status → `idle`

**Transcription → Correction:**

1. User clicks "Verslaglegging genereren" → `startCorrection()` initiated
2. Status set to `correcting`, `raw` text sent to correction endpoint via `fetchCorrection()`
3. If local mode: `POST /correct` to backend (Ollama) with parameters (language, quality, temperature, report_length)
4. If API mode: `POST /api/correct` to SvelteKit route (Mistral)
5. Both endpoints: text chunked (max 400 words), each chunk corrected via streaming
6. Frontend SSE reader accumulates tokens into `corrected` state in real-time
7. On completion: status → `idle`, user sees final `corrected` text with copy button

**Health Check (Availability Detection):**

1. Page mount: `$effect` fires two parallel checks
2. `fetch('/api/health')` → SvelteKit route checks `env.MISTRAL_API_KEY` and `env.ASSEMBLYAI_API_KEY` existence
3. `fetch('http://localhost:8000/health')` → backend reports local (Whisper/Ollama) availability
4. Results set in `mistralAvailable`, `assemblyAvailable`, `localAvailable` states
5. UI disables unavailable transcription/correction modes

**State Management:**

- All reactive state lives in component runes (`$state`): `status`, `raw`, `corrected`, `language`, etc.
- Derived state via `$derived` for computed values: `formattedTime`, `processingProgress`, estimated costs
- Effects (`$effect`) manage timers, event listeners, health checks
- No duplication: stores are placeholders; main app state is page-local
- Analytics: `setupAbandonmentTracking()` in `+layout.svelte` captures phase via getter

## Key Abstractions

**Audio Processing (Inline):**

- Purpose: Convert browser audio to Whisper-compatible format
- Examples: `downsampleToWav()` (offline resampling to 16kHz mono), `encodeWav()` (PCM encoding), `toPcmInt16()` (AssemblyAI format)
- Pattern: Pure async functions; no state mutations; return Blob or ArrayBuffer

**Streaming Response Handling:**

- Purpose: Incrementally display transcription/correction tokens
- Examples: SSE parsing in `sendAudioLocal()` and `fetchCorrection()`, WebSocket message parsing in `startRealtimeStream()`
- Pattern: ReadableStream reader loop, manual text/JSON parsing from delimited lines, state accumulation on each chunk

**Modal/Accordion UI State:**

- Purpose: Manage UI visibility without polluting core state
- Examples: `privacyOpen`, `rawExpanded`, `correctedExpanded`, modal in `ui.svelte.ts`
- Pattern: Simple boolean `$state` with toggle functions

**Form Action (Login):**

- Purpose: Server-side password validation and token generation
- Examples: `src/routes/login/+page.server.ts` action handler
- Pattern: SvelteKit form action with cookie-based session storage

## Entry Points

**Frontend Entry (Browser):**

- Location: `src/routes/+layout.svelte`
- Triggers: App load or navigation to protected route
- Responsibilities: Initialize analytics, enforce session middleware via hooks, render children

**Main App Page:**

- Location: `src/routes/transcribe/+page.svelte`
- Triggers: User navigates after successful authentication
- Responsibilities: Audio recording, transcription mode selection, correction generation, result display, live preview, cost estimation

**Authentication Gate:**

- Location: `src/routes/login/+page.svelte`
- Triggers: Unauth users try to access protected routes
- Responsibilities: Render password input form, submit via POST action, validate server-side

**SvelteKit API Routes:**

- Location: `src/routes/api/*/+server.ts`
- Triggers: Frontend fetch calls from `+page.svelte`
- Responsibilities: Validate API keys, proxy to cloud services, transform responses, stream results

**Local Backend (Startup):**

- Location: `backend/main.py` (run manually: `python -m uvicorn main:app --reload --port 8000`)
- Triggers: Developer starts local backend for testing
- Responsibilities: Load Whisper/Ollama models, accept audio uploads, stream transcription/correction, provide WebSocket endpoint

## Error Handling

**Strategy:** Frontend catches errors from both backends, displays user-friendly messages, gracefully degrades

**Patterns:**

- **Fetch errors** (network issues): `catch (TypeError)` → "API not reachable" or "Local backend not available"
- **API response errors** (4xx/5xx): Parse response text, extract error message, display in `error` state
- **Timeout** (long processing): Abort signal after 30 min (local) / 60 min (API), show "took too long" message
- **Streaming errors** (SSE/WebSocket): Capture `type: 'error'` event from server, throw and catch, update UI
- **AbortError** (user stops request): Distinguishable from network errors, handled separately
- **Default**: Generic "Fout: [message]" with server error details

## Cross-Cutting Concerns

**Logging:** Console.log used for debugging (development). No structured logging or external log aggregation.

**Validation:** Frontend validates file size > 0, audio format support, URL inputs. Backend validates API keys, file size, language codes.

**Authentication:** Session cookie (httpOnly, secure, sameSite=lax) verified via HMAC on every request. Fallback redirect to `/login`.

**Privacy:** No PII captured. Audio sent only to local backend (no exfil) or AU + Mistral (EU servers). PostHog configured with `person_profiles: 'never'`.

---

_Architecture analysis: 2026-03-23_
