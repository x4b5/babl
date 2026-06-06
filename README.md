# SvelteKit + Agentic Template

Een herbruikbare template voor SvelteKit 5 applicaties met een agentic-friendly repo-architectuur, ontworpen voor samenwerking met AI coding agents.

## Quickstart

```bash
# 1. Kopieer deze template
cp -r sveltekit-agentic-template/ my-new-app/
cd my-new-app

# 2. Pas de naam aan in package.json
# 3. Installeer dependencies
npm install

# 4. Start de dev server
npm run dev
```

## Wat zit erin?

### Techstack

- **SvelteKit 5** + **Svelte 5 runes** (`$state`, `$derived`, `$effect`)
- **TypeScript strict mode**
- **Tailwind CSS 4** (via Vite plugin)
- **PostHog analytics** (EU, privacy-first)
- **Vercel deployment** (adapter-vercel)
- **Vitest** voor tests

### Agentic Architectuur

```
CLAUDE.md                    → Root kompas: doel, techstack, werkregels
.claude/skills/              → Task-specifieke instructies per taaktype
.claude/hooks/README.md      → Pre/post-edit hook configuratie
.claude/settings.local.json  → Permission allowlist
src/lib/*/CLAUDE.md          → Laag-specifieke regels per directory
docs/                        → Architectuur, ADRs, analytics plan
```

### Source Structuur

```
src/lib/engine/     → Pure functies (geen side effects)
src/lib/stores/     → Single source of truth (Svelte 5 runes)
src/lib/data/       → Statische data (beschermd)
src/lib/components/ → UI-componenten
src/lib/utils/      → Analytics wrapper, a11y helpers
src/routes/         → Layout + phase router
```

## Aanpassen

1. Zoek en vervang `[APP_NAME]` en `[APP_DESCRIPTION]` in alle bestanden
2. Vul `CLAUDE.md` aan met je projectspecifieke regels
3. Definieer je fase-flow in `src/lib/stores/game.svelte.ts`
4. Voeg je PostHog key toe in `.env` (kopieer `.env.example`)
5. Vul `docs/` aan met je architectuur en analytics plan

## Commando's

```bash
npm run dev          # Development server
npm run build        # Production build
npm run check        # TypeScript check
npm run test:run     # Vitest tests
```
