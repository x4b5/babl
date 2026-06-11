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

- (nog niets — loop nog niet gestart)

## Waar gebleven

- Loop-infrastructuur staat klaar; eerste iteratie moet beginnen met Fase 0.1.

## Volgende stappen

1. Audit van `src/lib/` (stores, services, utils, components) — bevindingen verzamelen.
2. Audit van `backend/main.py` en `src/routes/` — bevindingen verzamelen.
3. Bevindingen prioriteren en wegschrijven naar `docs/audit-2026-06.md`.

## Openstaande problemen of twijfels

- geen
