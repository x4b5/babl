# BABL

Privacy-first spraak-naar-tekst tool die Limburgs dialect polijst naar standaard Nederlands. Neem audio op via de microfoon (of upload een bestand), krijg een ruwe transcriptie en daarna een gepolijste versie. Verwerking kan volledig lokaal (Whisper + Ollama) of via EU-gehoste API's (AssemblyAI + Mistral) — de gebruiker kiest per stap.

## Quickstart

```bash
nvm use              # juiste Node-versie (v24)
npm install          # dependencies + husky hooks
npm run dev          # frontend op localhost:5173
```

Voor de volledige stack (lokale transcriptie + polijsten):

```bash
npm run transcribe   # start Ollama + Python backend + frontend
```

Backend apart starten:

```bash
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

## Techstack

- **SvelteKit 5** + **Svelte 5 runes** (`$state`, `$derived`, `$effect`)
- **TypeScript strict mode**
- **Tailwind CSS 4** (dark theme, glassmorphism)
- **Python FastAPI backend** — mlx-whisper (Apple Silicon) + Ollama (Gemma3)
- **API-modus** — AssemblyAI (EU Dublin) + Mistral AI (EU servers)
- **PostHog analytics** (EU endpoint, `person_profiles: 'never'`)
- **Vitest** (frontend) + **pytest** (backend)
- **Vercel deployment** (alleen frontend)

## Hoe het werkt

```
idle → recording → processing (transcriptie) → polishing (polijsten) → idle
```

Twee stappen, elk lokaal of via API:

| Stap         | Lokaal                                | API                                 |
| ------------ | ------------------------------------- | ----------------------------------- |
| Transcriptie | mlx-whisper (large-v3, Apple Silicon) | AssemblyAI (Universal-2, EU Dublin) |
| Polijsten    | Ollama/Gemma3                         | Mistral AI (EU servers)             |

## Source Structuur

```
src/lib/stores/      → transcribe.svelte.ts = enige bron van waarheid (Svelte 5 runes)
src/lib/services/    → opname, transcriptie, polijsten, waveform (side effects)
src/lib/components/  → UI-componenten (presentationeel, state via store)
src/lib/utils/       → analytics wrapper, helpers (pure functies)
src/routes/          → +layout.svelte (analytics), / redirect → /transcribe
src/routes/transcribe/ → hoofd-app (opname, transcriptie, polijsten)
src/routes/api/      → SvelteKit API routes (AssemblyAI, Mistral)
backend/             → Python FastAPI (Whisper + Ollama endpoints)
docs/                → architectuur, ADRs, analytics plan
```

## Agentic Architectuur

```
CLAUDE.md                    → Root kompas: doel, techstack, werkregels
.claude/skills/              → Build-instructies per domein
.claude/agents/              → Geïsoleerde specialisten (security, audit)
.claude/rules/               → Altijd geladen constraints
.claude/hooks/               → Pre/post-edit hooks
src/lib/*/CLAUDE.md          → Laag-specifieke regels per directory
```

## Privacy

- Lokale modus: geen data verlaat de machine
- API-modus: alleen EU-servers (AssemblyAI Dublin, Mistral EU)
- Transcriptie-inhoud wordt nooit gelogd of naar analytics gestuurd
- GDPR en EU AI Act compliant

## Commando's

```bash
npm run dev          # Frontend dev server
npm run build        # Production build
npm run check        # TypeScript check
npm run test:run     # Vitest tests
npm run transcribe   # Volledige stack (Ollama + backend + frontend)
```
