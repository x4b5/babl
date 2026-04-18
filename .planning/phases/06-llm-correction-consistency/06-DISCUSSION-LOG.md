# Phase 6: LLM Correction Consistency - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 06-llm-correction-consistency
**Areas discussed:** Few-shot voorbeelden, JSON output schema, Glossary uitbreiding, Prompt deduplicatie

---

## Few-shot voorbeelden

| Option               | Description                                                                              | Selected |
| -------------------- | ---------------------------------------------------------------------------------------- | -------- |
| Regio-specifiek      | 3-5 unieke dialect→Nederlands voorbeelden per regio. Meer tokens maar betere herkenning. | ✓        |
| 1 generiek + 2 regio | 1 gedeeld voorbeeld + 2 regio-specifieke. Minder tokens.                                 |          |
| Je beslist           | Claude kiest aanpak.                                                                     |          |

**User's choice:** Regio-specifiek
**Notes:** Elke regio krijgt eigen voorbeelden die aansluiten bij het dialect (Franse invloeden voor Mestreechs, Duitse voor Kirchröadsj).

| Option                          | Description                                                   | Selected |
| ------------------------------- | ------------------------------------------------------------- | -------- |
| Zelfde input, aangepaste output | Dezelfde dialect-inputzinnen met output aangepast aan lengte. |          |
| Volledig apart per lengte       | Andere voorbeelden per prompt-lengte.                         |          |
| Je beslist                      | Claude kiest.                                                 | ✓        |

**User's choice:** Je beslist
**Notes:** Claude bepaalt of voorbeelden per lengte variëren.

| Option         | Description                             | Selected |
| -------------- | --------------------------------------- | -------- |
| In dialects.py | Voorbeelden bij REGIONAL_PROFILES dict. | ✓        |
| Apart bestand  | Nieuw bestand voor voorbeelden.         |          |
| Je beslist     | Claude kiest structuur.                 |          |

**User's choice:** In dialects.py
**Notes:** Consistent met eerdere Phase 5 aanpak.

---

## JSON output schema

| Option             | Description                                             | Selected |
| ------------------ | ------------------------------------------------------- | -------- |
| Prompt-only JSON   | Via prompt JSON laten outputten. Geen extra dependency. | ✓        |
| Instructor library | Python instructor forceert JSON via function calling.   |          |
| Hybride            | Prompt-based + instructor fallback.                     |          |
| Je beslist         | Claude kiest.                                           |          |

**User's choice:** Prompt-only JSON
**Notes:** Past bij bestaande streaming architectuur, geen nieuwe dependency.

| Option                       | Description                                      | Selected |
| ---------------------------- | ------------------------------------------------ | -------- |
| Alle 4 velden                | original, correction, confidence, applied_rules. |          |
| Alleen origineel + correctie | Simpeler schema.                                 |          |
| Je beslist                   | Claude bepaalt welke velden betrouwbaar zijn.    | ✓        |

**User's choice:** Je beslist
**Notes:** Claude bepaalt welke velden realistisch betrouwbaar van LLM te krijgen zijn.

| Option             | Description                                       | Selected |
| ------------------ | ------------------------------------------------- | -------- |
| Streaming behouden | JSON tokens streamen, frontend buffert en parst.  |          |
| Batch response OK  | Gebruiker wacht, krijgt gestructureerd resultaat. |          |
| Je beslist         | Claude kiest op basis van UX impact.              | ✓        |

**User's choice:** Je beslist
**Notes:** Claude weegt UX impact vs implementatiecomplexiteit.

---

## Glossary uitbreiding

| Option                 | Description                                           | Selected |
| ---------------------- | ----------------------------------------------------- | -------- |
| In dialects.py         | Uitbreiding van translation_key in REGIONAL_PROFILES. | ✓        |
| Apart glossary bestand | Nieuw bestand voor 50-100+ termen.                    |          |
| Je beslist             | Claude kiest.                                         |          |

**User's choice:** In dialects.py
**Notes:** Consistent met Phase 5 aanpak (word_boost ook in dialects.py).

| Option                   | Description                                     | Selected |
| ------------------------ | ----------------------------------------------- | -------- |
| Gestructureerde tabel    | key=value lijst (huidige formaat maar langer).  |          |
| Als system prompt sectie | Aparte 'WOORDENLIJST:' sectie in system prompt. |          |
| Je beslist               | Claude kiest formaat.                           | ✓        |

**User's choice:** Je beslist
**Notes:** Claude kiest het formaat dat het LLM het beste begrijpt.

---

## Prompt deduplicatie

| Option                    | Description                                                 | Selected |
| ------------------------- | ----------------------------------------------------------- | -------- |
| Backend als single source | Alle prompts in backend/main.py. Frontend haalt op via API. |          |
| Gedeeld config bestand    | Prompts in apart bestand, beide paden importeren.           |          |
| Apart houden              | Duplicatie accepteren, handmatig syncen.                    |          |
| Je beslist                | Claude kiest op basis van architectuur en deployment.       | ✓        |

**User's choice:** Je beslist
**Notes:** Claude kiest centralisatie-strategie.

| Option               | Description                                         | Selected |
| -------------------- | --------------------------------------------------- | -------- |
| Beide paden behouden | Frontend houdt Mistral-pad, backend Ollama+Mistral. |          |
| Alleen backend       | Frontend stuurt alles via backend.                  |          |
| Je beslist           | Claude kiest op basis van deployment requirements.  | ✓        |

**User's choice:** Je beslist
**Notes:** Claude weegt Vercel deployment requirements.

## Claude's Discretion

- Prompt-lengte variatie (D-03)
- JSON velden selectie (D-05)
- Streaming UX beslissing (D-06)
- Glossary injectie formaat (D-08)
- Centralisatie-strategie (D-09)
- Pad-consolidatie (D-10)

## Deferred Ideas

- RF-02 (system prompts centraliseren) — volledige refactoring uitgesteld, maar overlap met Phase 6 prompt deduplicatie wordt meegenomen
