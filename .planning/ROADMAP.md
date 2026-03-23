# Roadmap: BABL Stability v1

## Overview

BABL wordt dagelijks gebruikt maar lijdt onder drie kritieke stabiliteitsproblemen: stille WebSocket failures, tekstverlies bij offset filtering boundaries, en onduidelijke rate limit foutmeldingen. Dit milestone lost alle 18 stabiliteitseisen op in drie fasen: eerst streaming betrouwbaarheid (WebSocket + offset + SSE timeout), dan rate limiting en foutafhandeling, en tot slot resource cleanup. Na dit milestone kan een gebruiker 30-60 minuten opnemen zonder stille failures, onduidelijke fouten, of resource leaks.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: WebSocket + Offset Filtering Stability** - Betrouwbare real-time streaming zonder stille failures of tekstverlies
- [ ] **Phase 2: Rate Limiting + Error Handling** - Duidelijke foutmeldingen en robuuste retry logica voor API calls
- [ ] **Phase 3: Resource Cleanup** - Audio resources correct opruimen bij page unload en component destroy

## Phase Details

### Phase 1: WebSocket + Offset Filtering Stability

**Goal**: Gebruiker kan een opname van 30-60 minuten voltooien via live transcriptie zonder stille failures of tekstverlies
**Depends on**: Nothing (first phase)
**Requirements**: WS-01, WS-02, WS-03, WS-04, WS-05, OF-01, OF-02, OF-03, EH-03
**Key files**: `backend/main.py` (WebSocket endpoint, heartbeat, offset filtering), `src/routes/transcribe/+page.svelte` (WebSocket client, reconnection UI, stalled stream detection)
**Dependencies to install**: npm: `reconnecting-websocket@4.4.0` (drop-in WebSocket replacement met auto-reconnect). pip: `pytest`, `pytest-asyncio` (test infrastructure voor Wave 0).
**Complexity**: L (largest phase, 9 requirements, touches both backend and frontend WebSocket + filtering logic)
**Plans:** 3 plans
**Success Criteria** (what must be TRUE):

1. WebSocket herstelt automatisch na backend disconnect (tot 5x) zonder dat de gebruiker iets hoeft te doen
2. Gebruiker ziet "Verbinding verloren" melding als WebSocket niet meer kan herstellen na 5 pogingen
3. Backend detecteert dode verbindingen via heartbeat (ping/pong 15s, timeout 30s) en ruimt sessies op
4. Tekst aan offset boundaries wordt niet meer gedropped -- woorden die de boundary overspannen blijven behouden
5. SSE stream die 30 seconden geen data ontvangt toont een timeout foutmelding in plaats van eindeloze spinner

Plans:

- [x] 01-00-PLAN.md -- Wave 0: Test scaffolding for offset filter, heartbeat, and dedup (OF-01, OF-02, OF-03, WS-03)
- [x] 01-01-PLAN.md -- WebSocket reconnection + heartbeat + reconnect UI (WS-01, WS-02, WS-03, WS-04, WS-05)
- [ ] 01-02-PLAN.md -- Offset filtering tolerance + deduplication + SSE timeout (OF-01, OF-02, OF-03, EH-03)

### Phase 2: Rate Limiting + Error Handling

**Goal**: Gebruiker krijgt altijd een duidelijke, specifieke foutmelding met handelingsperspectief bij API fouten
**Depends on**: Phase 1
**Requirements**: RL-01, RL-02, RL-03, RL-04, EH-01, EH-02
**Key files**: `backend/main.py` (Retry-After parsing, tenacity decorator, structured error SSE events), `src/routes/transcribe/+page.svelte` (rate limit countdown UI, error taxonomy routing), `src/routes/api/` (SvelteKit API routes error handling)
**Dependencies to install**: pip: `tenacity>=9.0.0` (retry decorator met exponential backoff, vervangt custom retry loops)
**Complexity**: M (6 requirements, focused on error path through backend + frontend)
**Success Criteria** (what must be TRUE):

1. Bij Mistral 429 response ziet gebruiker "Overbelast. Probeer over X seconden" met live countdown
2. Foutmeldingen zijn specifiek per type (rate_limit, timeout, upstream_disconnect, network_error) -- nooit generiek "mislukt"
3. Backend retry logica gebruikt tenacity met exponential backoff + jitter in plaats van custom loops
4. Elke foutmelding geeft de gebruiker handelingsperspectief (wat te doen, hoe lang te wachten)
   **Plans**: TBD
   **UI hint**: yes

Plans:

- [ ] 02-01: Rate limit parsing + tenacity retry (RL-01, RL-02, RL-04)
- [ ] 02-02: Error taxonomy + user-facing messages (RL-03, EH-01, EH-02)

### Phase 3: Resource Cleanup

**Goal**: Audio resources (microfoon, AudioContext, WebSocket) worden correct opgeruimd bij elke exit path
**Depends on**: Phase 1 (WebSocket close hangt af van WebSocket implementatie uit Phase 1)
**Requirements**: RC-01, RC-02, RC-03
**Key files**: `src/routes/transcribe/+page.svelte` (beforeunload handler, $effect cleanup, WebSocket close)
**Dependencies to install**: Geen nieuwe packages (native browser APIs)
**Complexity**: S (3 requirements, frontend-only, well-understood browser APIs)
**Success Criteria** (what must be TRUE):

1. Bij sluiten van de tab stopt de microfoon (LED gaat uit), sluit AudioContext, en stoppen alle MediaStreamTracks
2. Bij component destroy via Svelte $effect cleanup worden dezelfde resources opgeruimd als bij page unload
3. WebSocket verbinding wordt netjes gesloten (close frame) bij page unload
   **Plans**: TBD

Plans:

- [ ] 03-01: beforeunload + $effect cleanup + WebSocket close (RC-01, RC-02, RC-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase                                     | Plans Complete | Status      | Completed |
| ----------------------------------------- | -------------- | ----------- | --------- |
| 1. WebSocket + Offset Filtering Stability | 0/3            | Not started | -         |
| 2. Rate Limiting + Error Handling         | 0/2            | Not started | -         |
| 3. Resource Cleanup                       | 0/1            | Not started | -         |
