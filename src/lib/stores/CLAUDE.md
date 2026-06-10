# Stores — State Management

- `transcribe.svelte.ts` is de ENIGE bron van waarheid voor alle transcriptie-state
- Svelte 5 runes: `$state` voor muteerbaar, `$derived` voor berekend
- `getTranscribeState()` retourneert een reactive object met getters; mutaties via geëxporteerde setters
- App-flow (status): idle → recording → processing → polishing → idle
- Overige stores: `api-consent.svelte.ts` (API-toestemming), `consent.svelte.ts` (cookies), `setup-wizard.svelte.ts` (setup-flow), `theme.svelte.ts` (dark/light)
- Analytics calls zitten IN de store functies (niet in components)
- Nooit state dupliceren in components — gebruik de getters
- Na wijziging: `npm run check`
