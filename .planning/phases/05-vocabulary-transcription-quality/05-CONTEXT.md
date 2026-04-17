# Phase 5: Vocabulary & Transcription Quality - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Verbeteren van Whisper/AssemblyAI dialectherkenning via woordenschatoptimalisatie en hallucinatiepreventie. Dit omvat: audit en uitbreiding van alle 5 dialectprofielen naar 50-100 woorden, multi-pronunciation lexicon per regio, en automatische hallucinatiedetectie (herhalingen, onzin-output). Bestaande `backend/dialects.py` structuur wordt uitgebreid, niet vervangen.

</domain>

<decisions>
## Implementation Decisions

### Word Boost Uitbreiding

- **D-01:** Claude's Discretion — aanpak voor uitbreiding (handmatig/AI-gegenereerd/hybride) wordt bepaald op basis van beschikbare bronnen en haalbaarheid
- **D-02:** Claude's Discretion — structuur van gedeelde basis vs strikt per-regio word boost lijsten, op basis van AssemblyAI best practices en het vermijden van over-biasing (max 200-300 woorden per PROJECT.md beslissing)

### Uitspraakvarianten (Multi-Pronunciation)

- **D-03:** Claude's Discretion — structuur van uitspraakvarianten (uitbreiding bestaand `custom_spelling` dict vs nieuw pronunciation map), gekozen op basis van wat het beste past bij AssemblyAI API en bestaande code in `dialects.py`

### Hallucination Handling

- **D-04:** Claude's Discretion — UX bij gedetecteerde hallucinaties (stilletjes strippen, markeren, of combinatie), gekozen op basis van hallucinatietype
- **D-05:** Claude's Discretion — locatie van detectie (backend Python vs frontend TypeScript), gekozen op basis van architectuurpatronen

### Profielaudit Aanpak

- **D-06:** Claude's Discretion — prioritering en diepte van audit per regio (alle 5 volledig vs focus op meestgebruikte), gekozen op basis van gebruikspatronen en haalbaarheid

### Claude's Discretion

Alle 4 gebieden zijn aan Claude's discretie overgelaten. De gebruiker vertrouwt op technische best practices en de bestaande architectuurpatronen. Belangrijke constraints:

- Max 200-300 woorden per word boost lijst om over-biasing te voorkomen (STATE.md beslissing)
- Bestaande `dialects.py` structuur als fundament — niet vervangen, uitbreiden
- AssemblyAI `word_boost` + `custom_spelling` API als primaire target
- Privacy: geen PII, geen ruwe tekst loggen

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dialect infrastructure (huidige staat)

- `backend/dialects.py` — 5 regioprofielen met word_boost, custom_spelling, style_prompt, hotwords, translation_key
- `backend/main.py` — AssemblyAI config met word_boost en custom_spelling (regel ~657-665), TranscriptionConfig setup

### Transcriptie API routes

- `src/routes/api/transcribe-api/+server.ts` — AssemblyAI submit endpoint
- `src/routes/api/transcribe-api/[id]/+server.ts` — AssemblyAI poll endpoint met word-level confidence

### Correctie prompts

- `src/routes/api/correct/+server.ts` — Mistral correctie prompts (kort/middellang/lang) met dialect-verwijzingen

### Evaluation (Phase 4)

- `backend/evaluation/metrics.py` — WER/CER berekening, bruikbaar voor kwaliteitsmeting na wijzigingen
- `backend/evaluation/patterns.py` — Error pattern extractie (substitutie/deletie/insertie)

### Project context

- `.planning/REQUIREMENTS.md` — TRANS-01, TRANS-02, TRANS-03 requirement definities
- `.planning/ROADMAP.md` — Phase 5 success criteria en scope
- `.planning/codebase/INTEGRATIONS.md` — AssemblyAI API configuratie, word boost parameters

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `backend/dialects.py` `REGIONAL_PROFILES` dict — complete structuur met 5 regio's, `get_dialect_config()` functie
- `backend/dialects.py` `DIALECT_WORD_BOOST` — generieke Limburgse woordlijst (50 woorden) als basis
- `backend/dialects.py` `DIALECT_CUSTOM_SPELLING` — mapping dialectwoord → standaard Nederlands
- `backend/evaluation/metrics.py` `calculate_metrics()` — WER/CER voor kwaliteitsmeting
- `src/lib/components/ConfidenceHighlight.svelte` — word-level confidence weergave (Phase 4)

### Established Patterns

- Dialect config geladen via `get_dialect_config(region)` in main.py
- AssemblyAI word boost: `config_kwargs["word_boost"] = dialect_config["word_boost"]` met `boost_param = "high"`
- Custom spelling: `config_kwargs["custom_spelling"] = dialect_config["custom_spelling"]`
- Alleen actief wanneer `lang == "li"` — andere talen krijgen geen boost

### Integration Points

- `backend/main.py` regel ~657-665 — waar word_boost en custom_spelling naar AssemblyAI worden gestuurd
- `backend/main.py` lokale transcriptie — mlx-whisper gebruikt `initial_prompt` uit dialect config
- `src/routes/api/correct/+server.ts` — correctie prompts die dialect-naar-Nederlands vertaling doen

</code_context>

<specifics>
## Specific Ideas

- ROADMAP success criteria specificeren "50-100 hoogwaardige termen per regio"
- PROJECT.md waarschuwt: "Avoid over-biasing vocabulary (>200-300 words degrades general accuracy)"
- Bestaande generieke `DIALECT_WORD_BOOST` heeft al 50 woorden — regionale profielen hebben er 5-6
- AssemblyAI `custom_spelling` kan gebruikt worden voor uitspraakvarianten (mapping variant → standaardvorm)
- Hallucinatie-patronen bij Whisper: herhaalde zinnen, "Thank you for watching", gefluister-loops

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 05-vocabulary-transcription-quality_
_Context gathered: 2026-04-17_
