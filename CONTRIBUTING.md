# Contributing

## Snel starten

```bash
git clone <repo-url>
cd <projectnaam>
nvm use            # schakelt naar juiste Node-versie
npm install        # installeert dependencies + husky hooks
npm run dev        # start dev server op localhost:5173
```

## Workflow

1. Maak een branch vanaf `main`: `git checkout -b feature/mijn-feature`
2. Schrijf je code, volg de conventies in `CLAUDE.md`
3. Format en check: `npm run format && npm run check`
4. Commit — Husky draait automatisch formatting op je staged files
5. Push en open een PR naar `main`
6. CI draait automatisch: formatting, type check, tests, build

## Commando's

| Commando               | Wat het doet                        |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start development server            |
| `npm run build`        | Production build                    |
| `npm run check`        | TypeScript type check               |
| `npm run format`       | Format alle bestanden met Prettier  |
| `npm run format:check` | Check formatting zonder te wijzigen |
| `npm run test:run`     | Draai alle tests                    |
| `npm run start-day`    | Start urenregistratie voor vandaag  |

## Conventies

- **Svelte 5 runes only** — gebruik `$state()`, `$derived()`, `$props()`, nooit `export let` of `$:`
- **Services = side effects, utils = puur** — fetch/opname-logica in `src/lib/services/`, pure helpers in `src/lib/utils/`
- **Single source of truth** — app state leeft alleen in `src/lib/stores/transcribe.svelte.ts`
- **Analytics via wrapper** — altijd via `src/lib/utils/analytics.ts`, nooit direct PostHog

## Projectstructuur

```
src/lib/stores/      State management (Svelte 5 runes, transcribe.svelte.ts = bron van waarheid)
src/lib/services/    Opname, transcriptie, polijsten (side effects)
src/lib/components/  UI-componenten (presentationeel)
src/lib/utils/       Analytics wrapper, pure helpers
src/routes/          Pagina's, layouts en API routes
backend/             Python FastAPI (Whisper + Ollama)
```
