# Requirements: BABL

**Defined:** 2026-03-23
**Core Value:** Betrouwbare spraak-naar-tekst met dialectcorrectie — de transcriptie moet kloppen en het proces mag niet stilzwijgend falen.

## v1.0 Requirements (Stability) — Complete

All 18 requirements completed. See MILESTONES.md for details.

### WebSocket Streaming (WS)

- [x] **WS-01**: WebSocket herstelt automatisch bij backend disconnect (max 5 pogingen, exponential backoff met jitter)
- [x] **WS-02**: Gebruiker ziet foutmelding als WebSocket niet kan herstellen ("Verbinding verloren")
- [x] **WS-03**: Backend stuurt heartbeat (ping/pong elke 15s) en detecteert dode verbindingen (timeout 30s)
- [x] **WS-04**: Bij reconnect start een nieuwe AssemblyAI sessie (geen session resume)
- [x] **WS-05**: Frontend detecteert stalled stream (geen data 30s) en toont timeout fout

### Offset Filtering (OF)

- [x] **OF-01**: Segmenten die de offset boundary overspannen worden niet gedropped (tolerance window 0.5s)
- [x] **OF-02**: Filter gebruikt `end > offset - tolerance` in plaats van `start >= offset`
- [x] **OF-03**: Frontend dedupliceert mogelijke herhaalde woorden aan boundaries

### Rate Limiting (RL)

- [x] **RL-01**: Backend parsed Retry-After header bij Mistral 429 responses
- [x] **RL-02**: Backend stuurt gestructureerde rate_limit error via SSE met retry_after waarde
- [x] **RL-03**: Frontend toont specifieke rate limit melding met countdown ("Probeer over X seconden")
- [x] **RL-04**: Retry logica gebruikt tenacity decorator i.p.v. custom loop (exponential backoff, max 5 pogingen)

### Resource Cleanup (RC)

- [x] **RC-01**: beforeunload handler stopt MediaRecorder, sluit AudioContext, stopt MediaStreamTracks
- [x] **RC-02**: Svelte $effect cleanup ruimt audio resources op bij component destroy
- [x] **RC-03**: WebSocket verbinding wordt gesloten bij page unload

### Error Handling (EH)

- [x] **EH-01**: Foutmeldingen zijn specifiek per type: rate_limit, timeout, upstream_disconnect, network_error
- [x] **EH-02**: Geen generieke "mislukt" meldingen — gebruiker ziet altijd wat er fout ging
- [x] **EH-03**: SSE stream timeout (30s geen data) toont foutmelding i.p.v. eindeloze spinner

## v2.0 Requirements (Dialect Quality) — Active

Requirements voor verbetering van Limburgse dialectherkenning en -correctie.

### Evaluatie & Meting (EVAL)

- [ ] **EVAL-01**: Gebruiker kan per sessie de WER/CER score zien voor de ruwe transcriptie
- [ ] **EVAL-02**: Gebruiker ziet per woord een confidence indicator bij onzekere herkenning (<0.7)
- [ ] **EVAL-03**: Systeem logt error-patronen (substitutie/deletie/insertie) per dialectregio

### Transcriptie Kwaliteit (TRANS)

- [ ] **TRANS-01**: Alle 5 dialectprofielen zijn geaudit en uitgebreid conform AssemblyAI word boost richtlijnen
- [ ] **TRANS-02**: Systeem ondersteunt meerdere uitspraak-varianten per woord per regio
- [ ] **TRANS-03**: Whisper hallucinaties (herhalingen, onzin-output) worden gedetecteerd en gefilterd

### Correctie Consistentie (CORR)

- [ ] **CORR-01**: Correctie-prompts bevatten 3-5 few-shot voorbeelden per dialectregio
- [ ] **CORR-02**: LLM output volgt een vast JSON schema met origineel, correctie, en confidence
- [ ] **CORR-03**: Dialect-naar-standaard glossary (50-100+ termen) wordt in de prompt geïnjecteerd

### Feedback & Iteratie (FEED)

- [ ] **FEED-01**: Gebruiker kan correcties terugsturen (opt-in) die de glossary en word boost voeden
- [ ] **FEED-02**: Prompt templates zijn versioned en kunnen A/B getest worden op kwaliteit
- [ ] **FEED-03**: Tekst-chunks overlappen (50-100 woorden) zodat context behouden blijft bij lange transcripties

## Future Requirements

Uitgesteld naar volgende milestone.

### Quality Improvements (from v1.0)

- **QI-01**: Duplicate tekst deduplicatie via Levenshtein matching (>0.85 threshold)
- **QI-02**: Schema validatie voor API responses (detect malformed 200 OK)
- **QI-03**: Audio quality presets (8kHz/16kHz/24kHz)

### Refactoring (from v1.0)

- **RF-01**: +page.svelte opsplitsen in kleinere componenten
- **RF-02**: System prompts centraliseren (niet dupliceren in backend + frontend)
- **RF-03**: Structured logging (backend + frontend)

### Testing (from v1.0)

- **TS-01**: E2E tests voor recording + transcriptie + correctie flow
- **TS-02**: Integration tests voor SSE streaming endpoints
- **TS-03**: Tests voor dialect accuracy per regio

## Out of Scope

| Feature                       | Reden                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| Custom ASR model training     | Vereist honderden uren gelabelde audio — niet haalbaar               |
| Real-time LLM correctie       | Twee-staps flow (transcribe → correct) geeft betere UX               |
| Multi-model ensemble ASR      | AssemblyAI Universal-3 is voldoende, ensemble voegt complexiteit toe |
| Inline transcript editing     | Later milestone                                                      |
| Batch/bulk upload             | Later milestone                                                      |
| Mobile app                    | Web-first                                                            |
| +page.svelte refactoring      | Bewust uitgesteld                                                    |
| Voice biometrics              | Privacy risico, buiten scope                                         |
| Automatic retraining pipeline | Over-engineering voor huidige schaal                                 |

## Traceability

### v1.0 (Complete)

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| WS-01..05   | Phase 1 | Complete |
| OF-01..03   | Phase 1 | Complete |
| RL-01..04   | Phase 2 | Complete |
| RC-01..03   | Phase 3 | Complete |
| EH-01..03   | Phase 2 | Complete |

### v2.0 (Active)

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| EVAL-01     | TBD   | Pending |
| EVAL-02     | TBD   | Pending |
| EVAL-03     | TBD   | Pending |
| TRANS-01    | TBD   | Pending |
| TRANS-02    | TBD   | Pending |
| TRANS-03    | TBD   | Pending |
| CORR-01     | TBD   | Pending |
| CORR-02     | TBD   | Pending |
| CORR-03     | TBD   | Pending |
| FEED-01     | TBD   | Pending |
| FEED-02     | TBD   | Pending |
| FEED-03     | TBD   | Pending |

**Coverage:**

- v2.0 requirements: 12 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 12

---

_Requirements defined: 2026-03-23_
_Last updated: 2026-03-28 — v2.0 Dialect Quality requirements added_
