# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**Speech Recognition:**

- AssemblyAI Universal-2/Universal-3-Pro
  - What it's used for: Cloud-based speech-to-text (API mode)
  - SDK/Client: `assemblyai` npm package (frontend) + Python SDK (backend)
  - Auth: `ASSEMBLYAI_API_KEY` env var
  - Endpoints:
    - `POST /api/transcribe-api` - Submit audio for transcription
    - `GET /api/transcribe-api/[id]` - Poll transcription status
    - `WS /ws/transcribe-stream` - Real-time streaming via WebSocket
  - Datacenter: Dublin, EU
  - Language detection: Automatic or manual (language_code: 'nl', 'li', 'en')
  - Speaker labels: Enabled (utterance.speaker extraction in `src/routes/api/transcribe-api/[id]/+server.ts`)
  - Rate limiting: Retry logic with exponential backoff

**Dialect Correction & LLM:**

- Mistral AI API (mistral-small-latest, mistral-large-latest)
  - What it's used for: Dialect translation + text correction/summarization (API mode)
  - SDK/Client: `@mistralai/mistralai` npm package (frontend) + Python SDK (backend)
  - Auth: `MISTRAL_API_KEY` env var
  - Endpoints: `POST /api/correct` - Stream-based correction
  - Models:
    - Light: `mistral-small-latest`
    - Medium: `mistral-large-latest`
  - Streaming: Event stream (SSE with token-by-token delivery)
  - Temperature: Configurable (default 0.5)
  - Max tokens: Calculated as `max(512, wordCount * 2)`
  - Rate limiting: Exponential backoff for 429 errors (max 8 retries with up to 3s wait)
  - System prompts: Three modes in `src/routes/api/correct/+server.ts`:
    - `kort` - Bullet point summary
    - `middellang` - Short report
    - `lang` - Detailed report
  - Chunking: Text split into 400-word chunks, processed sequentially with full context passed for small texts

**Local Processing (Self-Hosted):**

- Ollama (gemma3:4b, gemma3:12b)
  - What it's used for: Local LLM-based dialect correction (local mode)
  - Endpoint: `http://localhost:11434/api/generate`
  - Models:
    - Light: `gemma3:4b`
    - Medium: `gemma3:12b`
  - Streaming: SSE token stream
  - Max parallel requests: 3 (semaphore in backend/main.py)
  - Warmup: Models preloaded on FastAPI startup

- mlx-whisper (whisper-large-v3-mlx)
  - What it's used for: Local speech-to-text via Apple Silicon
  - Model: `mlx-community/whisper-large-v3-mlx`
  - Processing: Local to machine, no external API calls
  - Endpoint: `POST /transcribe` and `POST /transcribe-live` in FastAPI backend

## Data Storage

**Databases:**

- None detected - Stateless application

**File Storage:**

- Browser local storage (temporary, during session)
- `/tmp` filesystem for audio files in backend (temporary processing)
- No persistent data store

**Caching:**

- None detected

## Authentication & Identity

**Auth Provider:**

- None - Application is unauthenticated
- No user accounts or sessions required
- Analytics anonymized via PostHog `person_profiles: 'never'` setting

## Monitoring & Observability

**Error Tracking:**

- PostHog (implicit error capture via `posthog.capture()`)
- Location: `src/lib/utils/analytics.ts`

**Analytics:**

- PostHog (EU endpoint: `https://eu.posthog.com`)
  - SDK: `posthog-js` 1.352.1
  - Init config: `person_profiles: 'never'`, `ip: false`, `capture_pageview: false`
  - Events tracked:
    - `page_viewed` - Page navigation
    - `session_abandoned` - User leaves tab (via visibilitychange)
  - GDPR compliant: No PII capture, EU endpoint only

**Logging:**

- Console logs in browser (dev mode)
- Backend: Python print statements to stdout
- No external logging service

**Audio Processing Logging:**

- Backend logs audio duration via ffprobe
- Session timing tracked for long recordings

## CI/CD & Deployment

**Hosting:**

- Frontend: Vercel (via `@sveltejs/adapter-vercel`)
- Backend: Self-hosted (any environment supporting Python 3.14 + uvicorn)

**CI Pipeline:**

- None detected (git hooks via husky, but no automated CI)

**Git Hooks:**

- husky 9.1.7 with lint-staged
- Triggers: Prettier formatting on staged files (`*.{js,ts,svelte,css,md,json}`)

## Environment Configuration

**Required environment variables:**

Frontend (public):

- `VITE_PUBLIC_POSTHOG_KEY` - PostHog analytics key

Frontend (private, server-side routes):

- `ASSEMBLYAI_API_KEY` - AssemblyAI transcription API key
- `MISTRAL_API_KEY` - Mistral AI correction API key

Backend (FastAPI):

- `ASSEMBLYAI_API_KEY` - AssemblyAI API key
- `MISTRAL_API_KEY` - Mistral API key

Optional:

- `VITE_PUBLIC_POSTHOG_HOST` - Defaults to `https://eu.posthog.com` if not set

**Secrets location:**

- `.env` file in project root (gitignored)
- `.env` file in backend/ directory (gitignored)
- Reference: `.env.example` in project root shows required keys

## Webhooks & Callbacks

**Incoming:**

- None detected

**Outgoing:**

- AssemblyAI polling-based (no webhooks, client polls `/api/transcribe-api/[id]` for status)
- WebSocket stream to AssemblyAI (real-time bidirectional, endpoint `WS /ws/transcribe-stream`)

## CORS Configuration

**Backend CORS:**

- Allowed origins: `http://localhost:5173` (dev frontend)
- Allowed methods: `*`
- Allowed headers: `*`
- Location: `backend/main.py` line 81-86

**SvelteKit API Routes:**

- No explicit CORS needed (same-origin requests)
- Vercel deployment will need frontend + backend domain configuration in production

## Rate Limiting & Quotas

**AssemblyAI:**

- Retry logic with exponential backoff in backend
- No explicit quota handling

**Mistral AI:**

- Rate limit handling: 429 error detection with exponential backoff (up to 8 retries)
- Backoff formula: `3 * 2^attempt` seconds
- Location: `src/routes/api/correct/+server.ts` lines 141-171

**Ollama:**

- Local service - no rate limits
- Parallel request limit: 3 concurrent requests via semaphore

## Data Privacy & Compliance

**EU Data Centers:**

- AssemblyAI: Dublin datacenter (EU)
- Mistral AI: EU servers only
- PostHog: EU endpoint (`eu.posthog.com`)

**GDPR Compliance:**

- Analytics: `person_profiles: 'never'` - No user profiles collected
- IP tracking: Disabled (`ip: false`)
- PII: Never logged or transmitted
- Transcription content: Local processing available (no cloud logs)
- Session data: Stateless, no persistent storage

---

_Integration audit: 2026-03-23_
