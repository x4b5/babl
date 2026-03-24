# Phase 3: Resource Cleanup - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Audio resources (microfoon, AudioContext, WebSocket) worden correct opgeruimd bij elke exit path: page unload, component destroy, en navigatie. Gebruiker krijgt bevestigingsdialoog bij vertrekken tijdens opname of verwerking. Actieve fetch/SSE requests worden geaborteerd bij vertrek.

</domain>

<decisions>
## Implementation Decisions

### Exit Confirmation

- **D-01:** Browser "Leave page?" bevestigingsdialoog tonen tijdens zowel recording als processing/correcting status. Voorkomt per ongeluk verlies van opname of verwerking.
- **D-02:** Geen dialoog bij idle status — gebruiker kan altijd vrij vertrekken als er niets actief is.

### Cleanup Scope

- **D-03:** Bij vertrek worden alle audio resources opgeruimd: MediaRecorder stop, AudioContext close, alle MediaStreamTracks stop (microfoon LED uit), WebSocket close frame.
- **D-04:** Actieve fetch/SSE requests worden geaborteerd via AbortController bij page unload. Backend krijgt direct signaal dat client weg is.
- **D-05:** `stream` variabele moet naar component-level scope verplaatst worden (momenteel lokaal in `startRecording()` closure) zodat beforeunload en $effect cleanup erbij kunnen.

### Error Messaging

- **D-06:** Consistent met Phase 1/2: Nederlandse foutmeldingen (D-08/D-09 Phase 1), alleen tekst geen actieknoppen (D-11 Phase 2).

### Claude's Discretion

- Exacte implementatie van AbortController pattern (single controller vs. per-request)
- Of `$effect` cleanup en `beforeunload` dezelfde functie aanroepen of aparte paths volgen
- Cleanup volgorde (welke resource eerst)
- Of `pagehide` event als fallback naast `beforeunload` nodig is (mobile browsers)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Resource cleanup code (huidige staat)

- `src/routes/transcribe/+page.svelte` — MediaRecorder setup in `startRecording()` (regel 534-687), `stream.getTracks()` cleanup in `mediaRecorder.onstop` (regel 570-571), `stopWaveform()` AudioContext close (regel 333-344), `stopRealtimeStream()` WebSocket close (regel 509-521)
- `src/routes/transcribe/+page.svelte` — Bestaande `$effect` cleanup patterns (regel 134-190): timer intervals, keyboard handler, countdown interval

### WebSocket (Phase 1 implementatie)

- `src/routes/transcribe/+page.svelte` — ReconnectingWebSocket import en `streamSocket` variabele (regel 2, 34), `startRealtimeStream()` (regel 424-506)

### Project context

- `.planning/REQUIREMENTS.md` — Requirement IDs RC-01, RC-02, RC-03
- `.planning/ROADMAP.md` — Phase 3 success criteria

### Codebase maps

- `.planning/codebase/ARCHITECTURE.md` — Data flow, streaming response handling, state management patterns
- `.planning/codebase/CONCERNS.md` — "Potential Audio Memory Leak on Browser Crashes" (bekend probleem dat deze phase oplost)

### Prior phase context

- `.planning/phases/01-websocket-offset-filtering-stability/01-CONTEXT.md` — D-08/D-09 (Nederlandse foutmeldingen)
- `.planning/phases/02-rate-limiting-error-handling/02-CONTEXT.md` — D-11 (alleen tekst, geen actieknoppen)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `stopWaveform()` (regel 333-344): Sluit AudioContext en reset analyser. Kan hergebruikt worden in cleanup.
- `stopRealtimeStream()` (regel 509-521): Sluit WebSocket en reset reconnect state. Kan hergebruikt worden in cleanup.
- `stopRecording()` (regel 690-695): Stopt MediaRecorder. Kan hergebruikt worden in cleanup.
- Bestaande `$effect` cleanup pattern met return functie (regel 144-146, 159-161, 180, 185-189)

### Established Patterns

- State management: alle state als `$state` runes in component scope (regel 7-50)
- Cleanup: `$effect(() => { return () => { /* cleanup */ }; })` voor timers en event listeners
- Resource references: `mediaRecorder`, `audioContext`, `streamSocket` als component-level `let` — maar `stream` (MediaStream) is lokaal in closure

### Integration Points

- `mediaRecorder.onstop` callback (regel 570-589): Huidige cleanup locatie — tracks stop, waveform stop, stream stop
- `startRecording()` (regel 534-687): Waar `stream = await navigator.mediaDevices.getUserMedia()` wordt aangemaakt
- Alle fetch calls in component: `sendAudioLocal()`, `sendAudioAssemblyAI()`, `fetchCorrection()` — moeten AbortController krijgen

</code_context>

<specifics>
## Specific Ideas

- CONCERNS.md documenteert exact dit probleem: "If browser crashes or page unloads during recording, MediaRecorder stream and AudioContext may not be properly closed, leaving microphone access active"
- Workaround uit CONCERNS.md: "Add beforeunload event listener to stop recording; ensure AudioContext.close() is called in cleanup"
- Requirements specificeren: beforeunload (RC-01), $effect cleanup (RC-02), WebSocket close (RC-03)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-resource-cleanup_
_Context gathered: 2026-03-24_
