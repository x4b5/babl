# BABL — Agent Kompas

## Doel

BABL is een privacy-first spraak-naar-tekst tool met Limburgse dialectcorrectie. Het neemt audio op via de microfoon (of bestandsupload), transcribeert met Whisper, en corrigeert Limburgs dialect naar standaard Nederlands via Ollama/Gemma3. Alles draait 100% lokaal — geen cloudverwerking, GDPR en EU AI Act compliant.

## Techstack

- SvelteKit 5 + Svelte 5 runes (`$state`, `$derived`, `$effect`) — geen legacy syntax
- TypeScript strict mode
- Tailwind CSS 4
- PostHog analytics (EU endpoint `eu.posthog.com`, `person_profiles: 'never'`)
- Vercel deployment via `@sveltejs/adapter-vercel` (alleen frontend)
- Vitest voor tests
- **Backend**: Python FastAPI + faster-whisper + Ollama (Gemma3)
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
backend/main.py          -> /health, /transcribe, /correct endpoints
scripts/                 -> start-transcribe.sh (full stack), log-hours.sh (tijdregistratie)
docs/                    -> Architectuur, ADRs, analytics-plan
.claude/skills/          -> Gedetailleerde instructies per taaktype
```

## Architectuur

### App Flow

```
idle → recording → processing (Whisper) → correcting (Ollama) → idle
                                              ↓
                                  toont ruwe tekst + gecorrigeerde tekst
```

### Backend Endpoints (FastAPI, poort 8000)

- `GET /health` — Health check
- `POST /transcribe` — Audio → Whisper → ruwe transcriptie + taaldetectie
- `POST /correct` — Ruwe tekst → Ollama/Gemma3 → gecorrigeerd Nederlands

### Kwaliteitsmodi

| Modus  | Whisper model | Ollama model |
| ------ | ------------- | ------------ |
| Light  | small         | gemma3:4b    |
| Medium | medium        | gemma3:12b   |

### Audio Processing

- Browser: MediaRecorder API + Web Audio API (waveform visualisatie)
- Downsampling naar 16kHz mono WAV voor Whisper
- Lange teksten worden gechunkt (max 400 woorden per chunk)
- Max 3 parallelle Ollama requests (semaphore)

## Werkregels

1. **Single source of truth**: Alle app-state leeft in `game.svelte.ts`. Nooit dupliceren in components.
2. **Svelte 5 only**: Gebruik `$props()`, `$state()`, `$derived()`, `$effect()`. Nooit `export let` of `$:`.
3. **Engine = pure functies**: Engine bestanden hebben geen side effects. Lees altijd alle engine files voor je er een wijzigt.
4. **Data is heilig**: Data bestanden NIET wijzigen zonder expliciete opdracht.
5. **Analytics via wrapper**: Altijd via `src/lib/utils/analytics.ts`, nooit direct PostHog. Try/catch verplicht.
6. **Privacy first**: Geen PII loggen. `person_profiles: 'never'`. Alle verwerking is lokaal.
7. **App flow**: idle → recording → processing → correcting → idle. Geen stappen overslaan.
8. **Backend is lokaal**: De FastAPI backend draait lokaal. CORS alleen voor `localhost:5173`. Geen remote API calls voor spraakverwerking.
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
