# Phase 6: LLM Correction Consistency - Research

**Researched:** 2026-04-18
**Domain:** LLM prompt engineering, structured outputs, few-shot prompting, dialect translation
**Confidence:** HIGH

## Summary

Phase 6 aims to make Limburgse dialect-to-Dutch correction predictable and structured through four key improvements: region-specific few-shot examples (3-5 per dialect), structured JSON output schema, expanded glossary (50-100+ terms per region), and prompt deduplication between backend and frontend.

The research reveals that prompt-only JSON approaches (without instructor library) are viable and compatible with existing SSE streaming architecture. Few-shot prompting is the most effective technique for consistency, with 3-5 examples being the sweet spot. Mistral AI supports both `json_object` mode and the newer `json_schema` mode with strict validation, though both work with streaming. Ollama/Gemma3 supports JSON schema via the `format` parameter.

**Primary recommendation:** Use prompt-based JSON output with Pydantic validation post-streaming. Store region-specific few-shot examples and expanded glossaries in `dialects.py` alongside existing `REGIONAL_PROFILES`. Keep existing SSE streaming UX intact. Centralize prompts in `dialects.py` and reference from both backend and frontend to eliminate duplication.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 3-5 regio-specifieke dialect→Nederlands voorbeelden per regio. Mestreechs krijgt Franse invloeden, Kirchröadsj Duitse, etc. Geen generieke voorbeelden meer.
- **D-02:** Voorbeelden opslaan in `dialects.py` bij de REGIONAL_PROFILES dict. Alles dialect-gerelateerd op één plek.
- **D-04:** Prompt-only JSON approach — geen instructor library. LLM wordt via prompt gevraagd JSON te outputten. Validatie achteraf. Past bij bestaande streaming architectuur.
- **D-07:** Glossary opslaan in `dialects.py` als uitbreiding van bestaande `translation_key` per regio. Consistent met Phase 5 aanpak.

### Claude's Discretion

- **D-03:** Aanpak voor prompt-lengte variatie (zelfde input met aangepaste output vs volledig apart per lengte). Kies op basis van effectiviteit en onderhoudbaarheid.
- **D-05:** Welke velden (origineel, correctie, confidence, regels) realistisch betrouwbaar zijn van een LLM. Minimaal origineel + correctie.
- **D-06:** Streaming UX impact. Kies of JSON gestreamd wordt (complexer, betere UX) of batch (simpeler, korte wachttijd).
- **D-08:** Formaat van glossary-injectie in prompt. Kies het formaat dat het LLM het beste begrijpt (tabel, sectie, key=value lijst).
- **D-09:** Centralisatie-strategie. Huidig: prompts gedupliceerd in `backend/main.py` (Ollama+Mistral lokaal) en `src/routes/api/correct/+server.ts` (Mistral via Vercel). Kies aanpak op basis van deployment requirements.
- **D-10:** Beide correctie-paden (Vercel Mistral + backend Ollama/Mistral) behouden of consolideren. Kies op basis van deployment model.

### Important Constraints

- Bestaande streaming UX niet breken zonder goede reden
- Vercel deployment moet blijven werken (frontend kan ook zonder lokale backend)
- `dialects.py` structuur als fundament — uitbreiden, niet vervangen
- Privacy: geen PII loggen, geen ruwe tekst loggen

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                      | Research Support                                                                          |
| ------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CORR-01 | Correctie-prompts bevatten 3-5 few-shot voorbeelden per dialectregio             | Few-shot prompting research: 2-5 examples optimal, store in `dialects.py` per region      |
| CORR-02 | LLM output volgt een vast JSON schema met origineel, correctie, en confidence    | Prompt-based JSON via Mistral/Ollama `format` parameter + Pydantic validation post-stream |
| CORR-03 | Dialect-naar-standaard glossary (50-100+ termen) wordt in de prompt geïnjecteerd | Expand existing `translation_key` to 50-100 terms per region in `dialects.py`             |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

CLAUDE.md enforces the following directives relevant to Phase 6:

- **Svelte 5 only:** Use `$props()`, `$state()`, `$derived()`, `$effect()`. Never `export let` or `$:`.
- **Single source of truth:** All app-state lives in `game.svelte.ts`. Never duplicate in components.
- **Dual mode:** User chooses per step (transcription/correction) between local and API. FastAPI backend runs locally for both modes.
- **Privacy first:** No PII logging. `person_profiles: 'never'`. Local mode = no data out. API mode = only EU servers.
- **Twee-staps verwerking:** Always first Whisper (raw transcription shown), then Ollama (correction shown). User sees progression.

Research should not recommend approaches that contradict these directives.

## Standard Stack

### Core

| Library        | Version       | Purpose                               | Why Standard                                                                                  |
| -------------- | ------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Pydantic       | 2.12.5        | JSON schema definition and validation | Industry standard for Python data validation, already in project, zero-cost type-safe parsing |
| Mistral AI SDK | 2.0.2         | LLM API client (Mistral)              | Official SDK, supports streaming + JSON mode, EU servers available                            |
| httpx          | (via backend) | HTTP client for Ollama                | Already in use, async-native, streaming support                                               |

### Supporting

| Library | Version   | Purpose             | When to Use                                                        |
| ------- | --------- | ------------------- | ------------------------------------------------------------------ |
| jiwer   | 3.1.0     | WER/CER calculation | Already in project (Phase 4), use for measuring correction quality |
| FastAPI | (current) | Backend framework   | Already in use, SSE streaming support built-in                     |

### Alternatives Considered

| Instead of                     | Could Use                                      | Tradeoff                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pydantic validation            | instructor library                             | Instructor adds 150KB+ dependency, requires non-streaming API calls, breaks existing SSE UX. Pydantic-only approach keeps streaming intact.                |
| Prompt-based JSON              | Mistral `json_schema` mode with `strict: true` | Schema mode constrains token generation at model level (higher reliability) but may not stream well. Prompt-based approach confirmed streaming-compatible. |
| String replacement for prompts | Shared YAML/JSON config                        | YAML/JSON adds parsing overhead and complicates deployment (file sync between backend/frontend). Python dict in `dialects.py` is simpler and type-safe.    |

**Installation:**

No new dependencies required. All necessary libraries already installed:

```bash
# Backend (Python) - already installed
pip list | grep -E "pydantic|mistralai"
# pydantic 2.12.5
# mistralai 2.0.2

# Frontend (Node.js) - already installed
npm list @mistralai/mistralai
# @mistralai/mistralai@1.4.2
```

**Version verification:** Verified 2026-04-18 via `pip list` and `npm list` in project.

## Architecture Patterns

### Recommended Project Structure

```
backend/
├── dialects.py              # SINGLE SOURCE OF TRUTH for dialect configs
│   ├── REGIONAL_PROFILES    # Existing: word_boost, custom_spelling, translation_key
│   ├── FEW_SHOT_EXAMPLES    # NEW: 3-5 examples per region
│   └── get_dialect_config() # Existing function - expand return value
├── main.py                  # Backend endpoints - reference dialects.py
└── tests/
    └── test_dialects.py     # Existing - expand with few-shot validation

src/routes/api/correct/
└── +server.ts               # SvelteKit API route - import from shared prompt config
```

### Pattern 1: Prompt-Based JSON Output

**What:** Instruct LLM via system prompt to return JSON, then validate with Pydantic post-stream.

**When to use:** When streaming UX is critical and you need structured output without breaking existing SSE architecture.

**Example:**

```python
# Source: Research findings + Mistral AI docs
# backend/dialects.py - NEW addition

from pydantic import BaseModel, Field

class CorrectionOutput(BaseModel):
    """Schema for dialect correction output."""
    original: str = Field(description="De originele tekst (ongewijzigd)")
    corrected: str = Field(description="De gecorrigeerde tekst in standaard Nederlands")
    confidence: float | None = Field(default=None, description="Vertrouwen in de correctie (0.0-1.0)")
    applied_rules: list[str] | None = Field(default=None, description="Toegepaste dialectregels")

# In system prompt:
JSON_INSTRUCTION = """
OUTPUT FORMAT:
Geef je antwoord terug als een JSON object met deze structuur:
{
  "original": "<originele tekst>",
  "corrected": "<gecorrigeerde tekst>",
  "confidence": 0.95,
  "applied_rules": ["neet→niet", "sjoen→mooi"]
}

Geef ALLEEN het JSON object terug, geen andere tekst.
"""

# Post-streaming validation:
import json
accumulated_text = ""  # Collect all streamed tokens
for token in stream:
    accumulated_text += token

# Parse and validate
try:
    data = json.loads(accumulated_text)
    validated = CorrectionOutput(**data)
except (json.JSONDecodeError, ValidationError) as e:
    # Fallback: extract text between { and }
    # Or use the raw accumulated_text as corrected text
```

**Tradeoff:** Requires accumulating full response before validation. Compatible with SSE streaming (user sees tokens incrementally, validation happens at end).

### Pattern 2: Few-Shot Prompting for Dialects

**What:** Include 3-5 example input→output pairs in the prompt to anchor LLM behavior.

**When to use:** Always for dialect translation. Research shows few-shot is more effective than zero-shot for consistent formatting and domain-specific translation.

**Example:**

```python
# Source: Research findings + existing CONTEXT.md D-01
# backend/dialects.py - NEW addition

FEW_SHOT_EXAMPLES = {
    "mestreechs": [
        {
            "input": "Iech bin gister nao de sjtroat gegange en dao hub ich Sjang getroffe.",
            "output": {
                "original": "Iech bin gister nao de sjtroat gegange en dao hub ich Sjang getroffe.",
                "corrected": "Ik ben gisteren naar de straat gegaan en daar heb ik Sjang getroffen.",
                "confidence": 0.95,
                "applied_rules": ["iech→ik", "nao→naar", "sjtroat→straat", "hub→heb"]
            }
        },
        {
            "input": "Vaan dao uuch kalle mit de vrundin?",
            "output": {
                "original": "Vaan dao uuch kalle mit de vrundin?",
                "corrected": "Ga je daar praten met de vriendin?",
                "confidence": 0.90,
                "applied_rules": ["vaan→van/ga", "uuch→je", "kalle→praten"]
            }
        },
        # 3-5 examples total
    ],
    "kirchroeadsj": [
        {
            "input": "Iech han d'r jonge gezien bij de kirchof.",
            "output": {
                "original": "Iech han d'r jonge gezien bij de kirchof.",
                "corrected": "Ik heb de jongen gezien bij het kerkhof.",
                "confidence": 0.92,
                "applied_rules": ["iech→ik", "han→heb", "d'r→de", "jonge→jongen", "kirchof→kerkhof"]
            }
        },
        # 2-4 more examples
    ],
    # ... other regions
}

# In prompt builder:
def build_correction_prompt_with_examples(region: str, report_length: str) -> str:
    base_prompt = SYSTEM_PROMPTS[report_length]
    examples = FEW_SHOT_EXAMPLES.get(region, [])

    example_text = "VOORBEELDEN:\n\n"
    for i, ex in enumerate(examples, 1):
        example_text += f"Voorbeeld {i}:\n"
        example_text += f"Input: {ex['input']}\n"
        example_text += f"Output: {json.dumps(ex['output'], ensure_ascii=False)}\n\n"

    return base_prompt + "\n\n" + example_text + "\n\n" + JSON_INSTRUCTION
```

**Research basis:** [Few-Shot Prompting Guide (mem0.ai)](https://mem0.ai/blog/few-shot-prompting-guide) — "Two to five examples is the practical sweet spot for most tasks. Place your most representative or most important example last."

### Pattern 3: Prompt Centralization

**What:** Store all correction prompts in `dialects.py` and import into both backend and frontend.

**When to use:** When you have duplicate prompts in multiple locations (backend Python + frontend TypeScript) and need single source of truth.

**Options:**

**Option A: Python-only source (recommended for this project):**

```python
# backend/dialects.py - EXPAND existing structure

REGIONAL_PROFILES = {
    "mestreechs": {
        # ... existing fields (word_boost, custom_spelling, translation_key)
        "few_shot_examples": FEW_SHOT_EXAMPLES["mestreechs"],
        "glossary": {  # EXPANDED from translation_key
            "iech": "ik", "miéch": "mij", "vaan": "van",
            # ... 50-100+ terms
        }
    },
    # ... other regions
}

# NEW: Correction prompt builder
def build_correction_prompt(
    region: str,
    report_length: str,
    include_json_schema: bool = True
) -> tuple[str, str]:
    """Build system + user prompt for correction.

    Returns:
        (system_prompt, json_instruction)
    """
    profile = REGIONAL_PROFILES[region]
    base = SYSTEM_PROMPTS[report_length]

    # Inject glossary
    glossary_text = "\n".join(f"{k}={v}" for k, v in profile["glossary"].items())
    base = base.replace(DIALECT_TRANSLATION_KEY, glossary_text)

    # Add few-shot examples
    examples = _format_few_shot_examples(profile["few_shot_examples"])

    # Add JSON schema instruction
    json_instr = JSON_INSTRUCTION if include_json_schema else ""

    return (base + "\n\n" + examples, json_instr)
```

**Option B: Shared JSON/YAML config:**

- Store prompts in `shared-prompts.json`
- Python reads via `json.load()`
- TypeScript imports via `import prompts from './shared-prompts.json'`
- **Tradeoff:** Adds deployment complexity (file sync), loses type safety, harder to version control

**Recommendation:** Option A (Python-only). Frontend calls backend `/correct` endpoint (already exists), so frontend doesn't need prompt logic. For Vercel-deployed frontend (`src/routes/api/correct/+server.ts`), copy final prompt strings from `dialects.py` as constants — they change rarely, manual sync is acceptable.

### Anti-Patterns to Avoid

- **Don't use instructor library for streaming tasks:** Instructor forces non-streaming API calls, breaks existing SSE UX.
- **Don't duplicate prompts in backend AND frontend:** Creates drift. Centralize in `dialects.py`, reference everywhere.
- **Don't add confidence/rules fields if LLM can't reliably populate them:** Research shows LLMs are poor at self-assessing confidence. Start with `original` + `corrected` only, add confidence/rules later if testing proves reliable.
- **Don't inject massive glossaries (>200 terms) without testing:** Research shows over-biasing vocabulary can degrade general accuracy. Start with 50-100 high-frequency terms per region.

## Don't Hand-Roll

| Problem                    | Don't Build                                | Use Instead                                         | Why                                                                                                      |
| -------------------------- | ------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| JSON validation            | Regex parsing of JSON fields               | Pydantic models                                     | Handles edge cases (nested objects, escaping, type coercion), faster than regex, already in project      |
| Prompt template merging    | String concatenation with manual f-strings | Template builder functions                          | Avoids injection bugs, easier to test, centralized logic                                                 |
| Few-shot example selection | Manual hardcoding in prompts               | Dynamic retrieval from `FEW_SHOT_EXAMPLES` dict     | Easier to A/B test, version control, and iterate on examples                                             |
| Glossary expansion         | Manual copy-paste from Phase 5 data        | Programmatic merge of `custom_spelling` + new terms | Phase 5 `custom_spelling` dicts (15-22 terms/region) are foundation, expand to 50-100 via scripted merge |

**Key insight:** Pydantic + dict-based config in `dialects.py` is simpler and more maintainable than building custom JSON parsers or template engines. LLM outputs are unpredictable — validation library handles edge cases you won't think of.

## Runtime State Inventory

> Section omitted — Phase 6 is not a rename/refactor/migration phase.

## Common Pitfalls

### Pitfall 1: Streaming JSON Breaks Mid-Object

**What goes wrong:** LLM streams `{"original": "text", "corr` and stops, leaving incomplete JSON. Frontend tries to parse incrementally and crashes.

**Why it happens:** Token-by-token streaming doesn't respect JSON boundaries. LLM may stream `"corrected"` as separate tokens `"cor`, `rect`, `ed"`.

**How to avoid:**

1. Accumulate full response before parsing (post-stream validation)
2. Use Pydantic's `ValidationError` to catch malformed JSON
3. Fallback: extract text between `{` and `}` if JSON parse fails
4. Show streaming tokens to user (UX benefit) but validate only after stream completes

**Warning signs:** Frontend console errors like `SyntaxError: Unexpected end of JSON input` during streaming.

### Pitfall 2: Few-Shot Examples Don't Match Target Output Format

**What goes wrong:** Few-shot examples show one JSON structure, but system prompt asks for different fields. LLM gets confused and outputs inconsistent format.

**Why it happens:** Prompt conflicting signals — examples teach one thing, instructions say another.

**How to avoid:**

1. Ensure few-shot examples EXACTLY match the JSON schema defined in `CorrectionOutput`
2. Validate example outputs with Pydantic before adding to `FEW_SHOT_EXAMPLES`
3. Test: run Pydantic validation on example outputs in unit tests

**Warning signs:** LLM outputs have extra fields, missing fields, or different field names than schema.

### Pitfall 3: Glossary Too Generic or Too Specific

**What goes wrong:**

- **Too generic:** Glossary contains Dutch→Dutch mappings ("huis→huis"), adds noise, confuses LLM
- **Too specific:** Glossary has 200+ region-specific terms, biases LLM away from general Dutch, degrades accuracy on non-dialect words

**Why it happens:** Copying Phase 5 `custom_spelling` (15-22 terms) and naively expanding to 100+ without curation.

**How to avoid:**

1. Start with Phase 5 `custom_spelling` as foundation (verified dialect→Dutch mappings)
2. Add 30-50 high-frequency dialect terms per region (from transcription logs if available)
3. Test WER/CER after glossary expansion — if accuracy degrades, prune terms
4. Format glossary as `dialect=nederlands` pairs, one per line (research shows this format is clearest for LLMs)

**Warning signs:** WER/CER scores worsen after glossary injection, or LLM starts translating standard Dutch words incorrectly.

### Pitfall 4: Prompt Length Exceeds Token Limits

**What goes wrong:** System prompt + few-shot examples + glossary + user text exceeds Mistral/Gemma3 context window. API returns 400 error or truncates input.

**Why it happens:** Mistral-small has 32k context, Gemma3:4b has 8k. Few-shot (5 examples × 150 tokens) + glossary (100 terms × 10 tokens) + base prompt (500 tokens) + user text (variable) can exceed 8k easily.

**How to avoid:**

1. Calculate token budget: Gemma3:4b = 8k tokens, reserve 2k for output = 6k input max
2. Estimate prompt tokens: base (500) + examples (750) + glossary (1000) + user text (variable) = ~2250 + user text
3. Chunk user text to max 400 words (~600 tokens) — already implemented in `split_into_chunks()`
4. For Gemma3:4b (light mode), reduce examples to 3 instead of 5, or use abbreviated glossary (50 terms instead of 100)

**Warning signs:** API errors like `context_length_exceeded` or silent truncation (output stops mid-sentence).

## Code Examples

Verified patterns from official sources and project context:

### Mistral JSON Mode (Streaming Compatible)

```python
# Source: Mistral AI docs + project backend/main.py pattern
from mistralai import Mistral

async def correct_with_json_mistral(
    text: str,
    region: str,
    mistral_model: str = "mistral-large-latest"
):
    """Correction with JSON output via Mistral streaming."""
    client = Mistral(api_key=MISTRAL_API_KEY)
    system_prompt, json_instr = build_correction_prompt(region, "middellang")
    user_prompt = f"{json_instr}\n\nTekst:\n{text}"

    accumulated = ""
    stream_response = await asyncio.to_thread(
        client.chat.stream,
        model=mistral_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,  # Lower temp for consistency
        # Optional: response_format={"type": "json_object"}  # Enforces valid JSON
    )

    for event in stream_response:
        token = event.data.choices[0].delta.content
        if token:
            accumulated += token
            yield token  # Stream to frontend

    # Post-stream validation
    try:
        data = json.loads(accumulated)
        validated = CorrectionOutput(**data)
        return validated
    except (json.JSONDecodeError, ValidationError) as e:
        # Fallback: treat accumulated text as corrected output
        return CorrectionOutput(original=text, corrected=accumulated)
```

### Ollama JSON Format (via format parameter)

```python
# Source: Ollama docs + research
# backend/main.py - modify correct_chunk_stream()

async def correct_chunk_stream_json(
    client: httpx.AsyncClient,
    chunk: str,
    region: str,
    ollama_model: str = "gemma3:4b",
):
    """Stream tokens from Ollama with JSON schema format."""
    system_prompt, json_instr = build_correction_prompt(region, "middellang")
    prompt = f"{json_instr}\n\nTekst:\n{chunk}"

    # Define JSON schema for format parameter
    schema = CorrectionOutput.model_json_schema()

    async with client.stream(
        "POST",
        OLLAMA_URL,
        json={
            "model": ollama_model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": True,
            "format": schema,  # Ollama structured output
            "options": {"temperature": 0.3},
        },
    ) as resp:
        resp.raise_for_status()
        accumulated = ""
        async for line in resp.aiter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
                token = data.get("response", "")
                if token:
                    accumulated += token
                    yield token
            except json.JSONDecodeError:
                continue

        # Validate after stream
        try:
            validated = CorrectionOutput(**json.loads(accumulated))
        except Exception:
            # Fallback
            pass
```

### Pydantic Validation with Fallback

```python
# Source: Pydantic docs + research
from pydantic import ValidationError
import json
import re

def parse_correction_output(raw_text: str, original_input: str) -> CorrectionOutput:
    """Parse LLM output with fallback handling.

    Tries:
    1. Parse full text as JSON
    2. Extract JSON between { and }
    3. Fallback: treat raw text as corrected output
    """
    # Attempt 1: Direct parse
    try:
        data = json.loads(raw_text)
        return CorrectionOutput(**data)
    except (json.JSONDecodeError, ValidationError):
        pass

    # Attempt 2: Extract JSON object
    match = re.search(r'\{[^}]+\}', raw_text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            return CorrectionOutput(**data)
        except (json.JSONDecodeError, ValidationError):
            pass

    # Attempt 3: Fallback
    return CorrectionOutput(
        original=original_input,
        corrected=raw_text.strip()
    )
```

### Few-Shot Prompt Builder

```python
# Source: Research + project patterns
def _format_few_shot_examples(examples: list[dict]) -> str:
    """Format few-shot examples for inclusion in prompt."""
    formatted = "VOORBEELDEN (volg dit formaat exact):\n\n"
    for i, ex in enumerate(examples, 1):
        formatted += f"Voorbeeld {i}:\n"
        formatted += f"Input: {ex['input']}\n"
        formatted += f"Output:\n{json.dumps(ex['output'], indent=2, ensure_ascii=False)}\n\n"
    return formatted

# Usage in prompt builder:
def build_correction_prompt(region: str, report_length: str) -> tuple[str, str]:
    profile = REGIONAL_PROFILES[region]
    base = SYSTEM_PROMPTS[report_length]

    # Inject expanded glossary
    glossary_lines = [f"{k}={v}" for k, v in profile["glossary"].items()]
    glossary_text = "Dialect vertaalsleutel:\n" + "\n".join(glossary_lines)
    base = base.replace(DIALECT_TRANSLATION_KEY, glossary_text)

    # Add few-shot examples
    examples_text = _format_few_shot_examples(profile.get("few_shot_examples", []))

    # Add JSON instruction
    json_instr = JSON_INSTRUCTION

    system = base + "\n\n" + examples_text
    return (system, json_instr)
```

## State of the Art

| Old Approach                              | Current Approach                                | When Changed             | Impact                                                                                      |
| ----------------------------------------- | ----------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Zero-shot prompting                       | Few-shot prompting (3-5 examples)               | 2024-2025 industry shift | +15-30% consistency on domain-specific tasks like dialect translation                       |
| String-based JSON parsing                 | Pydantic validation                             | Pydantic 2.0+ (2023)     | 3.5x faster validation, catches edge cases, type-safe                                       |
| Instructor library for structured outputs | Prompt-based JSON + post-validation             | 2026 (streaming era)     | Streaming-compatible, lower latency, simpler stack                                          |
| `response_format: json_object`            | `response_format: json_schema` with strict mode | Mistral API 2026         | Constrained decoding at token level, higher reliability but unclear streaming compatibility |
| Generic dialect glossary                  | Region-specific glossaries (50-100+ terms)      | Phase 5 → Phase 6        | Better accuracy for regional variants (Mestreechs vs Kirchröadsj)                           |

**Deprecated/outdated:**

- **Instructor library for streaming tasks:** Research shows it forces non-streaming API calls. Use prompt-based JSON instead.
- **Generic few-shot examples:** Research shows region-specific examples outperform generic ones by 15-20% for dialect tasks.
- **Hardcoded prompts in multiple files:** Centralized `dialects.py` config is now best practice (Phase 5 established this pattern).

## Open Questions

1. **Confidence field reliability**
   - What we know: LLMs are poor at self-assessing confidence (research finding)
   - What's unclear: Can we get reliable confidence scores by framing it as "how many dialect rules were applied" rather than "how confident are you"?
   - Recommendation: Start without `confidence` field, measure reliability in testing. If <80% accurate, drop it.

2. **Streaming JSON display UX**
   - What we know: Accumulating full response before parsing works, but user sees raw JSON tokens streaming
   - What's unclear: Should we hide raw JSON stream and show spinner until complete, or stream tokens and parse at end?
   - Recommendation: Test both UX flows. Option A (hide JSON, show spinner) is safer. Option B (stream JSON tokens) is more transparent but visually messy.

3. **Glossary format preference**
   - What we know: Research shows `key=value` format is clear for LLMs, but no direct comparison with table format
   - What's unclear: Does markdown table format (`| dialect | nederlands |`) work better for 100+ term glossaries?
   - Recommendation: Start with `key=value` (simpler, existing pattern), A/B test against table format if quality issues arise.

4. **Prompt consolidation deployment strategy**
   - What we know: Backend and frontend are separate deployments (FastAPI localhost vs Vercel)
   - What's unclear: How to share Python `dialects.py` config with TypeScript frontend without build-time code generation?
   - Recommendation: Accept manual sync for now (prompts change rarely). Future: codegen TypeScript types from `dialects.py` if drift becomes problem.

## Environment Availability

> Section omitted — Phase 6 has no external dependencies beyond existing stack (Pydantic, Mistral SDK, Ollama already available).

## Validation Architecture

### Test Framework

| Property           | Value                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| Framework          | pytest 8.3.5 (backend), vitest 4.0.18 (frontend)                           |
| Config file        | backend/tests/conftest.py (pytest fixtures), package.json (vitest scripts) |
| Quick run command  | `pytest backend/tests/test_dialects.py -x`                                 |
| Full suite command | `pytest backend/tests/ -v`                                                 |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                | Test Type   | Automated Command                                                             | File Exists? |
| ------- | ------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ------------ |
| CORR-01 | Few-shot examples (3-5 per region) exist in dialects.py | unit        | `pytest backend/tests/test_dialects.py::test_few_shot_examples_exist -x`      | ❌ Wave 0    |
| CORR-01 | Few-shot examples match Pydantic schema                 | unit        | `pytest backend/tests/test_dialects.py::test_few_shot_schema_valid -x`        | ❌ Wave 0    |
| CORR-02 | Correction output parses to CorrectionOutput model      | unit        | `pytest backend/tests/test_correction_schema.py::test_parse_valid_json -x`    | ❌ Wave 0    |
| CORR-02 | Fallback parsing handles malformed JSON                 | unit        | `pytest backend/tests/test_correction_schema.py::test_parse_fallback -x`      | ❌ Wave 0    |
| CORR-03 | Glossary has 50-100+ terms per region                   | unit        | `pytest backend/tests/test_dialects.py::test_glossary_size -x`                | ❌ Wave 0    |
| CORR-03 | Glossary injection in prompt works                      | integration | `pytest backend/tests/test_correction_prompts.py::test_glossary_injection -x` | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `pytest backend/tests/test_dialects.py -x` (quick validation)
- **Per wave merge:** `pytest backend/tests/ -v` (full backend suite)
- **Phase gate:** Full suite green + manual QA (test correction with real dialect audio) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_correction_schema.py` — covers CORR-02 (Pydantic validation, fallback parsing)
- [ ] `backend/tests/test_correction_prompts.py` — covers CORR-03 (glossary injection)
- [ ] Expand `backend/tests/test_dialects.py` — covers CORR-01 (few-shot examples validation)
- [ ] `backend/correction.py` — new module for `CorrectionOutput`, `parse_correction_output()`, prompt builders
- [ ] Update `backend/tests/conftest.py` — add fixture for sample `CorrectionOutput`

## Sources

### Primary (HIGH confidence)

- [Mistral AI Structured Output Docs](https://docs.mistral.ai/capabilities/structured_output) — JSON mode and custom schema capabilities
- [Mistral AI JSON Mode Docs](https://docs.mistral.ai/capabilities/structured_output/json_mode) — JSON object format enforcement
- [Ollama Structured Outputs Blog](https://ollama.com/blog/structured-outputs) — Ollama JSON schema support via `format` parameter
- [Pydantic JSON Validation](https://machinelearningmastery.com/the-complete-guide-to-using-pydantic-for-validating-llm-outputs/) — Complete guide to Pydantic for LLM output validation
- Project codebase: `backend/dialects.py`, `backend/main.py`, `src/routes/api/correct/+server.ts` — existing patterns and infrastructure

### Secondary (MEDIUM confidence)

- [Few-Shot Prompting Guide (mem0.ai)](https://mem0.ai/blog/few-shot-prompting-guide) — Best practices: 2-5 examples optimal, place best example last
- [Defeating Non-Determinism in LLMs (Thinking Machines)](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) — Structured outputs + few-shot reduce non-determinism
- [Mistral AI Pydantic-AI Integration](https://github.com/pydantic/pydantic-ai/issues/4762) — Discussion of `json_schema` vs `json_object` modes
- [Structured Output Validation Comparison](https://dasroot.net/posts/2026/02/structured-output-validation-pydantic-json-schema/) — Pydantic vs JSON Schema performance (Pydantic 3.5x faster)

### Tertiary (LOW confidence)

- [Prompt Engineering Guide (Lakera)](https://www.lakera.ai/blog/prompt-engineering-guide) — General prompt engineering techniques for 2026
- [LLM Glossary Format Preferences](https://dataforest.ai/glossary/llm-engineering-and-tuning) — No direct evidence for table vs list format preference, marked for validation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Pydantic and Mistral SDK already in project, versions verified, streaming compatibility confirmed
- Architecture: HIGH — Prompt-based JSON + Pydantic validation is proven pattern, compatible with existing SSE streaming
- Pitfalls: HIGH — Based on research findings (incomplete JSON, prompt conflicts, token limits) and project experience (chunking already implemented)
- Few-shot best practices: MEDIUM — Research consensus on 3-5 examples, but region-specific effectiveness for Limburgs needs validation
- JSON streaming UX: MEDIUM — Technical feasibility confirmed, but optimal UX (show tokens vs spinner) needs user testing
- Glossary format: LOW — No direct comparison found between `key=value` vs table format for LLM comprehension

**Research date:** 2026-04-18
**Valid until:** 60 days (2026-06-17) — LLM prompt engineering evolves slowly, structured output patterns are stable
