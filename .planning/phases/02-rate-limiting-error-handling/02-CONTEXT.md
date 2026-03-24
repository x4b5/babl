# Phase 2: Rate Limiting + Error Handling - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Duidelijke, specifieke foutmeldingen met handelingsperspectief bij alle API fouten. Dit omvat: Retry-After header parsing bij Mistral 429 responses, gestructureerde error SSE events vanuit backend, error taxonomy met 4 types (rate_limit, timeout, upstream_disconnect, network_error), live countdown timer bij rate limits, tenacity retry decorator vervangt custom retry loops, en visueel onderscheid tussen retry-bare en fatale fouten.

</domain>

<decisions>
## Implementation Decisions

### Rate Limit UX

- **D-01:** Inline error display — countdown verschijnt in het bestaande `error` element, geen nieuwe UI-componenten. Melding: "Overbelast. Wacht Xs..." met live aftelling (elke seconde update).
- **D-02:** Live countdown telt elke seconde af. Verdwijnt automatisch als timer op 0 staat.
- **D-03:** Auto-retry na countdown — correctie wordt automatisch opnieuw gestart zodra countdown afloopt. Gebruiker hoeft niks te doen.

### Error Taxonomy

- **D-04:** Universeel error systeem — zelfde error types en meldingen voor zowel transcriptie als correctie. Geldt voor alle API calls: AssemblyAI, Mistral, en lokale backend.
- **D-05:** Actiegericht zonder technische details — gebruiker ziet alleen wat te doen. Geen HTTP statuscodes, geen technische termen. Bijv. "Overbelast. Wacht 30s." niet "429 Too Many Requests".
- **D-06:** Visueel onderscheid tussen retry-bare fouten (amber/geel tint, "even geduld") en fatale fouten (rood, "actie vereist"). Beide inline in hetzelfde error element.

### Retry Transparantie

- **D-07:** Retries zijn onzichtbaar voor de gebruiker. Backend retry't op de achtergrond. Gebruiker ziet alleen de countdown als alle retries falen.
- **D-08:** Retry logica leeft alleen in backend (main.py met tenacity) en SvelteKit API routes (correct/+server.ts met tenacity-achtige logica). Frontend doet geen retries — als backend-respons een error is, toont frontend de foutmelding.

### Foutmelding Toon

- **D-09:** Kort en direct — "Overbelast. Wacht 30s." / "Geen internet." / "Backend niet bereikbaar." Geen "Helaas", "Sorry", of overbodige woorden.
- **D-10:** Consistent met Phase 1 beslissing: gebruiksvriendelijk Nederlands, geen technische termen (D-08/D-09 uit Phase 1).
- **D-11:** Alleen tekst, geen actieknoppen. Foutmelding beschrijft de actie in woorden. Past bij de bestaande minimale UI.

### Claude's Discretion

- Exacte error type mapping per backend endpoint (welke HTTP codes mappen naar welk error type)
- Tenacity decorator configuratie (max retries, backoff multiplier, jitter range)
- SSE error event JSON structuur (velden en formaat)
- Exacte amber/geel vs rood kleurtinten voor error severity (binnen bestaande design tokens)
- Of auto-retry na countdown oneindig herhaalt of na N pogingen definitief stopt

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Error handling code (huidige staat)

- `backend/main.py` — Custom retry loop bij Mistral 429 (regel 354-359), correctie streaming endpoint `/correct`
- `src/routes/api/correct/+server.ts` — SvelteKit Mistral correctie route met custom retry (regel 141-170), SSE streaming (regel 202-238)
- `src/routes/transcribe/+page.svelte` — Frontend error display (regel 15: `error` state, regel 919-972: correction error handling, regel 1388-1393: error UI)

### API routes (transcriptie)

- `src/routes/api/transcribe-api/+server.ts` — AssemblyAI submit endpoint
- `src/routes/api/transcribe-api/[id]/+server.ts` — AssemblyAI poll endpoint

### Project context

- `.planning/REQUIREMENTS.md` — Requirement IDs RL-01 t/m RL-04, EH-01, EH-02
- `.planning/ROADMAP.md` — Phase 2 success criteria en plan breakdown

### Codebase maps

- `.planning/codebase/CONVENTIONS.md` — Error handling patterns, styling patterns
- `.planning/codebase/INTEGRATIONS.md` — Mistral API, AssemblyAI API, rate limiting info
- `.planning/codebase/ARCHITECTURE.md` — Data flow en streaming response handling

### Phase 1 context (carrying forward)

- `.planning/phases/01-websocket-offset-filtering-stability/01-CONTEXT.md` — D-08 (Nederlandse foutmeldingen), D-09 (taal consistent)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `error` state variabele (`$state('')` in +page.svelte regel 15) — bestaand patroon voor foutmeldingen
- `glass` CSS class en error styling — bestaand visueel patroon voor foutweergave
- SSE parsing loop in `fetchCorrection()` — kan uitgebreid worden met error type parsing
- Bestaand `event.type === 'error'` handling in SSE streams — hoeft alleen gestructureerd te worden

### Established Patterns

- Error handling: try/catch met `error = 'User-friendly message'` toewijzing
- SSE streaming: `data: ${JSON.stringify(data)}` events met `type` veld (token, done, error)
- Backend retry: `for attempt in range(max_retries)` met exponential backoff `3 * 2^attempt`
- SvelteKit API routes fungeren als proxy naar externe APIs (Mistral, AssemblyAI)

### Integration Points

- Backend `/correct` endpoint (main.py) — moet gestructureerde error SSE events sturen met `error_type` en `retry_after`
- SvelteKit `/api/correct` route — moet Retry-After header parsen en doorsturen als SSE event
- Frontend `fetchCorrection()` — moet error events parsen, countdown tonen, en auto-retry triggeren
- Frontend `sendAudioAssemblyAI()` — moet zelfde error taxonomy gebruiken voor transcriptie fouten

</code_context>

<specifics>
## Specific Ideas

- ROADMAP specificeert `tenacity>=9.0.0` pip package voor backend retry logic
- Requirements specificeren: Retry-After header parsing (RL-01), gestructureerde SSE error events (RL-02), countdown UI (RL-03), tenacity vervangt custom loops (RL-04)
- 4 error types uit EH-01: rate_limit, timeout, upstream_disconnect, network_error
- Bestaande error meldingen in +page.svelte (regel 793, 921, 967) moeten vervangen worden door taxonomy-gebaseerde meldingen

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 02-rate-limiting-error-handling_
_Context gathered: 2026-03-24_
