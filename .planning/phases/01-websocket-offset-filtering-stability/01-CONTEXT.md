# Phase 1: WebSocket + Offset Filtering Stability - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Betrouwbare real-time streaming zonder stille failures of tekstverlies. Dit omvat: WebSocket reconnection met heartbeat, offset filtering bugfix zodat boundary-segmenten niet meer verloren gaan, en SSE timeout detectie. Gebruiker kan een opname van 30-60 minuten voltooien via live transcriptie.

</domain>

<decisions>
## Implementation Decisions

### Reconnection UX

- **D-01:** Inline banner boven de transcriptie-area toont reconnect-status: "Verbinding herstellen (poging 2/5)..." — past bij bestaande glassmorphism stijl
- **D-02:** Opname loopt door tijdens reconnect-pogingen, audio chunks worden gebufferd. Na reconnect gaat live transcriptie verder
- **D-03:** Na 5 gefaalde pogingen: foutmelding "Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen." Geeft gebruiker een fallback

### Data continuity

- **D-04:** Bestaande liveSegments blijven staan bij reconnect. Nieuwe AssemblyAI sessie voegt toe aan het einde. Mogelijke gap in tekst geaccepteerd, maar geen verlies van wat er al was
- **D-05:** Gebufferde audio tijdens reconnect-gap wordt NIET retroactief getranscribeerd. Gap wordt geaccepteerd — simpeler te implementeren, live streaming is near-real-time niet exact

### Deduplication strategy

- **D-06:** Timestamp-based deduplicatie: vergelijk segment timestamps, als een nieuw segment overlapt met het vorige (binnen 0.5s tolerance window), skip het overlappende deel
- **D-07:** Deduplicatie is onzichtbaar voor de gebruiker — geen visuele indicator, gewoon vloeiende tekst zonder duplicaten

### Error messaging tone

- **D-08:** Foutmeldingen zijn gebruiksvriendelijk Nederlands, geen technische termen. Bijv. "Verbinding even kwijt, we proberen het opnieuw", "Transcriptie duurt te lang — probeer een korter fragment"
- **D-09:** Taal is Nederlands, consistent met de rest van de UI

### Claude's Discretion

- Exacte reconnect-banner styling (kleur, animatie, positie binnen glassmorphism design)
- Heartbeat interval tuning (15s ping, 30s timeout zijn als vereiste gedefinieerd maar Claude mag fine-tunen)
- Exacte deduplicatie-algoritme implementatie (zolang timestamp-based)
- SSE timeout foutmelding exacte formulering (zolang gebruiksvriendelijk Nederlands)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### WebSocket streaming

- `backend/main.py` — WebSocket endpoint `/ws/transcribe-stream` (regel 699-803), offset filtering (regel 531-533)
- `src/routes/transcribe/+page.svelte` — WebSocket client `startRealtimeStream()` (regel 393-451), offset handling in `sendLiveChunk()` (regel 337-391)

### Project context

- `.planning/REQUIREMENTS.md` — Requirement IDs WS-01 t/m WS-05, OF-01 t/m OF-03, EH-03
- `.planning/ROADMAP.md` — Phase 1 success criteria en plan breakdown

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md` — Data flow en streaming response handling patterns
- `.planning/codebase/INTEGRATIONS.md` — AssemblyAI WebSocket API, rate limiting info
- `.planning/codebase/CONVENTIONS.md` — Error handling patterns, Svelte 5 runes, styling patterns

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `downsampleToWav()`, `encodeWav()`, `toPcmInt16()` — audio format conversie functies in +page.svelte
- `glass` CSS class en `--color-glass-*` variabelen — herbruikbaar voor reconnect-banner styling
- `error` state variabele (reactive) — bestaand patroon voor foutmeldingen in UI

### Established Patterns

- Error handling: try/catch met `error = 'User-friendly message'` patroon
- Streaming: SSE parsing via ReadableStream reader loop (gebruikt in `sendAudioLocal()` en `fetchCorrection()`)
- State management: alle state leeft als `$state` runes in +page.svelte component scope
- Logging: `console.log('[RT]', ...)` prefix patroon voor real-time gerelateerde logs

### Integration Points

- `streamSocket: WebSocket | undefined` — huidige WebSocket referentie, moet vervangen worden door reconnecting-websocket
- `liveSegments: string[]` — array waar bevestigde transcriptie-segmenten in leven, moet overleven bij reconnect
- `partialText: string` — work-in-progress tekst, wordt overschreven per partial event
- Backend `ws_transcribe_stream()` — moet heartbeat/ping-pong krijgen en dead connection cleanup
- `sendLiveChunk()` — offset filtering zit hier, moet tolerance window krijgen

</code_context>

<specifics>
## Specific Ideas

- Roadmap specificeert `reconnecting-websocket@4.4.0` npm package als drop-in replacement
- Requirements specificeren exacte waarden: 5 reconnect pogingen, 15s heartbeat, 30s timeout, 0.5s tolerance
- Fallback na failure: verwijzing naar bestandsupload als alternatief (bestaande functionaliteit)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-websocket-offset-filtering-stability_
_Context gathered: 2026-03-23_
