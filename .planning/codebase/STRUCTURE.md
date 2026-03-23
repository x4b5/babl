# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
babbel/
├── src/                           # Frontend SvelteKit application
│   ├── app.css                    # Global styles, design tokens, animations
│   ├── hooks.server.ts            # Session middleware (auth verification)
│   ├── lib/
│   │   ├── components/            # (Empty — no reusable components needed)
│   │   ├── data/                  # Static data (CLAUDE.md only)
│   │   ├── engine/                # Pure functions (CLAUDE.md only; code is inline in +page.svelte)
│   │   ├── stores/
│   │   │   ├── game.svelte.ts     # Game phase state (welcome → playing → results)
│   │   │   └── ui.svelte.ts       # UI state (modal open/close)
│   │   └── utils/
│   │       ├── analytics.ts       # PostHog initialization and event capture
│   │       └── a11y.ts            # Accessibility helpers
│   └── routes/
│       ├── +layout.svelte         # Root layout (analytics setup, children renderer)
│       ├── +page.svelte           # Landing page (auto-redirects to /transcribe)
│       ├── login/
│       │   ├── +page.svelte       # Login form UI
│       │   └── +page.server.ts    # POST action (password validation, token generation)
│       ├── logout/
│       │   └── +page.server.ts    # DELETE session cookie, redirect to /login
│       ├── transcribe/
│       │   └── +page.svelte       # MAIN APP — recording, transcription, correction
│       └── api/
│           ├── health/
│           │   └── +server.ts     # GET /api/health — check API key availability
│           ├── transcribe-api/
│           │   ├── +server.ts     # POST /api/transcribe-api — submit audio to AssemblyAI
│           │   └── [id]/
│           │       └── +server.ts # GET /api/transcribe-api/[id] — poll AssemblyAI status
│           └── correct/
│               └── +server.ts     # POST /api/correct — correct text via Mistral (streaming)
│
├── backend/                       # Local Python FastAPI server (localhost:8000)
│   ├── main.py                    # FastAPI app with Whisper + Ollama endpoints
│   ├── dialects.py                # Limburgse dialect translation config
│   ├── .env                       # Backend env vars (API keys, ports)
│   └── .venv/                     # Python virtual environment
│
├── .claude/                       # Claude configuration
│   ├── agents/                    # Agent definitions
│   ├── commands/                  # Custom commands
│   ├── hooks/                     # Git hooks (validate, format)
│   ├── rules/                     # Constraints (code-standards, safety)
│   ├── skills/                    # Domain experts (analytics, backend, components, etc.)
│   └── settings.json              # Agent settings
│
├── scripts/                       # Utility scripts
│   └── start-transcribe.sh        # Start full stack (Ollama + backend + frontend)
│
├── docs/                          # Project documentation (architecture, ADRs)
├── .planning/
│   └── codebase/                  # This directory — analysis documents
│
├── tsconfig.json                  # TypeScript configuration
├── svelte.config.js               # SvelteKit adapter (Vercel) configuration
├── tailwind.config.ts             # Tailwind CSS 4 config
├── package.json                   # Node dependencies and scripts
├── .nvmrc                         # Node version (v24)
├── vite.config.ts                 # Vite configuration
├── .prettierrc                    # Prettier formatting rules
├── .eslintrc.cjs                  # ESLint configuration
└── .gitignore                     # Git ignore rules (.env, node_modules, etc.)
```

## Directory Purposes

**src/**

- Purpose: All SvelteKit frontend code
- Contains: Pages, layouts, API routes, stores, utilities, styles
- Key files: `+layout.svelte` (root), `routes/transcribe/+page.svelte` (main app), `hooks.server.ts` (auth)

**src/lib/stores/**

- Purpose: Svelte 5 runes-based state management
- Contains: `game.svelte.ts` (game phase), `ui.svelte.ts` (modals, accordions)
- Notes: Single source of truth via `$state` and `$derived`; components read via getters

**src/lib/utils/**

- Purpose: Utility functions (analytics, accessibility)
- Contains: `analytics.ts` (PostHog init/capture), `a11y.ts` (accessibility helpers)
- Notes: No side effects except analytics capture (wrapped in try/catch)

**src/routes/api/**

- Purpose: SvelteKit API routes that proxy to cloud services or check health
- Contains: Health check, AssemblyAI transcription submission/polling, Mistral correction
- Notes: Each route handles streaming responses (SSE or JSON), validates API keys from env

**src/routes/transcribe/**

- Purpose: Main app page
- Contains: `+page.svelte` (1600+ lines) with all recording, transcription, correction logic
- Notes: No child components; all state managed locally with `$state` and `$derived`

**src/routes/login/**

- Purpose: Authentication gate
- Contains: Login form (`+page.svelte`), password validation action (`+page.server.ts`)
- Notes: Server-side action validates against `ACCESS_PASSWORD` env var, sets session cookie

**backend/**

- Purpose: Local FastAPI server for Whisper transcription and Ollama correction
- Contains: Endpoints for `/health`, `/transcribe`, `/transcribe-live`, `/correct`, `/ws/transcribe-stream`
- Notes: Runs on `localhost:8000`; uses mlx-whisper for Apple Silicon GPU acceleration

**docs/**

- Purpose: Architecture decisions, design docs
- Contains: ADRs (Architecture Decision Records), design patterns

**.claude/**

- Purpose: Claude configuration and skills
- Contains: Agent definitions, build instructions, safety rules, code standards
- Notes: Used by Claude instances for context and constraints

## Key File Locations

**Entry Points:**

- `src/routes/+layout.svelte`: Root layout; initializes analytics, renders children
- `src/routes/transcribe/+page.svelte`: Main app; handles recording, transcription, correction
- `src/routes/login/+page.svelte`: Login form; password input
- `backend/main.py`: FastAPI app entry point (start with `uvicorn main:app --reload --port 8000`)

**Configuration:**

- `src/app.css`: Global styles, theme tokens (neon, accent, glass), animations
- `.env` / `.env.local`: Environment variables (ASSEMBLYAI_API_KEY, MISTRAL_API_KEY, ACCESS_PASSWORD, POSTHOG_KEY)
- `.nvmrc`: Node version (v24)
- `package.json`: NPM dependencies and scripts
- `svelte.config.js`: SvelteKit Vercel adapter

**Core Logic:**

- `src/routes/transcribe/+page.svelte`: 1600+ lines; recording, transcription, correction, cost calculation
- `src/routes/api/correct/+server.ts`: Mistral API integration; text chunking, streaming tokens
- `src/routes/api/transcribe-api/+server.ts`: AssemblyAI submission (POST)
- `src/routes/api/transcribe-api/[id]/+server.ts`: AssemblyAI polling (GET)
- `backend/main.py`: Whisper + Ollama integration; WebSocket streaming

**Testing:**

- No test files currently (vitest configured but unused)
- Test command: `npm run test:run`

**State Management:**

- `src/lib/stores/game.svelte.ts`: Game phase state
- `src/lib/stores/ui.svelte.ts`: Modal/accordion open/close state

## Naming Conventions

**Files:**

- `kebab-case` for filenames: `+server.ts`, `+page.svelte`, `analytics.ts`, `game.svelte.ts`
- Exception: `+page.svelte`, `+layout.svelte`, `+page.server.ts` (SvelteKit convention)

**Directories:**

- `kebab-case` for feature directories: `transcribe/`, `api/`, `login/`, `logout/`
- Grouping by function: `routes/`, `lib/`, `backend/`, `docs/`, `.claude/`

**Functions:**

- `camelCase`: `startRecording()`, `sendAudioLocal()`, `fetchCorrection()`, `splitIntoChunks()`

**Variables:**

- `camelCase` for variables: `status`, `raw`, `corrected`, `temperature`, `mediaRecorder`
- `UPPER_SNAKE_CASE` for constants: `LOCAL_BACKEND_URL`, `RECORDING_MAX_SECONDS`, `MAX_UPLOAD_BYTES`

**Types:**

- `PascalCase` for types: `GamePhase`, `Status`, `RequestHandler`

**CSS Classes:**

- `kebab-case` with prefix: `.glass`, `.glass-strong`, `.gradient-border-card`, `.waveform-container`, `.animate-fade-in`

## Where to Add New Code

**New Feature (Recording/Transcription):**

- Primary code: `src/routes/transcribe/+page.svelte` (if UI-related) or `backend/main.py` (if processing)
- Tests: Create `src/routes/transcribe/__tests__/` and `*.test.ts` files
- Utilities: Add to `src/lib/utils/` if reusable

**New API Endpoint:**

- SvelteKit API route: `src/routes/api/[feature]/+server.ts`
- Pattern: Validate env vars, proxy to service, handle streaming, error handling
- Example: `/api/correct` for Mistral correction

**New UI Component (if needed):**

- Location: `src/lib/components/` with `kebab-case-name.svelte`
- Pattern: Accept `$props()`, no internal state (use parent store getters), emit events via callback props

**New Store/State:**

- Location: `src/lib/stores/` with `.svelte.ts` extension
- Pattern: Use `$state`, export getter functions, no side effects
- Example: `ui.svelte.ts` for modal open/close

**Shared Utilities:**

- Location: `src/lib/utils/` with `.ts` extension
- Pattern: Pure functions, no side effects (except analytics with try/catch)
- Example: `analytics.ts`, `a11y.ts`

**Backend Changes:**

- Location: `backend/main.py` or new Python files in `backend/`
- Pattern: FastAPI route handlers, return JSON or SSE streams
- Dependencies: Add to `requirements.txt` and `backend/.venv`

## Special Directories

**src/lib/data/**

- Purpose: Static game/app data
- Generated: No
- Committed: Yes
- Notes: Protected — do not modify without explicit instruction

**src/lib/engine/**

- Purpose: Pure functions for audio processing (intended; currently empty)
- Generated: No
- Committed: Yes
- Notes: Code is currently inline in `+page.svelte`; could be extracted here

**backend/.venv/**

- Purpose: Python virtual environment
- Generated: Yes (via `python -m venv .venv`)
- Committed: No (in .gitignore)

**.vercel/output/**

- Purpose: Vercel build output (auto-generated on deploy)
- Generated: Yes (by Vercel)
- Committed: No (in .gitignore)

**.svelte-kit/**

- Purpose: SvelteKit build artifacts (auto-generated)
- Generated: Yes (by SvelteKit)
- Committed: No (in .gitignore)

**node_modules/**

- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

## File Organization Examples

**Page with Complex State:**

```
src/routes/transcribe/+page.svelte
├── Script section: Imports, $state declarations, $derived, $effect, helper functions
├── Template section: HTML markup with Svelte directives
└── Output: Full page with controls, results, privacy footer
```

**API Route (Streaming):**

```
src/routes/api/correct/+server.ts
├── Constants: SYSTEM_PROMPTS, MISTRAL_MODELS
├── Helper functions: splitIntoChunks(), buildMistralPrompt()
├── Async generator: correctChunkMistralStream()
└── POST handler: Validates env, chunks text, streams to client
```

**Store Module:**

```
src/lib/stores/ui.svelte.ts
├── $state declaration: _showModal
└── Exported object: modal { get open, set open, toggle }
```

---

_Structure analysis: 2026-03-23_
