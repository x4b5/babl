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
  48 geverifieerde bevindingen (10 HOOG, 25 MIDDEL, 13 LAAG) weggeschreven als werkversie
  in `docs/audit-2026-06.md`, inclusief voorlopige prioritering. Commit: `121c29e`.

## Waar gebleven

- `docs/audit-2026-06.md` bestaat als WERKVERSIE: secties 1-3 (stores/utils, services,
  components) zijn af; de backend/routes-sectie ontbreekt nog en de prioritering is
  voorlopig gemarkeerd.

## Volgende stappen

1. Audit van `backend/main.py` (+ overige backend-bestanden zoals `config.py`/routers)
   en `src/routes/` (API-routes AssemblyAI/Mistral, `+page.svelte`, `+layout.svelte`) —
   bevindingen toevoegen als sectie 4 in `docs/audit-2026-06.md`. Let op raakvlakken die
   al gesignaleerd zijn: temperature-default 0.2 vs 0.5 (S5), `region` genegeerd door
   API-route (V20), `keep_dialect` (S1).
2. Alle bevindingen definitief prioriteren, de "WERKVERSIE"-markering verwijderen en de
   voorlopige prioritering omzetten naar een definitieve geprioriteerde lijst. Daarna
   STATUS op KLAAR.

## Openstaande problemen of twijfels

- De prioritering onderaan `docs/audit-2026-06.md` is voorlopig; definitief maken kan pas
  na de backend/routes-audit (stap 2).
- Bevindingen S13/S14 (glossary: foute vertaalsleutels en ongrammaticale few-shot
  voorbeelden) raken prompt-inhoud — fixen is inhoudelijk werk dat mogelijk afstemming
  met de gebruiker vraagt (dialectkennis), niet zomaar autonoom "verbeteren".
- C12 (Google Fonts remote laden) fixen vereist een font-bestand toevoegen; dat raakt
  mogelijk `static/` — geen guardrail-conflict, maar noteer het bij de uitvoering.
