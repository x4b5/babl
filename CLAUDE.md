# BABL — Agent Kompas

## Doel

BABL is een privacy-first spraak-naar-tekst tool met Limburgse dialectcorrectie. Het neemt audio op via de microfoon (of bestandsupload), transcribeert en corrigeert Limburgs dialect naar standaard Nederlands. Verwerking kan lokaal (Whisper + Ollama) of via API (AssemblyAI + Mistral) — gebruiker kiest per stap. GDPR en EU AI Act compliant.

## Techstack

- SvelteKit 5 + Svelte 5 runes (`$state`, `$derived`, `$effect`) — geen legacy syntax
- TypeScript strict mode
- Tailwind CSS 4
- PostHog analytics (EU endpoint `eu.posthog.com`, `person_profiles: 'never'`)
- Vercel deployment via `@sveltejs/adapter-vercel` (alleen frontend)
- Vitest voor tests
- **Backend lokaal**: Python FastAPI + mlx-whisper (Apple Silicon) + Ollama (Gemma3)
- **Backend API**: AssemblyAI (transcriptie, EU datacenter Dublin) + Mistral AI (correctie, EU servers)
- **Node**: v24 (zie `.nvmrc`)

## Repo Map

```
src/lib/engine/          -> Pure functies, geen side effects
src/lib/stores/          -> game.svelte.ts = enige bron van waarheid (Svelte 5 runes)
src/lib/stores/ui.svelte.ts -> UI state (modals etc.)
src/lib/data/            -> Statische data (beschermd, niet wijzigen zonder opdracht)
src/lib/components/      -> UI-componenten (Svelte 5, geen eigen state voor game-data)
src/lib/utils/           -> analytics.ts, a11y.ts, helpers
src/routes/              -> +layout.svelte (analytics), +page.svelte (template phase router)
src/routes/transcribe/   -> +page.svelte = HOOFD-APP (opname, transcriptie, correctie)
backend/                 -> Python FastAPI server (Whisper + Ollama endpoints)
backend/main.py          -> /health, /transcribe, /transcribe-live, /correct, /ws/transcribe-stream
src/routes/api/          -> SvelteKit API routes (AssemblyAI submit+poll, Mistral correctie)
scripts/                 -> start-transcribe.sh (full stack), log-hours.sh (tijdregistratie)
docs/                    -> Architectuur, ADRs, analytics-plan
.claude/skills/          -> Build-instructies per domein (SKILL.md met YAML frontmatter)
.claude/agents/          -> Geïsoleerde specialisten (security-expert)
.claude/rules/           -> Altijd geladen constraints (code-standards, safety)
.claude/commands/        -> Slash commands (/review, /commit, etc.)
.claude/hooks/           -> Shell scripts (validate, post-edit-format, session-start)
```

## Architectuur

### App Flow

```
idle → recording → processing (transcriptie) → correcting (verslaglegging) → idle
                                                    ↓
                                        toont ruwe tekst + gecorrigeerde tekst
```

### Verwerkingsmodi

Gebruiker kiest per stap (transcriptie en correctie) tussen lokaal of API:

| Stap         | Lokaal                                | API                                 |
| ------------ | ------------------------------------- | ----------------------------------- |
| Transcriptie | mlx-whisper (large-v3, Apple Silicon) | AssemblyAI (Universal-2, EU Dublin) |
| Correctie    | Ollama/Gemma3                         | Mistral AI (EU servers)             |

### Backend Endpoints (FastAPI, poort 8000)

- `GET /health` — Health check + beschikbaarheid lokaal/API
- `POST /transcribe` — Audio → Whisper (30s segmenten, SSE stream)
- `POST /transcribe-live` — Audio → Whisper (incrementeel, met offset filtering)
- `POST /correct` — Tekst → Ollama of Mistral (SSE token stream)
- `WS /ws/transcribe-stream` — Real-time WebSocket streaming via AssemblyAI

### Kwaliteitsmodi

| Modus  | Ollama model | Mistral model        |
| ------ | ------------ | -------------------- |
| Light  | gemma3:4b    | mistral-small-latest |
| Medium | gemma3:12b   | mistral-large-latest |

### Audio Processing

- Browser: MediaRecorder API + Web Audio API (waveform visualisatie)
- Downsampling naar 16kHz mono WAV voor Whisper
- Live transcriptie: incrementeel (alleen nieuwe chunks + 3s overlap), niet volledige audio
- Lange teksten worden gechunkt (max 400 woorden per chunk)
- Max 3 parallelle Ollama requests (semaphore)

### Design System

- Dark theme met glassmorphism — nooit `bg-white` gebruiken
- Kleur tokens in `src/app.css`: `--color-neon` (#d4ff00), `--color-accent-start` (#7c3aed), `--color-glass`
- Containers: `glass`, `glass-strong`, `gradient-border-card`
- Animaties: `animate-fade-in`, `animate-slide-up`, `animate-pulse-glow` — respecteer `prefers-reduced-motion`

## Werkregels

1. **Single source of truth**: Alle app-state leeft in `game.svelte.ts`. Nooit dupliceren in components.
2. **Svelte 5 only**: Gebruik `$props()`, `$state()`, `$derived()`, `$effect()`. Nooit `export let` of `$:`.
3. **Engine = pure functies**: Engine bestanden hebben geen side effects. Lees altijd alle engine files voor je er een wijzigt.
4. **Data is heilig**: Data bestanden NIET wijzigen zonder expliciete opdracht.
5. **Analytics via wrapper**: Altijd via `src/lib/utils/analytics.ts`, nooit direct PostHog. Try/catch verplicht.
6. **Privacy first**: Geen PII loggen. `person_profiles: 'never'`. Lokale modus = geen data naar buiten. API modus = alleen EU-servers (AssemblyAI Dublin, Mistral EU).
7. **App flow**: idle → recording → processing → correcting → idle. Geen stappen overslaan.
8. **Dual mode**: Gebruiker kiest per stap (transcriptie/correctie) tussen lokaal en API. FastAPI backend draait lokaal voor beide modi.
9. **Twee-staps verwerking**: Altijd eerst Whisper (ruwe transcriptie tonen), dan Ollama (correctie tonen). Gebruiker ziet progressie.
10. **Spacebar shortcut**: Spacebar start/stopt opname. Niet conflicteren met andere keyboard handlers.

## Commando's

```bash
npm run dev              # Frontend dev server (poort 5173)
npm run build            # Production build
npm run check            # TypeScript check
npm run test:run         # Vitest tests
npm run transcribe       # Start volledige stack (Ollama + backend + frontend)

# Backend apart starten:
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```
