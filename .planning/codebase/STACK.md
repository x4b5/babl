# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**

- TypeScript 5.9.3 - Frontend (SvelteKit + Svelte 5)
- Python 3.14 - Backend FastAPI server

**Secondary:**

- JavaScript - Build config files, bash scripts

## Runtime

**Environment:**

- Node.js 24 (see `.nvmrc`)
- Python 3.14 (backend/.venv)

**Package Manager:**

- npm (Node.js)
- pip (Python)
- Lockfile: `package-lock.json` present

## Frameworks

**Core Frontend:**

- SvelteKit 2.50.2 - Full-stack meta-framework
- Svelte 5.51.0 - Component framework (Svelte 5 runes: `$state`, `$props`, `$derived`, `$effect`)
- Tailwind CSS 4.2.0 - Utility-first CSS framework

**Backend:**

- FastAPI - Python async web framework
- uvicorn - ASGI server for FastAPI

**Testing:**

- Vitest 4.0.18 - Unit test runner

**Build/Dev:**

- Vite 7.3.1 - Frontend build tool
- SvelteKit Vite plugin 6.2.4 - Svelte integration
- Tailwind CSS Vite plugin 4.2.0 - CSS processing
- TypeScript compiler 5.9.3 - Type checking

**Code Quality:**

- Prettier 3.8.1 - Code formatter (with svelte plugin 3.5.0)
- svelte-check 4.3.6 - Svelte component type checker
- husky 9.1.7 - Git hooks manager
- lint-staged 16.3.1 - Run linters on staged files

## Key Dependencies

**Critical Frontend:**

- `assemblyai` 4.27.0 - AssemblyAI TypeScript SDK (speech-to-text API)
- `@mistralai/mistralai` 1.15.1 - Mistral AI TypeScript SDK (dialect correction API)
- `posthog-js` 1.352.1 - PostHog analytics client (EU endpoint)

**Backend Core:**

- FastAPI (async HTTP framework)
- uvicorn (ASGI server)
- python-multipart (form data parsing)

**Backend ML/Audio:**

- mlx-whisper (Apple Silicon optimized Whisper transcription)
- mistralai (Mistral API Python client)
- assemblyai (AssemblyAI Python SDK)
- httpx (async HTTP client for Ollama/AssemblyAI)
- python-dotenv (environment variable management)

**Infrastructure:**

- Ollama (local LLM runtime for Gemma3 models — not in requirements.txt, external service)

## Configuration

**Environment Variables - Frontend:**

- `VITE_PUBLIC_POSTHOG_KEY` - PostHog analytics key (public)
- `VITE_PUBLIC_POSTHOG_HOST` - PostHog endpoint (defaults to `https://eu.posthog.com`)
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key (private, in `src/routes/api/transcribe-api/+server.ts`)
- `MISTRAL_API_KEY` - Mistral AI API key (private, in `src/routes/api/correct/+server.ts`)

**Environment Variables - Backend:**

- `ASSEMBLYAI_API_KEY` - AssemblyAI API key (backend/main.py)
- `MISTRAL_API_KEY` - Mistral API key (backend/main.py)
- Loaded from `.env` file via python-dotenv

**Build Configuration:**

- `svelte.config.js` - SvelteKit with Vercel adapter
- `vite.config.ts` - Vite with Tailwind + SvelteKit plugins
- `tsconfig.json` - TypeScript strict mode enabled
- `tailwind.config.js` - Implicit (Tailwind 4 uses defaults)

**Deployment Config:**

- `@sveltejs/adapter-vercel` - Vercel deployment adapter (frontend only)

## Platform Requirements

**Development:**

- macOS (Apple Silicon) for local ml-whisper optimization
- Node.js 24
- Python 3.14 with venv
- Ollama service running on localhost:11434 (for local dialect correction)
- ffprobe (for audio duration detection in backend)

**Production:**

- Vercel (frontend deployment via `@sveltejs/adapter-vercel`)
- FastAPI backend hosted separately (poort 8000 in dev, configurable in production)
- AssemblyAI cloud (transcription service, EU Dublin datacenter)
- Mistral AI cloud (dialect correction service, EU servers)

## Architecture Notes

**Dual Processing Modes:**

1. **Local mode**: Browser → FastAPI backend (localhost:8000) → mlx-whisper (transcribe) → Ollama (correct)
2. **API mode**: Browser → SvelteKit API routes → AssemblyAI (transcribe) → Mistral API (correct)

User selects mode per operation step. Both modes are integrated into the same frontend experience.

**Audio Processing:**

- Browser captures via MediaRecorder API
- Downsampled to 16kHz mono WAV
- Sent to either local backend or AssemblyAI
- Correction streamed via Server-Sent Events (SSE) for real-time display

**WebSocket Support:**

- `POST /ws/transcribe-stream` endpoint in backend for real-time AssemblyAI streaming

---

_Stack analysis: 2026-03-23_
