# Roadmap: BABL

## Milestones

- ✅ **v1.0 Stability** - Phases 1-3 (shipped 2026-03-28)
- ✅ **v2.0 Dialect Quality** - Phases 4-7 (shipped 2026-04-18)

## Phases

<details>
<summary>✅ v1.0 Stability (Phases 1-3) - SHIPPED 2026-03-28</summary>

### Phase 1: WebSocket + Offset Filtering Stability

**Goal**: Gebruiker kan een opname van 30-60 minuten voltooien via live transcriptie zonder stille failures of tekstverlies
**Depends on**: Nothing (first phase)
**Requirements**: WS-01, WS-02, WS-03, WS-04, WS-05, OF-01, OF-02, OF-03, EH-03
**Success Criteria** (what must be TRUE):

1. WebSocket herstelt automatisch na backend disconnect (tot 5x) zonder dat de gebruiker iets hoeft te doen
2. Gebruiker ziet "Verbinding verloren" melding als WebSocket niet meer kan herstellen na 5 pogingen
3. Backend detecteert dode verbindingen via heartbeat (ping/pong 15s, timeout 30s) en ruimt sessies op
4. Tekst aan offset boundaries wordt niet meer gedropped -- woorden die de boundary overspannen blijven behouden
5. SSE stream die 30 seconden geen data ontvangt toont een timeout foutmelding in plaats van eindeloze spinner
   **Plans**: 3 plans

Plans:

- [x] 01-00-PLAN.md -- Wave 0: Test scaffolding for offset filter, heartbeat, and dedup
- [x] 01-01-PLAN.md -- WebSocket reconnection + heartbeat + reconnect UI
- [x] 01-02-PLAN.md -- Offset filtering tolerance + deduplication + SSE timeout

### Phase 2: Rate Limiting + Error Handling

**Goal**: Gebruiker krijgt altijd een duidelijke, specifieke foutmelding met handelingsperspectief bij API fouten
**Depends on**: Phase 1
**Requirements**: RL-01, RL-02, RL-03, RL-04, EH-01, EH-02
**Success Criteria** (what must be TRUE):

1. Bij Mistral 429 response ziet gebruiker "Overbelast. Probeer over X seconden" met live countdown
2. Foutmeldingen zijn specifiek per type (rate_limit, timeout, upstream_disconnect, network_error) -- nooit generiek "mislukt"
3. Backend retry logica gebruikt tenacity met exponential backoff + jitter in plaats van custom loops
4. Elke foutmelding geeft de gebruiker handelingsperspectief (wat te doen, hoe lang te wachten)
   **Plans**: 2 plans

Plans:

- [x] 02-01-PLAN.md -- Rate limit parsing + tenacity retry + structured SSE errors
- [x] 02-02-PLAN.md -- Error taxonomy + countdown UI + user-facing messages

### Phase 3: Resource Cleanup

**Goal**: Audio resources (microfoon, AudioContext, WebSocket) worden correct opgeruimd bij elke exit path
**Depends on**: Phase 1 (WebSocket close hangt af van WebSocket implementatie uit Phase 1)
**Requirements**: RC-01, RC-02, RC-03
**Success Criteria** (what must be TRUE):

1. Bij sluiten van de tab stopt de microfoon (LED gaat uit), sluit AudioContext, en stoppen alle MediaStreamTracks
2. Bij component destroy via Svelte $effect cleanup worden dezelfde resources opgeruimd als bij page unload
3. WebSocket verbinding wordt netjes gesloten (close frame) bij page unload
   **Plans**: 2 plans

Plans:

- [x] 03-00-PLAN.md -- Wave 0: Test scaffolding + stub cleanup module
- [x] 03-01-PLAN.md -- Resource cleanup: implement cleanup logic, beforeunload/pagehide handlers, $effect cleanup, AbortController integration

</details>

### ✅ v2.0 Dialect Quality (Shipped 2026-04-18)

**Milestone Goal:** De Limburgse dialectherkenning en -correctie verbeteren zodat de betekenis/context van het gesprek altijd klopt in de output.

- [x] **Phase 4: Evaluation Infrastructure** - WER/CER meting en error pattern logging
- [x] **Phase 5: Vocabulary & Transcription** - Dialect profile audit en hallucination detection
- [x] **Phase 6: LLM Correction Consistency** - Few-shot prompts en structured JSON output
- [x] **Phase 7: Feedback & Iteration** - User corrections en prompt versioning

## Phase Details

### Phase 4: Evaluation Infrastructure

**Goal**: Measure current dialect quality with WER/CER and semantic similarity metrics
**Depends on**: Phase 3
**Requirements**: EVAL-01, EVAL-02, EVAL-03
**Success Criteria** (what must be TRUE):

1. Gebruiker ziet WER/CER score per transcriptiesessie
2. Onzekere woorden (confidence <0.7) zijn visueel gemarkeerd in de output
3. Backend logt error patronen (substitutie/deletie/insertie) per dialectregio
4. Evaluation data wordt opgeslagen als JSONL voor analyse
5. Quality feedback UI toont thumbs up/down en inline correcties
   **Plans**: 3 plans

Plans:

- [x] 04-00-PLAN.md -- Wave 0: Test scaffolding + evaluation module stubs + jiwer dependency
- [x] 04-01-PLAN.md -- Backend evaluation: metrics implementation, error patterns, JSONL logger, FastAPI endpoints
- [x] 04-02-PLAN.md -- Frontend: confidence highlighting, evaluation score display, feedback widget

### Phase 5: Vocabulary & Transcription Quality

**Goal**: Improve Whisper transcription accuracy via vocabulary optimization and hallucination prevention
**Depends on**: Phase 4
**Requirements**: TRANS-01, TRANS-02, TRANS-03
**Success Criteria** (what must be TRUE):

1. Alle 5 dialectprofielen zijn geaudit en uitgebreid conform AssemblyAI best practices
2. Systeem ondersteunt meerdere uitspraak-varianten per woord (multi-pronunciation lexicon)
3. Whisper hallucinaties (repetitive phrases, nonsense) worden automatisch gedetecteerd
4. Vocabulary boost lijsten bevatten 50-100 hoogwaardige termen per regio
   **Plans**: 3 plans

Plans:

- [x] 05-00-PLAN.md -- Wave 0: Test scaffolding for dialect profiles and hallucination detection
- [x] 05-01-PLAN.md -- Dialect profile audit: expand all 5 profiles to 50-100 word_boost + multi-pronunciation
- [x] 05-02-PLAN.md -- Hallucination detection: repetition + phantom blocklist + pipeline integration

### Phase 6: LLM Correction Consistency

**Goal**: Make dialect-to-Dutch correction predictable and structured
**Depends on**: Phase 4
**Requirements**: CORR-01, CORR-02, CORR-03
**Success Criteria** (what must be TRUE):

1. Correctie-prompts bevatten 3-5 few-shot voorbeelden per dialectregio
2. LLM output volgt een vast JSON schema (origineel, correctie, confidence, toegepaste regels)
3. Dialect-naar-standaard glossary (50-100+ termen) wordt in de prompt geïnjecteerd
4. Structured outputs via prompt-based JSON + Pydantic validation verminderen LLM non-determinisme
   **Plans**: 3 plans

Plans:

- [x] 06-00-PLAN.md -- Wave 0: Test scaffolding + CorrectionOutput Pydantic model + parser
- [x] 06-01-PLAN.md -- Few-shot examples + glossaries + prompt builder (CORR-01, CORR-03)
- [x] 06-02-PLAN.md -- Wire prompts + JSON validation into backend + frontend endpoints (CORR-02)

### Phase 7: Feedback & Iteration

**Goal**: Close the loop with user feedback and data-driven prompt improvements
**Depends on**: Phase 4, Phase 5, Phase 6
**Requirements**: FEED-01, FEED-02, FEED-03
**Success Criteria** (what must be TRUE):

1. Gebruiker kan correcties terugsturen (opt-in) via feedback UI
2. Feedback voedt glossary en word boost lijsten voor iteratieve verbetering
3. Prompt templates zijn versioned en kunnen A/B getest worden op kwaliteit
4. Tekst-chunks overlappen (50-100 woorden) zodat context behouden blijft
5. Productie WER metrics worden gemonitord voor regressie detectie
   **Plans**: 3 plans

Plans:

- [x] 07-00-PLAN.md -- Wave 0: Test scaffolding for chunk overlap, prompt versioning, user corrections
- [x] 07-01-PLAN.md -- Chunk overlap for context preservation (FEED-03) + Prompt versioning + WER monitoring (FEED-02)
- [x] 07-02-PLAN.md -- User correction endpoints + glossary suggestion pipeline (FEED-01)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase                                     | Milestone | Plans Complete | Status   | Completed  |
| ----------------------------------------- | --------- | -------------- | -------- | ---------- |
| 1. WebSocket + Offset Filtering Stability | v1.0      | 3/3            | Complete | 2026-03-23 |
| 2. Rate Limiting + Error Handling         | v1.0      | 2/2            | Complete | 2026-03-24 |
| 3. Resource Cleanup                       | v1.0      | 2/2            | Complete | 2026-03-28 |
| 4. Evaluation Infrastructure              | v2.0      | 3/3            | Complete | 2026-04-17 |
| 5. Vocabulary & Transcription Quality     | v2.0      | 3/3            | Complete | 2026-04-18 |
| 6. LLM Correction Consistency             | v2.0      | 3/3            | Complete | 2026-04-18 |
| 7. Feedback & Iteration                   | v2.0      | 3/3            | Complete | 2026-04-18 |
