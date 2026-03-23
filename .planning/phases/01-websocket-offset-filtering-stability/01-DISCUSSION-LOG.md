# Phase 1: WebSocket + Offset Filtering Stability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 01-websocket-offset-filtering-stability
**Areas discussed:** Reconnection UX, Data continuity, Deduplication strategy, Error messaging tone

---

## Reconnection UX

| Option             | Description                                                                                                     | Selected |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | -------- |
| Inline banner      | Subtiele banner boven transcriptie-area: "Verbinding herstellen (poging 2/5)..." — past bij glassmorphism stijl | ✓        |
| Toast notification | Floating toast rechtsonder, verschijnt/verdwijnt per poging                                                     |          |
| Status indicator   | Klein icoon/dot naast opname-timer dat van kleur wisselt                                                        |          |

**User's choice:** Inline banner (Recommended)
**Notes:** None

| Option               | Description                                                       | Selected |
| -------------------- | ----------------------------------------------------------------- | -------- |
| Doorlopen + bufferen | Opname blijft actief, audio chunks gebufferd, na reconnect verder | ✓        |
| Pauzeren tot herstel | Opname pauzeert automatisch, hervat na reconnect                  |          |

**User's choice:** Doorlopen + bufferen (Recommended)
**Notes:** None

| Option                         | Description                                                          | Selected |
| ------------------------------ | -------------------------------------------------------------------- | -------- |
| Foutmelding + opgeslagen audio | "Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload" | ✓        |
| Foutmelding + retry knop       | Handmatige retry-knop zonder automatische fallback                   |          |
| You decide                     | Claude kiest                                                         |          |

**User's choice:** Foutmelding + opgeslagen audio
**Notes:** None

---

## Data continuity

| Option                 | Description                                                     | Selected |
| ---------------------- | --------------------------------------------------------------- | -------- |
| Bewaar tekst + ga door | liveSegments blijven, nieuwe sessie voegt toe. Gap geaccepteerd | ✓        |
| Bewaar + gap marker    | Zelfde maar met visuele marker "[...verbinding onderbroken...]" |          |
| You decide             | Claude kiest                                                    |          |

**User's choice:** Bewaar tekst + ga door (Recommended)
**Notes:** None

| Option                 | Description                                                  | Selected |
| ---------------------- | ------------------------------------------------------------ | -------- |
| Nee, accepteer gap     | Gebufferde audio niet retroactief getranscribeerd. Simpeler  | ✓        |
| Ja, via batch fallback | Na reconnect gebufferde audio via batch alsnog transcriberen |          |
| You decide             | Claude kiest                                                 |          |

**User's choice:** Nee, accepteer gap (Recommended)
**Notes:** None

---

## Deduplication strategy

| Option                | Description                                                               | Selected |
| --------------------- | ------------------------------------------------------------------------- | -------- |
| Timestamp-based dedup | Vergelijk segment timestamps, skip overlappend deel binnen 0.5s tolerance | ✓        |
| Exact text match      | Strip duplicaten op basis van exacte woordmatch                           |          |
| You decide            | Claude kiest                                                              |          |

**User's choice:** Timestamp-based dedup (Recommended)
**Notes:** None

| Option          | Description                                   | Selected |
| --------------- | --------------------------------------------- | -------- |
| Onzichtbaar     | Intern, gebruiker ziet vloeiende tekst        | ✓        |
| Debug indicator | Lichte highlight waar deduplicatie plaatsvond |          |

**User's choice:** Onzichtbaar (Recommended)
**Notes:** None

---

## Error messaging tone

| Option                         | Description                                                               | Selected |
| ------------------------------ | ------------------------------------------------------------------------- | -------- |
| Gebruiksvriendelijk Nederlands | "Verbinding even kwijt, we proberen het opnieuw" — geen technische termen | ✓        |
| Technisch maar duidelijk       | "WebSocket timeout na 30s" — voor ontwikkelaars                           |          |
| Hybride                        | Gebruiksvriendelijk + technisch detail eronder in klein/grijs             |          |

**User's choice:** Gebruiksvriendelijk Nederlands (Recommended)
**Notes:** None

| Option     | Description                                                          | Selected |
| ---------- | -------------------------------------------------------------------- | -------- |
| Nederlands | Consistent met UI. "Verbinding verloren", "Probeer over 10 seconden" | ✓        |
| Engels     | "Connection lost", "Retry in 10 seconds"                             |          |

**User's choice:** Nederlands (Recommended)
**Notes:** None

---

## Claude's Discretion

- Exacte reconnect-banner styling
- Heartbeat interval fine-tuning
- Exacte deduplicatie-algoritme implementatie
- SSE timeout foutmelding exacte formulering

## Deferred Ideas

None — discussion stayed within phase scope
