# Components — UI

- Svelte 5 syntax: `$props()`, `$state()`, `$derived()`, `$effect()` — nooit `export let` of `$:`
- Alle app-state via `getTranscribeState()` uit `$lib/stores/transcribe.svelte` — componenten zijn presentationeel
- Lokale `$state` alleen voor pure UI-toggles (bijv. `downloading`), nooit voor app-data
- Analytics via `$lib/utils/analytics.ts`, nooit direct PostHog
- Layout: `min-h-svh px-5 md:px-8`, container `max-w-sm md:max-w-2xl mx-auto`
- Animaties: `svelte/transition` (fly, fade) — `prefers-reduced-motion` wordt globaal afgehandeld in `src/app.css`
- Responsive: mobile-first, `md:` breakpoint voor desktop
- `npm run check` na wijziging
