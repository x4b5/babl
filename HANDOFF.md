# HANDOFF

STATUS: BEZIG

> Overdracht tussen autonome iteraties. Elke iteratie leest dit bestand eerst en werkt het
> bij na afloop. STATUS is altijd een van: BEZIG | KLAAR | GEBLOKKEERD.
> KLAAR = hele taak af, loop mag stoppen. GEBLOKKEERD = escalatie nodig, loop stopt.

## Huidige taak

Fase 0.1 uit `docs/product-backlog.md` — Codebase-audit: technische schuld,
inconsistenties frontend/backend, dode code, ongebruikte imports en afwijkingen van de
CLAUDE.md-regels in kaart brengen. Resultaat: geprioriteerde lijst in `docs/audit-2026-06.md`.

## Wat is af

- Stap 1: audit van `src/lib/` (stores, services, utils, components, config) — afgerond.
  48 geverifieerde bevindingen (10 HOOG, 25 MIDDEL, 13 LAAG) als secties 1-3 in
  `docs/audit-2026-06.md`. Commit: `121c29e`.
- Stap 2: audit van `backend/` (main, config, models, audio, dialects, diarization,
  hallucination, polishing, routes/, evaluation/) en `src/routes/` (API-routes, layout,
  transcribe-page, login/logout, content-pagina's) — afgerond. 44 bevindingen
  (8 HOOG, 17 MIDDEL, 19 LAAG) als sectie 4. Kruispunten handmatig geverifieerd:
  `keep_dialect` (B7), `temperature` 0.2/0.5 (B8/R6), `region` (R5), PII-redactie (R2),
  EU-endpoint (B1). Commit: `284e626`.

## Waar gebleven

- `docs/audit-2026-06.md` is inhoudelijk compleet (secties 1-4, totaal 92 bevindingen),
  maar staat nog gemarkeerd als WERKVERSIE en de prioritering onderaan is voorlopig en
  dekt alleen secties 1-3.

## Volgende stappen

1. Alle 92 bevindingen definitief prioriteren: de "Voorlopige prioritering" vervangen
   door één definitieve geprioriteerde lijst die ook de B- en R-bevindingen meeneemt
   (kandidaten voor bovenaan: B1 EU-endpoint, R2 PII-redactie-claim, R1 Google Fonts,
   B2/B3 hallucination-tekstcorruptie, B4 stille lege transcriptie, B5 corrections-log).
   Daarna de WERKVERSIE-markering verwijderen en STATUS op KLAAR.

## Openstaande problemen of twijfels

- **B1 (AssemblyAI US-endpoint) en R2 (PII-redactie ontbreekt op Vercel-pad) weerleggen
  privacyclaims op de eigen privacy-/about-pagina's.** Dat fixen is inhoudelijk én
  mogelijk juridisch gevoelig (claims aanpassen vs. gedrag aanpassen) — escalatiepunt
  voor de gebruiker, niet autonoom oplossen.
- Bevindingen S13/S14 (glossary: foute vertaalsleutels en ongrammaticale few-shot
  voorbeelden) raken prompt-inhoud — fixen vraagt afstemming met de gebruiker
  (dialectkennis), niet autonoom "verbeteren".
- C12/R1 (Google Fonts) fixen vereist self-hosten van een font-bestand; raakt mogelijk
  `static/` — geen guardrail-conflict, maar noteer het bij de uitvoering.
- Eén subagent claimde tijdens de audit ten onrechte dat `redact_pii` nergens voorkwam;
  handmatig geverifieerd: het bestaat wél in `backend/routes/transcribe_api.py:79-88`,
  alleen niet in het Vercel-pad. Sectie 4 bevat de geverifieerde versie.
