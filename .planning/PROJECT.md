# BABL

## What This Is

BABL is een privacy-first spraak-naar-tekst tool die Limburgse dialecten transcribeert en corrigeert naar standaard Nederlands. Gebruikers nemen audio op via de browser (of uploaden een bestand), kiezen per stap tussen lokale verwerking (mlx-whisper + Ollama) of cloud API (AssemblyAI + Mistral), en krijgen zowel ruwe transcriptie als gecorrigeerde verslaglegging. GDPR en EU AI Act compliant.

## Core Value

Betrouwbare spraak-naar-tekst met dialectcorrectie — de transcriptie moet kloppen en het proces mag niet stilzwijgend falen.

## Requirements

### Validated

- ✓ Audio opname via browser (MediaRecorder API) — existing
- ✓ Audio bestand upload — existing
- ✓ Lokale transcriptie via mlx-whisper (Apple Silicon) — existing
- ✓ Cloud transcriptie via AssemblyAI (EU Dublin) — existing
- ✓ Lokale dialectcorrectie via Ollama (Gemma3) — existing
- ✓ Cloud dialectcorrectie via Mistral AI (EU servers) — existing
- ✓ Dual-mode per stap: gebruiker kiest lokaal of API — existing
- ✓ Twee-staps verwerking: eerst transcriptie, dan correctie — existing
- ✓ Live transcriptie (incrementeel, real-time) — existing
- ✓ SSE streaming voor transcriptie en correctie resultaten — existing
- ✓ WebSocket real-time streaming via AssemblyAI — existing
- ✓ Kwaliteitsmodi (Light/Medium) per correctie-engine — existing
- ✓ Limburgse dialectprofielen (5 regio's) — existing
- ✓ Spacebar shortcut voor opname start/stop — existing
- ✓ Wachtwoord-gebaseerde toegangscontrole — existing
- ✓ PostHog analytics (EU, geen PII) — existing
- ✓ Dark theme met glassmorphism design — existing
- ✓ Vercel deployment (frontend) — existing

### Active

_See REQUIREMENTS.md for v2.0 requirements_

### Validated (v1.0)

- ✓ WebSocket streaming herstelt bij backend disconnect (geen silent failures) — Validated in Phase 1
- ✓ Live transcriptie offset filtering verliest geen tekst bij segment boundaries — Validated in Phase 1
- ✓ Mistral rate limiting geeft duidelijke foutmelding aan gebruiker — Validated in Phase 2
- ✓ Audio resources worden correct opgeruimd bij page unload/crash — Validated in Phase 3
- ✓ Foutmeldingen zijn consistent en informatief (niet generiek "mislukt") — Validated in Phase 2

### Out of Scope

- Transcript inline editing — later milestone
- Batch upload / bulk verwerking — later milestone
- Refactoring +page.svelte (1662 regels) — later milestone, na stabiliteit
- E2E test suite — later milestone
- Mobile app — web-first

## Current Milestone: v2.0 Dialect Quality

**Goal:** De Limburgse dialectherkenning en -correctie verbeteren zodat de betekenis/context van het gesprek altijd klopt in de output.

**Target features:**

- Betere Whisper transcriptie — Limburgse woorden worden nu vervangen door (verkeerde) Nederlandse woorden
- Consistentere correctie — Mistral/Ollama is nu onvoorspelbaar (soms goed, soms totaal niet)
- Werkt over alle 5 dialectregio's — niet alleen één variant

## Context

- Gebruiker werkt primair met korte opnames (<10 min) in API modus (AssemblyAI + Mistral)
- Stabiliteitsbugs (WebSocket, offset filtering, rate limiting) zijn opgelost in v1.0
- App wordt dagelijks gebruikt — dialectkwaliteit is nu de primaire bottleneck
- Whisper substitueert Limburgse woorden met foute Nederlandse woorden (bv. "ich" → verkeerd Nederlands woord)
- Correctie via Mistral/Ollama is inconsistent — soms prima, soms totaal niet
- Succescriterium: de strekking/betekenis moet altijd kloppen (niet per se elk woord perfect)
- Gebruiker test met meerdere dialectregio's
- Codebase map beschikbaar in `.planning/codebase/` (7 documenten)
- Monolithisch +page.svelte (1662 regels) — refactoring bewust uitgesteld

## Constraints

- **Privacy**: Geen PII loggen. API modus alleen EU-servers (Dublin + EU). `person_profiles: 'never'`
- **Tech stack**: SvelteKit 5 + Svelte 5 runes, TypeScript strict, Tailwind CSS 4, FastAPI backend
- **Deployment**: Frontend op Vercel, backend lokaal (localhost:8000)
- **Compatibility**: WebSocket streaming is local-dev only (niet Vercel)
- **Node**: v24 (zie .nvmrc)

## Key Decisions

| Decision                            | Rationale                                                          | Outcome   |
| ----------------------------------- | ------------------------------------------------------------------ | --------- |
| Focus op stabiliteit boven features | App wordt dagelijks gebruikt, bugs ondermijnen vertrouwen          | ✓ v1.0    |
| Refactoring uitgesteld              | Stabiliteit eerst, dan pas structuur verbeteren                    | — Pending |
| API modus als primaire focus        | Gebruiker werkt voornamelijk in API modus                          | ✓ v1.0    |
| Dialectkwaliteit als v2.0 focus     | Transcriptie en correctie van Limburgs zijn de primaire bottleneck | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-03-28 — Milestone v2.0 Dialect Quality started_
