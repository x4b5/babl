# Requirements: BABL Stability Milestone

**Defined:** 2026-03-23
**Core Value:** Betrouwbare spraak-naar-tekst met dialectcorrectie — de transcriptie moet kloppen en het proces mag niet stilzwijgend falen.

## v1 Requirements

Requirements voor stabiliteit. Elke requirement mapt naar een roadmap phase.

### WebSocket Streaming (WS)

- [ ] **WS-01**: WebSocket herstelt automatisch bij backend disconnect (max 5 pogingen, exponential backoff met jitter)
- [ ] **WS-02**: Gebruiker ziet foutmelding als WebSocket niet kan herstellen ("Verbinding verloren")
- [x] **WS-03**: Backend stuurt heartbeat (ping/pong elke 15s) en detecteert dode verbindingen (timeout 30s)
- [ ] **WS-04**: Bij reconnect start een nieuwe AssemblyAI sessie (geen session resume)
- [ ] **WS-05**: Frontend detecteert stalled stream (geen data 30s) en toont timeout fout

### Offset Filtering (OF)

- [x] **OF-01**: Segmenten die de offset boundary overspannen worden niet gedropped (tolerance window 0.5s)
- [x] **OF-02**: Filter gebruikt `end > offset - tolerance` in plaats van `start >= offset`
- [x] **OF-03**: Frontend dedupliceert mogelijke herhaalde woorden aan boundaries

### Rate Limiting (RL)

- [ ] **RL-01**: Backend parsed Retry-After header bij Mistral 429 responses
- [ ] **RL-02**: Backend stuurt gestructureerde rate_limit error via SSE met retry_after waarde
- [ ] **RL-03**: Frontend toont specifieke rate limit melding met countdown ("Probeer over X seconden")
- [ ] **RL-04**: Retry logica gebruikt tenacity decorator i.p.v. custom loop (exponential backoff, max 5 pogingen)

### Resource Cleanup (RC)

- [ ] **RC-01**: beforeunload handler stopt MediaRecorder, sluit AudioContext, stopt MediaStreamTracks
- [ ] **RC-02**: Svelte $effect cleanup ruimt audio resources op bij component destroy
- [ ] **RC-03**: WebSocket verbinding wordt gesloten bij page unload

### Error Handling (EH)

- [ ] **EH-01**: Foutmeldingen zijn specifiek per type: rate_limit, timeout, upstream_disconnect, network_error
- [ ] **EH-02**: Geen generieke "mislukt" meldingen — gebruiker ziet altijd wat er fout ging
- [ ] **EH-03**: SSE stream timeout (30s geen data) toont foutmelding i.p.v. eindeloze spinner

## v2 Requirements

Uitgesteld naar volgende milestone. Niet in huidige roadmap.

### Quality Improvements

- **QI-01**: Duplicate tekst deduplicatie via Levenshtein matching (>0.85 threshold)
- **QI-02**: Schema validatie voor API responses (detect malformed 200 OK)
- **QI-03**: Audio quality presets (8kHz/16kHz/24kHz)

### Refactoring

- **RF-01**: +page.svelte opsplitsen in kleinere componenten
- **RF-02**: System prompts centraliseren (niet dupliceren in backend + frontend)
- **RF-03**: Structured logging (backend + frontend)

### Testing

- **TS-01**: E2E tests voor recording + transcriptie + correctie flow
- **TS-02**: Integration tests voor SSE streaming endpoints
- **TS-03**: Tests voor dialect accuracy per regio

## Out of Scope

| Feature                          | Reden                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| Inline transcript editing        | Later milestone                                                |
| Batch/bulk upload                | Later milestone                                                |
| Mobile app                       | Web-first                                                      |
| SSE auto-reconnect (EventSource) | Scope creep — huidige manual approach is voldoende met timeout |
| AssemblyAI session resume        | Te complex — nieuwe sessie bij reconnect is acceptabel         |
| Redis rate limiting backend      | Overkill voor single-user — in-memory voldoende                |
| +page.svelte refactoring         | Bewust uitgesteld — stabiliteit eerst                          |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| WS-01       | Phase 1 | Pending |
| WS-02       | Phase 1 | Pending |
| WS-03       | Phase 1 | Complete |
| WS-04       | Phase 1 | Pending |
| WS-05       | Phase 1 | Pending |
| OF-01       | Phase 1 | Complete |
| OF-02       | Phase 1 | Complete |
| OF-03       | Phase 1 | Complete |
| RL-01       | Phase 2 | Pending |
| RL-02       | Phase 2 | Pending |
| RL-03       | Phase 2 | Pending |
| RL-04       | Phase 2 | Pending |
| RC-01       | Phase 3 | Pending |
| RC-02       | Phase 3 | Pending |
| RC-03       | Phase 3 | Pending |
| EH-01       | Phase 2 | Pending |
| EH-02       | Phase 2 | Pending |
| EH-03       | Phase 1 | Pending |

**Coverage:**

- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---

_Requirements defined: 2026-03-23_
_Last updated: 2026-03-23 after initial definition_
