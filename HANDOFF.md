# HANDOFF

STATUS: KLAAR

> Overdracht tussen autonome iteraties. Elke iteratie leest dit bestand eerst en werkt het
> bij na afloop. STATUS is altijd een van: BEZIG | KLAAR | GEBLOKKEERD.
> KLAAR = hele taak af, loop mag stoppen. GEBLOKKEERD = escalatie nodig, loop stopt.

## Huidige taak

Fase 0.1 uit `docs/product-backlog.md` — Codebase-audit: technische schuld,
inconsistenties frontend/backend, dode code, ongebruikte imports en afwijkingen van de
CLAUDE.md-regels in kaart brengen. Resultaat: geprioriteerde lijst in `docs/audit-2026-06.md`.

## Wat is af

De hele taak is af:

- Stap 1: audit van `src/lib/` (stores, services, utils, components, config) —
  secties 1-3 in `docs/audit-2026-06.md`. Commit: `121c29e`.
- Stap 2: audit van `backend/` en `src/routes/` — sectie 4, met handmatig geverifieerde
  kruispunten (`keep_dialect`, `temperature`, `region`, PII-redactie, EU-endpoint).
  Commit: `284e626`.
- Stap 3: definitieve prioritering — alle 108 genummerde bevindingen (S1-S27, V1-V20,
  C1-C17, B1-B31, R1-R13) ingedeeld in 34 clusters over vijf niveaus (P0 escalatie,
  P1 privacy/security, P2 bugs met gebruikersimpact, P3 opruimen, P4 tests); elke
  bevinding precies één keer ingedeeld (geverifieerd per ID). WERKVERSIE-markering
  verwijderd, document staat op DEFINITIEF. Commit: `d650a08`.

## Waar gebleven

Fase 0.1 is volledig afgerond. `docs/audit-2026-06.md` is het eindresultaat en de bron
voor vervolgwerk. Geen lopend werk meer onder deze taak.

## Volgende stappen

(geen — taak af; de loop mag stoppen)

Voor een eventuele volgende taak: de gebruiker beslist eerst over de P0-escalaties
hieronder; daarna is P1-cluster 3 (R1 + C12, Google Fonts self-hosten) de eerste
autonoom uitvoerbare kandidaat uit de prioritering, of de volgende open taak uit
`docs/product-backlog.md`.

## Openstaande problemen of twijfels

- **P0-escalaties — stand na gebruikersbesluit (2026-06-11):**
  1. B1 + R2 — **OPGELOST** in commit `099cb82`: gebruiker koos "gedrag fixen".
     AssemblyAI gaat nu in beide paden naar het EU-endpoint (api.eu.assemblyai.com)
     en het Vercel-pad doet dezelfde PII-redactie als het lokale pad
     (gedeelde constante in `src/lib/server/assemblyai.ts`). Nog te doen door de
     gebruiker: één live test-transcriptie in API-modus ter bevestiging.
     Cluster 6 (B6 + B13, audittrail) kan nu autonoom worden opgepakt.
  2. S13 + S14 — glossary: **GEPARKEERD** door de gebruiker ("kom ik op terug").
     De verdachte items zijn geïnventariseerd (sleutels `die`/`mie`/`us`/`maat` +
     4 ongrammaticale few-shots); correctie wacht op dialectkennis van de gebruiker.
     Niet autonoom oppakken.
- **Nieuwe bevinding (2026-06-11, buiten de audit):** `backend/routes/transcribe_ws.py`
  gebruikt `aai.RealtimeTranscriber`, maar die bestaat niet meer in de geïnstalleerde
  SDK (assemblyai 0.64.4) — de live-streaming-route crasht bij gebruik. Migratie naar
  streaming v3 (`streaming.eu.assemblyai.com`, EU) is een goede volgende autonome taak.
- Telcorrectie: eerdere HANDOFF-versies noemden "92 bevindingen" (48 + 44); bij natelling
  per ID bevat het document er 108 (64 in secties 1-3, 44 in sectie 4). De inhoud is
  ongewijzigd — alleen de telling was eerder onnauwkeurig.
- R1/C12 (Google Fonts) fixen vereist self-hosten van een font-bestand; raakt
  vermoedelijk `static/` — geen guardrail-conflict, wel benoemen in de commit.
