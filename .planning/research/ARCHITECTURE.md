# Architecture Research: Dialect Quality Improvements

**Domain:** Dialect transcription quality improvement
**Researched:** 2026-03-28
**Confidence:** HIGH

## Integration Strategy

Dialect quality improvements integrate into the existing BABL dual-mode architecture through **layered enhancement points** without disrupting the proven two-phase (transcription → correction) pipeline. The architecture adds new components for evaluation, prompt management, and vocabulary adaptation while preserving compatibility with both local (Whisper + Ollama) and API (AssemblyAI + Mistral) processing modes.

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend (SvelteKit)                        │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Recording UI │  │ Transcription│  │  Correction  │         │
│  │              │→ │   Display    │→ │   Display    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                           ↓                  ↓                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          NEW: Quality Feedback UI Component              │  │
│  │  - Semantic accuracy vote (thumbs up/down)               │  │
│  │  - Word correction suggestions                           │  │
│  │  - Inline editing with diff tracking                     │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                   NEW: Evaluation Layer                         │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Semantic   │  │    WER       │  │   Feedback   │         │
│  │  Similarity  │  │  Calculator  │  │   Collector  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│               Backend Proxies (API Routes)                      │
│  ┌────────────────┐  ┌────────────────┐                        │
│  │  /transcribe   │  │    /correct    │                        │
│  └────────┬───────┘  └────────┬───────┘                        │
├───────────┼──────────────────────┼──────────────────────────────┤
            │                      │
            ↓                      ↓
┌───────────────────────────────────────────────────────────────┐
│              Backend (FastAPI - localhost:8000)                │
├───────────────────────────────────────────────────────────────┤
│  NEW: Dialect Config Layer (backend/dialects/)                │
│  ┌──────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Prompt Registry  │  │   Vocabulary   │  │  Pre/Post     │ │
│  │  (versioned)     │  │   Manager      │  │  Processors   │ │
│  └────────┬─────────┘  └────────┬───────┘  └───────┬───────┘ │
│           │                     │                   │          │
│  ┌────────┴─────────────────────┴───────────────────┴───────┐ │
│  │          Processing Pipeline Orchestrator                 │ │
│  │  - Pre-processing hooks (audio normalization)            │ │
│  │  - Transcription (Whisper/AssemblyAI)                    │ │
│  │  - Post-processing hooks (dialect cleanup)               │ │
│  │  - Correction (Ollama/Mistral) with context injection    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  NEW: Evaluation Service                                      │
│  ┌──────────────────┐  ┌────────────────┐                    │
│  │  Metrics Engine  │  │   Data Store   │                    │
│  │  (WER, Semantic) │  │  (eval pairs)  │                    │
│  └──────────────────┘  └────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
            │                      │
            ↓                      ↓
┌───────────────────────────────────────────────────────────────┐
│                     External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Whisper/ASR  │  │ AssemblyAI   │  │   Mistral    │        │
│  │   (Local)    │  │  (EU Dublin) │  │  (EU Server) │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

## New Components

### 1. Prompt Registry (backend/dialects/prompts/)

**Purpose:** Version-controlled storage for Whisper initial prompts and LLM correction system prompts per dialect region.

**Structure:**

```
backend/dialects/prompts/
├── registry.py              # Prompt versioning/loading logic
├── whisper/
│   ├── limburgs_v1.txt      # Generic Limburgs initial prompt (current)
│   ├── limburgs_v2.txt      # Enhanced with phonetic patterns
│   ├── mestreechs_v1.txt    # Mestreechs-specific prompt
│   ├── zittesj_v1.txt       # Zittesj-specific prompt
│   └── ...
├── correction/
│   ├── cleanup_v1.txt       # Phase 1: Limburgish cleanup (current)
│   ├── cleanup_v2.txt       # Enhanced dialect retention
│   ├── formatting_v1.txt    # Phase 2: Dutch formatting (current SYSTEM_PROMPTS)
│   ├── formatting_v2.txt    # Improved context preservation
│   └── ...
└── metadata.json            # Prompt version metadata (author, date, description, confidence)
```

**API:**

```python
from dialects.prompts.registry import PromptRegistry

registry = PromptRegistry()

# Get latest version of a prompt
prompt = registry.get_prompt(
    category="whisper",       # whisper | correction
    region="mestreechs",      # limburgs | mestreechs | zittesj | venloos | kirchroeadsj
    version="latest"          # latest | v1 | v2 | ...
)

# Get metadata
meta = registry.get_metadata(category="whisper", region="mestreechs", version="v2")
# Returns: {"author": "...", "created": "...", "description": "...", "confidence": "experimental"}
```

**Integration:** Modify `backend/dialects.py::get_dialect_config()` to load prompts from registry instead of hardcoded strings.

---

### 2. Vocabulary Manager (backend/dialects/vocabulary/)

**Purpose:** Centralized, expandable vocabulary for word boosting (AssemblyAI) and hotwords (Whisper).

**Structure:**

```
backend/dialects/vocabulary/
├── manager.py               # Vocabulary loading/expansion logic
├── core/
│   ├── limburgs_core.txt    # Base Limburgs vocabulary (current DIALECT_WORD_BOOST)
│   ├── mestreechs_core.txt  # Mestreechs-specific words
│   └── ...
├── domain/
│   ├── medical.txt          # Optional domain-specific expansions
│   ├── legal.txt
│   └── ...
└── custom/
    └── user_additions.txt   # User-contributed words (manual review required)
```

**Format (TSV):**

```
word	boost_level	confidence	source
ich	high	verified	native_speaker
sjat	high	verified	corpus
meziek	medium	experimental	user_contributed
```

**API:**

```python
from dialects.vocabulary.manager import VocabularyManager

vocab = VocabularyManager()

# Get word boost list for AssemblyAI
word_boost = vocab.get_word_boost(
    region="mestreechs",
    domains=["core"],         # core | medical | legal | custom
    min_confidence="verified" # verified | experimental
)
# Returns: ["iech", "miéch", "vaan", "sjat", ...]

# Get hotwords string for Whisper
hotwords = vocab.get_hotwords_string(region="mestreechs", domains=["core"])
# Returns: "iech miéch diéch uuch vaan dees dink sjat kalle ..."
```

**Integration:** Modify `backend/dialects.py::REGIONAL_PROFILES` to use `VocabularyManager` instead of hardcoded lists.

---

### 3. Pre/Post-Processing Hooks (backend/processing/)

**Purpose:** Pluggable pipeline stages for audio normalization, dialect-specific cleanup, and output enhancement.

**Structure:**

```
backend/processing/
├── hooks.py                 # Hook registration and execution
├── pre_hooks/
│   ├── audio_normalize.py   # Audio level normalization
│   ├── noise_reduction.py   # Optional noise gate
│   └── ...
└── post_hooks/
    ├── dialect_cleanup.py   # Replace known Whisper substitution errors
    ├── deduplication.py     # Remove repeated phrases
    └── ...
```

**Hook Interface:**

```python
from processing.hooks import PreHook, PostHook

class DialectCleanupHook(PostHook):
    """Replace known Whisper substitution errors (e.g., 'ich' → 'ik' → 'ich')."""

    def __init__(self, region: str):
        self.substitutions = load_substitution_rules(region)

    def process(self, text: str, metadata: dict) -> str:
        """Apply dialect-specific text corrections."""
        for pattern, replacement in self.substitutions.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text
```

**Pipeline Registration:**

```python
from processing.hooks import HookPipeline

pipeline = HookPipeline()
pipeline.register_pre_hook("audio_normalize", AudioNormalizeHook())
pipeline.register_post_hook("dialect_cleanup", DialectCleanupHook(region="mestreechs"))

# Execute in /transcribe endpoint
result = mlx_whisper.transcribe(chunk_path, **transcribe_kwargs)
cleaned_text = pipeline.execute_post_hooks(result["text"], metadata={"region": region})
```

**Integration:** Modify `backend/main.py::/transcribe` and `/transcribe-live` to execute hooks before returning segments.

---

### 4. Evaluation Service (backend/evaluation/)

**Purpose:** Calculate metrics (WER, semantic similarity) and store evaluation pairs for continuous improvement.

**Structure:**

```
backend/evaluation/
├── service.py               # Evaluation API
├── metrics/
│   ├── wer.py               # Word Error Rate calculation (Levenshtein)
│   ├── semantic.py          # Semantic similarity via embeddings
│   └── ...
├── storage/
│   ├── jsonl_store.py       # JSONL file storage for eval pairs
│   └── models.py            # Pydantic models for eval data
└── endpoints.py             # FastAPI routes
```

**Data Model:**

```python
from pydantic import BaseModel

class EvaluationPair(BaseModel):
    id: str                     # UUID
    timestamp: str              # ISO 8601
    region: str                 # mestreechs | zittesj | ...
    raw_transcription: str      # Whisper/AssemblyAI output
    corrected_text: str         # Ollama/Mistral output
    reference_text: str | None  # User-provided ground truth (optional)
    semantic_score: float | None # 0.0-1.0, higher = better
    wer: float | None           # Word error rate vs reference
    user_vote: str | None       # thumbs_up | thumbs_down
    corrections: list[dict]     # [{"wrong": "...", "correct": "...", "position": int}, ...]
    metadata: dict              # {"transcribe_mode": "local", "quality": "medium", ...}
```

**API Endpoints:**

```python
# backend/main.py additions

from evaluation.endpoints import evaluation_router
app.include_router(evaluation_router, prefix="/evaluation", tags=["evaluation"])

# POST /evaluation/submit
# - Accepts EvaluationPair JSON
# - Calculates WER (if reference_text provided)
# - Calculates semantic similarity (if reference_text provided)
# - Stores to JSONL file (backend/evaluation/data/eval_pairs.jsonl)

# GET /evaluation/stats
# - Returns aggregate metrics per region (avg WER, semantic score, vote ratio)

# GET /evaluation/export
# - Returns all eval pairs as JSONL download (for analysis)
```

**Storage:**

```
backend/evaluation/data/
└── eval_pairs.jsonl         # One JSON object per line
```

**Integration:** Frontend calls `POST /evaluation/submit` when user provides feedback (thumbs up/down, corrections, or reference text).

---

### 5. Quality Feedback UI Component (src/lib/components/quality-feedback.svelte)

**Purpose:** Collect user feedback on transcription/correction quality with minimal friction.

**Features:**

- **Semantic accuracy vote:** Thumbs up/down for "meaning preserved?"
- **Inline corrections:** Click word → suggest correct dialect word
- **Reference text input:** Paste known-correct transcription for WER calculation
- **Diff viewer:** Show original vs corrected with highlights

**Props:**

```typescript
interface Props {
	raw: string; // Raw transcription
	corrected: string; // Corrected text
	region: string; // mestreechs | zittesj | ...
	onSubmit: (feedback: FeedbackData) => void;
}

interface FeedbackData {
	vote: 'thumbs_up' | 'thumbs_down' | null;
	corrections: Array<{ wrong: string; correct: string; position: number }>;
	reference_text: string | null;
}
```

**UI Flow:**

1. Correction completes → component appears below corrected text
2. User votes thumbs up (meaning correct) → immediately submits, hides feedback UI
3. User votes thumbs down → reveals correction tools:
   - Click word in corrected text → popup: "Suggest correct version"
   - Or: paste full reference text in textarea
4. User submits → sends to `POST /evaluation/submit` → hides feedback UI

**Integration:** Add to `src/routes/transcribe/+page.svelte` after corrected text display, conditionally shown when `status === 'idle' && corrected !== ''`.

---

## Modified Components

### 1. backend/dialects.py

**Changes:**

- Replace hardcoded `REGIONAL_PROFILES` dictionaries with calls to `PromptRegistry` and `VocabularyManager`
- Add `get_prompt_version()` helper for A/B testing different prompt versions
- Keep existing `get_dialect_config()` signature for backwards compatibility

**Example:**

```python
from dialects.prompts.registry import PromptRegistry
from dialects.vocabulary.manager import VocabularyManager

prompt_registry = PromptRegistry()
vocab_manager = VocabularyManager()

def get_dialect_config(region_key: str, prompt_version: str = "latest"):
    """Retrieve configuration for a regional dialect with specified prompt version."""
    return {
        "initial_prompt": prompt_registry.get_prompt("whisper", region_key, prompt_version),
        "word_boost": vocab_manager.get_word_boost(region_key, domains=["core"]),
        "custom_spelling": vocab_manager.get_custom_spelling(region_key),
        "translation_key": prompt_registry.get_prompt("correction", region_key, prompt_version, category_suffix="translation_key")
    }
```

---

### 2. backend/main.py

**Changes:**

- Add `HookPipeline` initialization in `lifespan` startup
- Execute pre-hooks before Whisper/AssemblyAI transcription
- Execute post-hooks after transcription, before returning segments
- Add `/evaluation/*` router
- Add optional `prompt_version` parameter to `/transcribe` and `/correct` endpoints

**Example (transcription endpoint):**

```python
from processing.hooks import HookPipeline, DialectCleanupHook

pipeline = HookPipeline()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Existing warmup
    asyncio.create_task(warmup_ollama())

    # NEW: Register processing hooks
    pipeline.register_post_hook("dialect_cleanup", DialectCleanupHook())

    yield

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    lang: str = Form("li"),
    region: str = Form("limburgs"),
    prompt_version: str = Form("latest"),  # NEW
):
    # ... existing audio processing ...

    # NEW: Load prompt version from registry
    dialect_config = get_dialect_config(region, prompt_version)

    # ... existing Whisper call ...

    for segment in result.get("segments", []):
        text = segment.get("text", "").strip()

        # NEW: Execute post-processing hooks
        cleaned_text = pipeline.execute_post_hooks(text, metadata={"region": region})

        if cleaned_text:
            loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps({'type': 'segment', 'text': cleaned_text})}\n\n")
```

---

### 3. src/routes/transcribe/+page.svelte

**Changes:**

- Add `promptVersion` state variable with dropdown selector (hidden by default, shown via "Advanced" toggle)
- Add `<QualityFeedback>` component import and conditional rendering
- Add `submitFeedback()` function to POST feedback to `/evaluation/submit`
- Optionally: Add WER/semantic score display if reference text available

**Example:**

```svelte
<script lang="ts">
	import QualityFeedback from '$lib/components/quality-feedback.svelte';

	let promptVersion = $state('latest'); // latest | v1 | v2 | ...
	let showFeedback = $state(false);

	async function submitFeedback(feedback: FeedbackData) {
		const evalPair = {
			region: selectedRegion,
			raw_transcription: raw,
			corrected_text: corrected,
			reference_text: feedback.reference_text,
			user_vote: feedback.vote,
			corrections: feedback.corrections,
			metadata: {
				transcribe_mode: transcribeMode,
				quality: quality,
				prompt_version: promptVersion
			}
		};

		await fetch('http://localhost:8000/evaluation/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(evalPair)
		});

		showFeedback = false;
	}
</script>

<!-- After corrected text display -->
{#if status === 'idle' && corrected}
	<QualityFeedback {raw} {corrected} region={selectedRegion} onSubmit={submitFeedback} />
{/if}
```

---

## Data Flow Changes

### 1. Enhanced Transcription Flow (with Post-Processing)

```
Audio Input
    ↓
[Pre-Hook: Audio Normalize] (optional, future)
    ↓
Whisper/AssemblyAI Transcription
    ↓
[Post-Hook: Dialect Cleanup] (NEW — replaces known substitution errors)
    ↓
Raw Transcription Displayed
    ↓
User triggers correction
    ↓
[Correction: Ollama/Mistral with versioned prompt] (MODIFIED)
    ↓
Corrected Text Displayed
    ↓
[Quality Feedback UI] (NEW — collect user vote + corrections)
    ↓
Evaluation Service Storage (NEW)
```

### 2. Evaluation Data Flow

```
User provides feedback
    ↓
Frontend: POST /evaluation/submit with EvaluationPair
    ↓
Backend: Calculate WER (if reference_text)
    ↓
Backend: Calculate Semantic Similarity (if reference_text)
    ↓
Backend: Append to eval_pairs.jsonl
    ↓
Frontend: Hide feedback UI, show "Thanks!"
    ↓
(Async) Periodic analysis: Export JSONL → analyze patterns → update prompts/vocabulary
```

### 3. Prompt Version Testing Flow (A/B Testing)

```
Developer creates new prompt version (e.g., whisper/mestreechs_v2.txt)
    ↓
Adds metadata to metadata.json (confidence: experimental)
    ↓
User selects "Advanced" → chooses prompt version "v2"
    ↓
Transcription uses v2 prompt
    ↓
User provides feedback via Quality Feedback UI
    ↓
Evaluation pair stored with metadata.prompt_version = "v2"
    ↓
Analyze: Compare WER/semantic scores for v1 vs v2
    ↓
If v2 > v1: Promote v2 to "latest"
```

---

## Architectural Patterns

### Pattern 1: Pipeline Hook System

**What:** Pluggable pre/post-processing stages that can be enabled/disabled without modifying core transcription logic.

**When to use:** When adding optional enhancements (noise reduction, dialect cleanup, deduplication) that should be testable independently.

**Trade-offs:**

- **Pro:** Modular, testable, easy to A/B test individual hooks
- **Con:** Adds indirection, potential performance overhead if many hooks

**Example:**

```python
class HookPipeline:
    def __init__(self):
        self.pre_hooks: list[PreHook] = []
        self.post_hooks: list[PostHook] = []

    def register_pre_hook(self, name: str, hook: PreHook):
        self.pre_hooks.append((name, hook))

    def execute_post_hooks(self, text: str, metadata: dict) -> str:
        for name, hook in self.post_hooks:
            if hook.should_run(metadata):
                text = hook.process(text, metadata)
        return text
```

---

### Pattern 2: Version-Controlled Prompts with Metadata

**What:** Store prompts as versioned text files with JSON metadata (author, date, confidence level) instead of hardcoding in Python.

**When to use:** When prompts need frequent iteration, A/B testing, or rollback capability.

**Trade-offs:**

- **Pro:** Easy to version, compare, rollback; non-devs can edit prompts
- **Con:** Requires registry abstraction; more files to manage

**Example:**

```json
// backend/dialects/prompts/metadata.json
{
	"whisper/mestreechs_v2": {
		"author": "dialect_expert_1",
		"created": "2026-03-28",
		"description": "Enhanced with French loanword phonetics",
		"confidence": "experimental",
		"parent_version": "v1"
	}
}
```

---

### Pattern 3: Evaluation Data Collection via JSONL

**What:** Store evaluation pairs as newline-delimited JSON for easy appending, streaming, and analysis.

**When to use:** When collecting continuous feedback without database complexity.

**Trade-offs:**

- **Pro:** Simple, append-only, easy to export/analyze with jq/Python
- **Con:** No indexing, requires full scan for queries (fine for <100k records)

**Example:**

```jsonl
{"id":"uuid1","timestamp":"2026-03-28T10:00:00Z","region":"mestreechs","raw_transcription":"ich bin nao de maat","corrected_text":"Ik ben naar de markt gegaan","user_vote":"thumbs_up","wer":null,"semantic_score":null}
{"id":"uuid2","timestamp":"2026-03-28T10:05:00Z","region":"zittesj","raw_transcription":"hae zag dat","corrected_text":"Hij zei dat","reference_text":"Hij zei dat het niet goed was","wer":0.25,"semantic_score":0.92,"user_vote":"thumbs_down"}
```

---

### Pattern 4: Semantic Similarity via Embeddings

**What:** Use sentence embeddings (e.g., SentenceTransformers) to calculate cosine similarity between reference and corrected text, measuring meaning preservation vs word-level accuracy.

**When to use:** When dialect variations preserve meaning but inflate WER (e.g., "ich" vs "ik").

**Trade-offs:**

- **Pro:** Captures semantic accuracy, reduces false negatives from WER
- **Con:** Requires embedding model (storage + compute), less interpretable than WER

**Example:**

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def semantic_similarity(text1: str, text2: str) -> float:
    embeddings = model.encode([text1, text2])
    return float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])

# Usage
score = semantic_similarity(
    "ich bin nao de maat gegange",  # Raw Limburgs
    "Ik ben naar de markt gegaan"   # Corrected Dutch
)
# Returns: ~0.95 (high semantic similarity despite different words)
```

---

## Scaling Considerations

| Scale                      | Architecture Adjustments                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current (single user, dev) | JSONL file storage sufficient. Local Whisper + Ollama for testing. Prompt registry as text files.                                                                                                |
| 10-100 users               | Add SQLite database for eval pairs (faster queries). Consider Redis cache for prompt registry. Monitor JSONL file size (rotate at 10MB).                                                         |
| 100+ users                 | Migrate to PostgreSQL for eval storage. Add prompt analytics dashboard. Consider separating evaluation service to dedicated server. Implement prompt deployment pipeline (dev → staging → prod). |

### Scaling Priorities

1. **First bottleneck:** JSONL file size (>10MB = slow full scans) → **Fix:** Add rotation (monthly archives) or migrate to SQLite.
2. **Second bottleneck:** Prompt loading latency (re-reading text files on every request) → **Fix:** In-memory cache with file watcher for updates.
3. **Third bottleneck:** Semantic similarity calculation (embedding model inference) → **Fix:** Batch processing (async queue) or use lighter model (DistilBERT).

---

## Anti-Patterns

### Anti-Pattern 1: Hardcoding Prompts in Application Code

**What people do:** Embed prompt strings directly in Python/TypeScript files for "simplicity."

**Why it's wrong:**

- No version history (git diff shows whole prompt changed, not what changed)
- Can't A/B test without code deployment
- Non-technical users (dialect experts) can't contribute

**Do this instead:** Use prompt registry with versioned text files and metadata.

---

### Anti-Pattern 2: Ignoring Semantic Accuracy (WER-Only Evaluation)

**What people do:** Only measure Word Error Rate for dialect transcription quality.

**Why it's wrong:**

- Dialect variations ("ich" vs "ik") inflate WER despite correct meaning
- Doesn't capture goal: "meaning must be correct"
- Misleads optimization (chasing low WER may sacrifice comprehension)

**Do this instead:** Calculate both WER (for phonetic accuracy) and semantic similarity (for meaning preservation). Prioritize semantic score for dialect work.

---

### Anti-Pattern 3: No Feedback Collection (Blind Iteration)

**What people do:** Improve prompts/vocabulary based on developer intuition without user feedback.

**Why it's wrong:**

- No data on what's actually failing in production
- Can't measure impact of changes (did v2 improve over v1?)
- Misses edge cases only real users encounter

**Do this instead:** Implement Quality Feedback UI from day 1. Collect thumbs up/down + corrections. Analyze patterns before changing prompts.

---

### Anti-Pattern 4: Monolithic Prompt (No Separation of Concerns)

**What people do:** Combine Whisper initial prompt + correction system prompt + translation key into one giant string.

**Why it's wrong:**

- Can't test/improve components independently (is Whisper or LLM failing?)
- Hard to version (changing one part requires versioning entire prompt)
- Difficult to reuse across regions (Mestreechs vs Zittesj share cleanup logic)

**Do this instead:** Separate concerns:

- `whisper/` prompts: phonetic guidance only
- `correction/cleanup_` prompts: dialect preservation
- `correction/formatting_` prompts: Dutch translation
- `translation_key/` prompts: reference vocabulary

---

## Integration Points

### External Services

| Service              | Integration Pattern                                  | Notes                                                            |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| AssemblyAI           | REST API via SvelteKit proxy (`/api/transcribe-api`) | Existing. Add `word_boost` from VocabularyManager.               |
| Mistral AI           | REST API via SvelteKit proxy (`/api/correct`)        | Existing. Add `system_prompt` from PromptRegistry.               |
| Whisper (mlx)        | Direct call in FastAPI backend (`/transcribe`)       | Existing. Add `initial_prompt` from PromptRegistry + post-hooks. |
| Ollama               | HTTP API via FastAPI backend (`/correct`)            | Existing. Add `system_prompt` from PromptRegistry.               |
| SentenceTransformers | Python library in evaluation service                 | NEW. Load model in FastAPI `lifespan`, cache embeddings.         |

### Internal Boundaries

| Boundary                    | Communication                 | Notes                                                   |
| --------------------------- | ----------------------------- | ------------------------------------------------------- |
| Frontend ↔ Backend          | HTTP/SSE/WebSocket            | Existing. Add `POST /evaluation/submit` for feedback.   |
| Backend ↔ PromptRegistry    | File I/O (read text files)    | NEW. Cache in memory, watch for file changes.           |
| Backend ↔ VocabularyManager | File I/O (read TSV files)     | NEW. Cache in memory, reload on change.                 |
| Backend ↔ EvaluationService | In-process (same FastAPI app) | NEW. Store to JSONL file, async write queue.            |
| PromptRegistry ↔ Git        | Version control               | NEW. Prompts versioned in git, metadata tracks lineage. |

---

## Build Order (Suggested)

Based on dependencies and value delivery:

### Phase 1: Infrastructure (No UI Impact)

**Goal:** Establish extensibility points without breaking existing flows.

1. **Prompt Registry** (backend/dialects/prompts/)
   - Create directory structure
   - Migrate existing prompts to versioned files
   - Implement `PromptRegistry.get_prompt()`
   - Update `get_dialect_config()` to use registry
   - **Validation:** Existing transcription/correction still works with "latest" version

2. **Vocabulary Manager** (backend/dialects/vocabulary/)
   - Create directory structure
   - Migrate existing word lists to TSV format
   - Implement `VocabularyManager.get_word_boost()`
   - Update `get_dialect_config()` to use manager
   - **Validation:** AssemblyAI word boosting still works

3. **Hook Pipeline** (backend/processing/)
   - Implement `HookPipeline` and `PostHook` base class
   - Add `DialectCleanupHook` with substitution rules
   - Register in `lifespan`, execute in `/transcribe`
   - **Validation:** Post-processing reduces known Whisper errors (manual test)

### Phase 2: Evaluation (Data Collection Starts)

**Goal:** Start collecting real-world feedback data.

4. **Evaluation Service Backend** (backend/evaluation/)
   - Implement `EvaluationPair` model and JSONL storage
   - Add `POST /evaluation/submit` and `GET /evaluation/stats` endpoints
   - Implement WER calculation (Levenshtein distance)
   - **Validation:** Can POST eval pair, see stats, export JSONL

5. **Quality Feedback UI** (src/lib/components/quality-feedback.svelte)
   - Create Svelte component with thumbs up/down
   - Add inline correction suggestion (click word → popup)
   - Add reference text input
   - Integrate into `/transcribe` page
   - **Validation:** User can vote, submit corrections, see "Thanks!" message

6. **Semantic Similarity** (backend/evaluation/metrics/semantic.py)
   - Integrate SentenceTransformers model
   - Calculate similarity in `/evaluation/submit`
   - Display score in `/evaluation/stats`
   - **Validation:** Reference text → eval pair → semantic score calculated

### Phase 3: Iteration (Prompt/Vocab Improvement)

**Goal:** Use collected data to improve dialect quality.

7. **Prompt Versioning** (backend/dialects/prompts/)
   - Create v2 prompts based on evaluation data patterns
   - Add `metadata.json` with confidence levels
   - Add `prompt_version` parameter to endpoints
   - Add "Advanced" UI toggle in `/transcribe` page
   - **Validation:** Can select v2 prompt, compare metrics with v1

8. **Vocabulary Expansion** (backend/dialects/vocabulary/)
   - Analyze eval pairs for missed dialect words
   - Add to `user_additions.txt` with confidence levels
   - Implement `VocabularyManager.add_word()` API
   - **Validation:** New words appear in AssemblyAI word_boost

9. **Analytics Dashboard** (optional, low priority)
   - Simple HTML page reading JSONL file
   - Show WER/semantic trends over time
   - Compare prompt versions
   - **Validation:** Can visualize quality improvements

---

## Success Metrics

**Infrastructure (Phase 1):**

- [ ] Prompt registry supports versioning (can load v1, v2, latest)
- [ ] Vocabulary manager loads from TSV, returns word lists
- [ ] Post-processing hooks reduce known substitution errors (manual verification)
- [ ] No regressions in existing transcription/correction flows

**Evaluation (Phase 2):**

- [ ] Users can submit feedback (thumbs up/down + corrections)
- [ ] Eval pairs stored with metadata (region, mode, prompt version)
- [ ] WER calculated for reference text submissions
- [ ] Semantic similarity calculated with >0.85 correlation to human judgment

**Iteration (Phase 3):**

- [ ] v2 prompts show measurable improvement (WER or semantic score)
- [ ] Vocabulary expansions reduce "unknown word" errors
- [ ] Can A/B test prompt versions with real users
- [ ] Feedback loop: data → analysis → prompt update → deployment

---

## Sources

**ASR Quality Improvement:**

- [ScienceDirect: High-resource ASR methods in low-resource environments](https://www.sciencedirect.com/science/article/pii/S0167639324001225)
- [arXiv: Enhancing Low-Resource ASR through Versatile TTS](https://arxiv.org/html/2410.16726v1)
- [arXiv: Adapting Whisper for Regional Dialects](https://arxiv.org/html/2501.08502v1)

**Vocabulary Adaptation:**

- [ACL Anthology: Contextual Biasing Whisper](https://aclanthology.org/2024.lrec-main.262.pdf)
- [arXiv: Contextual Biasing for Domain-specific Vocabulary](https://arxiv.org/html/2410.18363v1)
- [Deepgram: Best Speech-to-Text APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)

**Prompt Engineering:**

- [ScienceDirect: Optimizing translation for low-resource languages](https://www.sciencedirect.com/science/article/pii/S2666827025000325)
- [Lakera: Ultimate Guide to Prompt Engineering 2026](https://www.lakera.ai/blog/prompt-engineering-guide)
- [Springer: Reconstructing Translation Process via LLM Prompt Engineering](https://link.springer.com/chapter/10.1007/978-981-95-4632-9_6)

**Evaluation Metrics:**

- [Deepgram: Semantic Error Rate](https://deepgram.com/learn/semantic-error-rate-asr-accuracy-metric)
- [Gladia: What is Word Error Rate](https://www.gladia.io/blog/what-is-wer)
- [Hugging Face: Evaluation metrics for ASR](https://huggingface.co/learn/audio-course/en/chapter5/evaluation)

**Human-in-the-Loop:**

- [arXiv: Human Transcription Quality Improvement](https://arxiv.org/html/2309.14372)
- [Shaip: Designing HITL Systems for AI Evaluation](https://www.shaip.com/blog/designing-effective-human-in-the-loop-systems-for-ai-evaluation/)
- [Comet: Human-in-the-Loop Review Workflows](https://www.comet.com/site/blog/human-in-the-loop/)

**Prompt Versioning:**

- [Latitude: Prompt Versioning Best Practices](https://latitude-blog.ghost.io/blog/prompt-versioning-best-practices/)
- [Braintrust: What is Prompt Versioning](https://www.braintrust.dev/articles/what-is-prompt-versioning)
- [Calmops: LLMOps Architecture 2026](https://calmops.com/architecture/llmops-architecture-managing-llm-production-2026/)

**ASR Pipeline Architecture:**

- [NVIDIA NeMo: ASR Pipeline Architecture](https://docs.nvidia.com/nemo/curator/latest/about/concepts/audio/asr-pipeline.html)
- [Hugging Face: ASR Pipeline](https://huggingface.co/learn/audio-course/en/chapter2/asr_pipeline)
- [Corti: Medical-grade ASR Pipelines](https://www.corti.ai/stories/why-voice-first-healthcare-ai-needs-medical-grade-asr-pipelines)

---

_Architecture research for: Dialect transcription quality improvement_
_Researched: 2026-03-28_
