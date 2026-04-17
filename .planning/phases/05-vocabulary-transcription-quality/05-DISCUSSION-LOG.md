# Phase 5: Vocabulary & Transcription Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 05-vocabulary-transcription-quality
**Areas discussed:** Word boost uitbreiding, Uitspraakvarianten, Hallucination handling, Profielaudit aanpak

---

## Word Boost Uitbreiding

| Option                  | Description                                                                                                 | Selected |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Handmatig cureren       | Gebruiker levert woordlijsten aan, of bestaande Limburgse bronnen. Hoogste kwaliteit maar arbeidsintensief. |          |
| AI-gegenereerd + review | LLM genereert kandidaat-woorden, gebruiker reviewt. Sneller, redelijke kwaliteit.                           |          |
| Claude mag beslissen    | Claude kiest beste aanpak op basis van beschikbaarheid en haalbaarheid.                                     | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

| Option                           | Description                                                                                   | Selected |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Strikt per regio                 | Elk profiel ALLEEN woorden uit die regio. Geen overlap tenzij echt in beide regio's gebruikt. |          |
| Gedeelde basis + regio-specifiek | Gemeenschappelijke Limburgse kern + regio-specifieke toevoegingen. Simpeler.                  |          |
| Claude mag beslissen             | Claude kiest structuur op basis van AssemblyAI best practices.                                | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

---

## Uitspraakvarianten

| Option                     | Description                                                                            | Selected |
| -------------------------- | -------------------------------------------------------------------------------------- | -------- |
| custom_spelling uitbreiden | Bestaande AssemblyAI custom_spelling dict uitbreiden. Al in codebase, past in patroon. |          |
| Aparte pronunciation map   | Nieuw databestand met reverse mapping per regio. Meer flexibel maar nieuw patroon.     |          |
| Claude mag beslissen       | Claude kiest structuur die het beste past bij AssemblyAI API en bestaande code.        | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

---

## Hallucination Handling

| Option                  | Description                                                                       | Selected |
| ----------------------- | --------------------------------------------------------------------------------- | -------- |
| Stilletjes strippen     | Herhalingen en onzin automatisch verwijderen. Gebruiker ziet alleen schone tekst. |          |
| Markeren voor gebruiker | Gedetecteerde hallucinaties visueel gemarkeerd. Gebruiker beslist zelf.           |          |
| Claude mag beslissen    | Claude kiest beste UX op basis van hallucinatietype.                              | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

| Option                | Description                                                                          | Selected |
| --------------------- | ------------------------------------------------------------------------------------ | -------- |
| Backend (Python)      | Detectie in FastAPI backend na Whisper-output. Past bij bestaand patroon.            |          |
| Frontend (TypeScript) | Detectie in browser na ontvangst transcriptie. Meer flexibel maar dupliceert logica. |          |
| Claude mag beslissen  | Claude kiest op basis van architectuurpatronen.                                      | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

---

## Profielaudit Aanpak

| Option                  | Description                                                                            | Selected |
| ----------------------- | -------------------------------------------------------------------------------------- | -------- |
| Alle 5 volledig         | Elk profiel naar 50-100 woorden, volledige custom_spelling, gevalideerde style_prompt. |          |
| Focus op meestgebruikte | Limburgs + Mestreechs als primaire focus, andere 3 basis-uitbreiding.                  |          |
| Claude mag beslissen    | Claude kiest prioritering op basis van gebruikspatronen en haalbaarheid.               | ✓        |

**User's choice:** Claude mag beslissen
**Notes:** —

---

## Claude's Discretion

All 4 areas were delegated to Claude's discretion. User trusts technical best practices and existing architecture patterns.

## Deferred Ideas

None — discussion stayed within phase scope
