# Phase 6: LLM Correction Consistency - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Correctie van Limburgs dialect naar standaard Nederlands voorspelbaar en gestructureerd maken. Dit omvat: regio-specifieke few-shot voorbeelden in prompts, structured JSON output schema, uitbreiding van dialect-naar-standaard glossary naar 50-100+ termen per regio, en deduplicatie van correctie-prompts tussen backend en frontend.

</domain>

<decisions>
## Implementation Decisions

### Few-shot voorbeelden

- **D-01:** 3-5 regio-specifieke dialect→Nederlands voorbeelden per regio. Mestreechs krijgt Franse invloeden, Kirchröadsj Duitse, etc. Geen generieke voorbeelden meer.
- **D-02:** Voorbeelden opslaan in `dialects.py` bij de REGIONAL_PROFILES dict. Alles dialect-gerelateerd op één plek.
- **D-03:** Claude's Discretion — aanpak voor prompt-lengte variatie (zelfde input met aangepaste output vs volledig apart per lengte). Kies op basis van effectiviteit en onderhoudbaarheid.

### JSON output schema

- **D-04:** Prompt-only JSON approach — geen instructor library. LLM wordt via prompt gevraagd JSON te outputten. Validatie achteraf. Past bij bestaande streaming architectuur.
- **D-05:** Claude's Discretion — welke velden (origineel, correctie, confidence, regels) realistisch betrouwbaar zijn van een LLM. Minimaal origineel + correctie.
- **D-06:** Claude's Discretion — streaming UX impact. Kies of JSON gestreamd wordt (complexer, betere UX) of batch (simpeler, korte wachttijd).

### Glossary uitbreiding

- **D-07:** Glossary opslaan in `dialects.py` als uitbreiding van bestaande `translation_key` per regio. Consistent met Phase 5 aanpak.
- **D-08:** Claude's Discretion — formaat van glossary-injectie in prompt. Kies het formaat dat het LLM het beste begrijpt (tabel, sectie, key=value lijst).

### Prompt deduplicatie

- **D-09:** Claude's Discretion — centralisatie-strategie. Huidig: prompts gedupliceerd in `backend/main.py` (Ollama+Mistral lokaal) en `src/routes/api/correct/+server.ts` (Mistral via Vercel). Kies aanpak op basis van deployment requirements.
- **D-10:** Claude's Discretion — beide correctie-paden (Vercel Mistral + backend Ollama/Mistral) behouden of consolideren. Kies op basis van deployment model.

### Claude's Discretion

Claude heeft flexibiliteit op: prompt-lengte variatie (D-03), JSON velden (D-05), streaming UX (D-06), glossary formaat (D-08), centralisatie-strategie (D-09), en pad-consolidatie (D-10). Belangrijke constraints:

- Bestaande streaming UX niet breken zonder goede reden
- Vercel deployment moet blijven werken (frontend kan ook zonder lokale backend)
- `dialects.py` structuur als fundament — uitbreiden, niet vervangen
- Privacy: geen PII loggen, geen ruwe tekst loggen

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Correctie prompts (huidige staat)

- `backend/main.py` §143-245 — SYSTEM_PROMPTS dict (kort/middellang/lang), DIALECT_RETENTION_PROMPT, CLEANUP_PROMPT
- `backend/main.py` §288-395 — `_build_ollama_prompt()`, `correct_chunk_stream()`, `_build_mistral_prompt()`, `correct_chunk_mistral_stream()`
- `backend/main.py` §987-1070 — `/correct` endpoint met twee-staps correctie flow
- `src/routes/api/correct/+server.ts` — Frontend Mistral correctie (gedupliceerde prompts, streaming SSE)

### Dialect infrastructure

- `backend/dialects.py` — REGIONAL_PROFILES dict, DIALECT_TRANSLATION_KEY, `get_dialect_config()`, translation_key per regio
- `backend/dialects.py` §68-73 — DIALECT_TRANSLATION_KEY (generieke glossary ~10 termen)
- `backend/dialects.py` §121,153,181,216 — Regionale translation_key strings (~10 termen elk)

### Evaluation (Phase 4 — referentie)

- `backend/evaluation/metrics.py` — WER/CER voor kwaliteitsmeting na wijzigingen

### Project context

- `.planning/REQUIREMENTS.md` — CORR-01, CORR-02, CORR-03 requirement definities
- `.planning/ROADMAP.md` — Phase 6 success criteria en scope

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `backend/dialects.py` REGIONAL_PROFILES — complete structuur per regio, `get_dialect_config()` functie
- `backend/main.py` SYSTEM_PROMPTS — 3 prompt-lengtes met gedeelde structuur
- `backend/main.py` `translation_key` injectie — `system_prompt.replace(DIALECT_TRANSLATION_KEY, regional_key)`
- `src/routes/api/correct/+server.ts` — Identieke Mistral streaming flow

### Established Patterns

- Prompt bouwt op via string concatenatie met f-strings
- `translation_key` wordt runtime geïnjecteerd in system prompt via `str.replace()`
- SSE streaming: tokens worden 1-voor-1 gestuurd als `{ type: 'token', text: token }`
- Chunking: lange teksten gesplitst in max 400 woorden per chunk
- Twee-staps correctie voor Limburgs: eerst cleanup, dan vertaling (backend)
- Frontend en backend zijn onafhankelijke deployments (Vercel vs localhost)

### Integration Points

- `backend/main.py` `/correct` endpoint — waar prompts worden samengesteld en correctie wordt uitgevoerd
- `backend/dialects.py` `get_dialect_config()` — waar glossary en voorbeelden worden opgehaald
- `src/routes/api/correct/+server.ts` — frontend Mistral pad (Vercel deployment)
- `src/routes/transcribe/+page.svelte` — waar correctie-resultaat wordt weergegeven (streaming tokens)

</code_context>

<specifics>
## Specific Ideas

- Huidige voorbeeld in alle prompts is altijd hetzelfde: "Ich bin eh gister nao de maat gegange..." — dit is generiek Limburgs, niet regio-specifiek
- `translation_key` wordt al runtime geïnjecteerd via `str.replace()` — zelfde mechanisme kan voor uitgebreide glossary
- Phase 5 `custom_spelling` dict per regio bevat al 15-22 mappings die als glossary-basis kunnen dienen
- Twee-staps correctie flow in backend (cleanup + vertaling) is Limburgs-specifiek — andere talen skippen deze stap

</specifics>

<deferred>
## Deferred Ideas

- RF-02 (system prompts centraliseren) overlapt met D-09/D-10 — volledige refactoring uitgesteld maar prompt deduplicatie wordt wel aangepakt waar nodig voor Phase 6

</deferred>

---

_Phase: 06-llm-correction-consistency_
_Context gathered: 2026-04-18_
