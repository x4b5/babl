# Phase 2: Rate Limiting + Error Handling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 02-rate-limiting-error-handling
**Areas discussed:** Rate limit UX, Error taxonomy, Retry transparantie, Foutmelding toon

---

## Rate limit UX

| Option                     | Description                                                                                                                                                             | Selected |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Inline error (Recommended) | Vervang de bestaande error string met een countdown: 'Overbelast. Probeer over 28s...' — past in het bestaande error display patroon. Geen nieuwe UI-componenten nodig. | ✓        |
| Aparte countdown banner    | Een glassmorphism banner (zoals de reconnect-banner uit Phase 1) met een live aftel-animatie boven de tekst area.                                                       |          |
| Je beslist                 | Claude kiest de beste UX passend bij het bestaande design.                                                                                                              |          |

**User's choice:** Inline error
**Notes:** None

| Option                       | Description                                                                                                                 | Selected |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| Live countdown (Recommended) | Telt elke seconde af: '28s... 27s... 26s...' — gebruiker ziet exacte wachttijd. Verdwijnt automatisch als timer op 0 staat. | ✓        |
| Statisch bericht             | Toont eenmalig het aantal seconden. Gebruiker moet zelf bijhouden wanneer te proberen.                                      |          |

**User's choice:** Live countdown
**Notes:** None

| Option                   | Description                                                                                             | Selected |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | -------- |
| Auto-retry (Recommended) | Correctie wordt automatisch opnieuw gestart zodra de countdown afloopt. Gebruiker hoeft niks te doen.   | ✓        |
| Handmatige retry         | Na afloop verdwijnt de countdown en verschijnt een 'Opnieuw proberen' knop. Gebruiker behoudt controle. |          |
| Je beslist               | Claude kiest de beste aanpak.                                                                           |          |

**User's choice:** Auto-retry
**Notes:** None

---

## Error taxonomy

| Option                   | Description                                                                                                      | Selected |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Universeel (Recommended) | Zelfde error types en meldingen voor zowel transcriptie als correctie. Error taxonomy geldt voor alle API calls. | ✓        |
| Per stap apart           | Transcriptie-fouten en correctie-fouten krijgen eigen meldingen.                                                 |          |

**User's choice:** Universeel
**Notes:** None

| Option                     | Description                                                                       | Selected |
| -------------------------- | --------------------------------------------------------------------------------- | -------- |
| Actiegericht (Recommended) | Gebruiker ziet alleen wat te doen. Geen HTTP statuscodes, geen technische termen. | ✓        |
| Actiegericht + context     | Actie voorop, maar met subtiele technische hint voor power users.                 |          |
| Je beslist                 | Claude kiest passend detail-level.                                                |          |

**User's choice:** Actiegericht
**Notes:** None

| Option                                | Description                                                                | Selected |
| ------------------------------------- | -------------------------------------------------------------------------- | -------- |
| Ja, visueel onderscheid (Recommended) | Retry-bare fouten in amber/geel tint, fatale fouten in rood. Beide inline. | ✓        |
| Nee, zelfde stijl                     | Alle fouten zien er hetzelfde uit. Alleen de tekst verschilt.              |          |
| Je beslist                            | Claude kiest de beste aanpak.                                              |          |

**User's choice:** Ja, visueel onderscheid
**Notes:** None

---

## Retry transparantie

| Option                    | Description                                                                                   | Selected |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Onzichtbaar (Recommended) | Backend retry't op de achtergrond. Gebruiker ziet alleen de countdown als alle retries falen. | ✓        |
| Subtiele indicator        | Kleine tekst of spinner: 'Opnieuw verbinden... (poging 2/5)'.                                 |          |
| Je beslist                | Claude kiest.                                                                                 |          |

**User's choice:** Onzichtbaar
**Notes:** None

| Option                       | Description                                                                          | Selected |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Alleen backend (Recommended) | Backend handelt retries af met tenacity. Frontend doet geen retries.                 | ✓        |
| Beide lagen                  | Backend retry't eerst (tenacity). Als dat faalt, kan frontend nog een keer retry'en. |          |
| Je beslist                   | Claude kiest de beste architectuur.                                                  |          |

**User's choice:** Alleen backend
**Notes:** None

---

## Foutmelding toon

| Option                       | Description                                                                                        | Selected |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Kort en direct (Recommended) | 'Overbelast. Wacht 30s.' / 'Geen internet.' / 'Backend niet bereikbaar.' Geen 'Helaas' of 'Sorry'. | ✓        |
| Vriendelijk informeel        | 'Even geduld — de server is druk. Nog 30s...' Meer persoonlijk.                                    |          |
| Zoals nu (mix)               | Bestaande stijl handhaven.                                                                         |          |

**User's choice:** Kort en direct
**Notes:** None

| Option                     | Description                                                   | Selected |
| -------------------------- | ------------------------------------------------------------- | -------- |
| Alleen tekst (Recommended) | Foutmelding beschrijft de actie in tekst. Geen extra knoppen. | ✓        |
| Tekst + actieknop          | Bij retry-bare fouten verschijnt een 'Opnieuw' knop.          |          |
| Je beslist                 | Claude kiest.                                                 |          |

**User's choice:** Alleen tekst
**Notes:** None

---

## Claude's Discretion

- Error type mapping per endpoint
- Tenacity decorator configuratie
- SSE error event JSON structuur
- Error severity kleurtinten
- Auto-retry limiet na countdown

## Deferred Ideas

None — discussion stayed within phase scope
