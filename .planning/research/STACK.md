# Stack Research: Limburgse Dialect Quality Improvements

**Domain:** Speech recognition and dialect correction for low-resource languages
**Researched:** 2026-03-28
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology     | Version           | Purpose                              | Why Recommended                                                                                                                                                                                 |
| -------------- | ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **jiwer**      | 4.0.0+            | WER/CER evaluation metrics           | Industry standard for ASR evaluation. Fast C++ implementation via RapidFuzz. Supports WER, MER, WIL, WIP, CER with alignment visualization. Essential for measuring transcription improvements. |
| **instructor** | Latest (Jan 2026) | Structured LLM outputs with Pydantic | 3M+ monthly downloads. Automatic validation, retries, and streaming. Works with Mistral/Ollama. Ensures consistent correction output format and reduces unpredictability.                       |
| **peft**       | 0.18.1+           | Parameter-efficient fine-tuning      | Hugging Face official library for LoRA/QLoRA. Enables Whisper fine-tuning with 90% fewer parameters and <8GB VRAM. Critical for dialect adaptation without full retraining.                     |

### Supporting Libraries for ASR Improvement

| Library          | Version | Purpose                                     | When to Use                                                                                                                                                                                                 |
| ---------------- | ------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **transformers** | Latest  | Whisper model loading and fine-tuning       | If fine-tuning Whisper on Limburgse dialect data. Provides `WhisperProcessor`, `WhisperForConditionalGeneration`. NOT needed if only using mlx-whisper inference.                                           |
| **datasets**     | Latest  | Audio dataset loading and processing        | If fine-tuning. Provides `load_dataset()`, automatic audio decoding via torchcodec/FFmpeg, streaming for large datasets.                                                                                    |
| **evaluate**     | Latest  | MT evaluation metrics (BLEU, METEOR, COMET) | For measuring dialect-to-Dutch translation quality beyond WER. METEOR better than BLEU for semantic similarity. COMET (neural) correlates better with human judgment.                                       |
| **dspy**         | Latest  | Prompt optimization framework               | Alternative to manual prompt engineering. Defines LLM tasks as modules with inputs/outputs, then optimizes prompts algorithmically. Use if Mistral/Ollama consistency remains low after structured outputs. |

### Development Tools

| Tool                           | Purpose                      | Notes                                                                                                                                                                                                                                       |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AssemblyAI Universal-3 Pro** | Advanced STT with prompting  | Released Feb 2026. Supports 1000-word context prompts plus 1000-word keyterms (vs 100 in Universal-Streaming). 57% more accurate on critical terms. EU Dublin endpoint: `streaming.eu.assemblyai.com`. Consider upgrading from Universal-2. |
| **Hugging Face Hub**           | Pre-trained model repository | Access community Whisper fine-tunes for Dutch/low-resource languages. Search `mlx-community` for Apple Silicon models. May find existing Limburgse or similar dialect models.                                                               |
| **WandB / TensorBoard**        | Training monitoring          | If fine-tuning. Track WER/loss curves, compare checkpoints. WandB better for cloud collaboration, TensorBoard for local.                                                                                                                    |

## Installation

### For Evaluation Only (No Fine-Tuning)

```bash
# Python backend (add to backend/requirements.txt)
pip install jiwer>=4.0.0
pip install instructor
pip install evaluate  # Optional: for BLEU/METEOR metrics
```

### For Full Fine-Tuning Capability

```bash
# Add to backend/requirements.txt
pip install jiwer>=4.0.0
pip install instructor
pip install peft>=0.18.1
pip install transformers
pip install datasets
pip install evaluate
pip install accelerate  # For distributed training
pip install wandb  # Optional: experiment tracking
```

## Alternatives Considered

| Recommended          | Alternative             | When to Use Alternative                                                                                                                                                   |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **jiwer**            | `asr_evaluation`        | Never. jiwer is faster (C++), more maintained, same API.                                                                                                                  |
| **PEFT (LoRA)**      | Full fine-tuning        | Only if you have 40GB+ VRAM and large dataset (1000+ hours). Full fine-tuning gets 2-3% better WER but costs 10x compute.                                                 |
| **instructor**       | Manual Pydantic parsing | If using Ollama's native JSON mode. But instructor adds retry logic and validation that manual parsing lacks.                                                             |
| **evaluate (COMET)** | BLEU/METEOR             | BLEU/METEOR are 20+ years old, surface-level, poor for semantic similarity. COMET is neural, correlates better with humans. Use COMET if you have reference translations. |
| **DSPy**             | LangChain               | DSPy for prompt optimization (algorithmic). LangChain for workflow orchestration (chains/agents). Use DSPy if prompt consistency is the problem, not workflow complexity. |

## What NOT to Use

| Avoid                                     | Why                                                                                                                     | Use Instead                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Speech enhancement (e.g., MetricGAN)**  | Recent research (Dec 2025) shows preprocessing with denoising degrades modern ASR by 1-46%. Whisper is robust to noise. | Use raw audio. Only apply if testing shows improvement on your specific data. |
| **Full Whisper fine-tuning without PEFT** | Requires 40GB+ VRAM, long training times, full model storage (1.5GB vs 20MB adapters).                                  | Use PEFT/LoRA for 90% fewer parameters, same quality.                         |
| **`export let` in Svelte components**     | Project uses Svelte 5 runes. Legacy syntax breaks.                                                                      | Use `$props()` only (see CLAUDE.md).                                          |
| **Direct PostHog calls**                  | Privacy rule: always via `src/lib/utils/analytics.ts` wrapper.                                                          | Use wrapper with try/catch.                                                   |

## Stack Patterns by Variant

**If goal is to quickly measure current quality (no training):**

- Install only: `jiwer`, `instructor`, `evaluate`
- Add WER/CER calculation to backend endpoints
- Add semantic metrics (BLEU/METEOR) for correction quality
- Baseline before attempting improvements

**If goal is to improve Whisper accuracy via fine-tuning:**

- Install: `jiwer`, `peft`, `transformers`, `datasets`, `accelerate`
- Collect Limburgse audio plus transcripts (minimum 8 hours per dialect)
- Fine-tune with LoRA adapters (not full model)
- Note: mlx-whisper does NOT support fine-tuning. Must use Hugging Face Whisper or switch inference to `transformers`.

**If goal is to improve Whisper accuracy via prompting only:**

- Use existing mlx-whisper plus AssemblyAI
- Enhance `backend/dialects.py` with better prompts:
  - Glossary format (group terms by semantic category)
  - Track top 50 misrecognized words via jiwer alignment
  - Prioritize high-frequency errors in word_boost
- Consider upgrading to AssemblyAI Universal-3 Pro (1000-word context vs current approach)

**If goal is to improve LLM correction consistency:**

- Install: `instructor` plus `pydantic`
- Define `CorrectedTranscript` model with fields: `corrected_text`, `confidence`, `applied_changes`
- Wrap Mistral/Ollama calls with instructor
- Add structured prompts (DSPy) if randomness persists

## Version Compatibility

| Package                 | Compatible With       | Notes                                                                                                       |
| ----------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **peft 0.18.1**         | transformers >=4.46.0 | Tested on Python 3.9+. Requires `accelerate` for training.                                                  |
| **instructor (latest)** | pydantic >=2.0.0      | Works with Ollama (via openai-compatible API), Mistral API, Anthropic. Requires async client for streaming. |
| **jiwer 4.0.0**         | Python 3.8+           | No heavy dependencies. Uses RapidFuzz (vendored C++).                                                       |
| **datasets (latest)**   | transformers, torch   | Audio loading requires `torchaudio` or `torchcodec`. Handles resampling automatically.                      |
| **evaluate (COMET)**    | transformers, torch   | COMET models are large (~500MB). Download once, cache locally.                                              |

## Integration with Existing Stack

### mlx-whisper Limitation

**Current:** `backend/main.py` uses `mlx_whisper` (Apple Silicon optimized, 3x faster than whisper.cpp)
**Fine-tuning:** mlx-whisper does NOT support fine-tuning. It's inference-only.

**Options:**

1. **Prompt engineering only** — Keep mlx-whisper, improve prompts plus word_boost. No code changes needed.
2. **Fine-tune for API mode** — Fine-tune Hugging Face Whisper with PEFT, deploy to AssemblyAI via custom model OR switch AssemblyAI to Universal-3 Pro (better prompting).
3. **Switch to transformers** — Replace mlx-whisper with `transformers.WhisperForConditionalGeneration`. Slower inference (no MLX optimization) but enables LoRA adapters. Only for local mode.

### AssemblyAI Path (RECOMMENDED for API mode)

- Current: Universal-2, basic word_boost (100 terms)
- Upgrade to: Universal-3 Pro (Feb 2026 release)
  - 1000-word context prompting (vs 224 tokens current)
  - 1000-word keyterms (vs 100 current)
  - 57% better on critical terms
  - Auto-detects dialects (no code change needed)
  - EU Dublin: `streaming.eu.assemblyai.com`
- Cost: Check pricing (may be higher than Universal-2)

### Mistral/Ollama Consistency

**Problem:** Unpredictable correction output
**Root cause:** No structured output schema

**Solution:**

1. Install `instructor`
2. Define Pydantic model:

```python
from pydantic import BaseModel, Field

class CorrectedTranscript(BaseModel):
    corrected_text: str = Field(description="Fully corrected Dutch text")
    confidence: float = Field(ge=0.0, le=1.0, description="Correction confidence 0-1")
    dialect_region: str = Field(description="Detected dialect: mestreechs, zittesj, etc.")
    applied_rules: list[str] = Field(description="Which translation rules were applied")
```

3. Wrap Mistral/Ollama client:

```python
import instructor
from mistralai.client import Mistral

client = instructor.from_mistral(Mistral(api_key=MISTRAL_API_KEY))
resp = client.chat.completions.create(
    model="mistral-large-latest",
    response_model=CorrectedTranscript,
    messages=[...]
)
# resp is validated CorrectedTranscript object, not raw text
```

## Evaluation Metrics to Add

| Metric        | Library  | Purpose                                       | Priority                              |
| ------------- | -------- | --------------------------------------------- | ------------------------------------- |
| **WER**       | jiwer    | Word Error Rate for transcription             | HIGH — baseline measurement           |
| **CER**       | jiwer    | Character Error Rate (better for morphology)  | MEDIUM — Dutch compound words         |
| **Alignment** | jiwer    | Which words were substituted/deleted/inserted | HIGH — find systematic errors         |
| **METEOR**    | evaluate | Semantic similarity (stems, synonyms)         | MEDIUM — correction quality           |
| **BLEU**      | evaluate | N-gram overlap (legacy but common)            | LOW — poor for dialects               |
| **COMET**     | evaluate | Neural MT metric (best human correlation)     | LOW — requires reference translations |

**Implementation path:**

1. Add jiwer to calculate WER/CER per dialect region
2. Log alignment errors to find top misrecognized words
3. Update `backend/dialects.py` word_boost with top errors
4. Add METEOR for correction quality (raw to corrected)
5. Track metrics in PostHog custom events (no PII)

## Research Gaps

**LOW confidence areas:**

- **mlx-whisper fine-tuning:** Search results showed MLX supports LoRA for LLMs (mlx-lm) but no evidence of adapter support for mlx-whisper specifically. May not be possible without forking.
- **Dutch dialect NLP:** Limited tools found. Frog (Dutch NLP suite) supports standard Dutch, not dialects. No Limburgse-specific libraries found.
- **AssemblyAI Universal-3 Pro pricing:** Released Feb 2026, pricing not in search results. May have free tier limits.

**Further research needed:**

- Test whether AssemblyAI Universal-3 Pro auto-detects Limburgse variants (search results claim "regional dialects" but don't specify which)
- Evaluate if PEFT fine-tuning is worth the effort vs better prompting (need to measure current WER first)

## Sources

### HIGH Confidence (Official Docs plus Multiple Sources)

- [jiwer PyPI](https://pypi.org/project/jiwer/) — Version 4.0.0, usage examples
- [jiwer GitHub](https://github.com/jitsi/jiwer) — Official repository, release history
- [instructor PyPI](https://pypi.org/project/instructor/) — Latest version (Jan 2026 release)
- [instructor Docs](https://python.useinstructor.com/) — Official documentation, 3M+ downloads
- [PEFT GitHub](https://github.com/huggingface/peft) — Version 0.18.1 (Jan 2026)
- [PEFT Docs](https://huggingface.co/docs/peft/en/index) — Official Hugging Face documentation
- [AssemblyAI Universal-3 Pro](https://www.assemblyai.com/universal-3-pro) — Official product page
- [AssemblyAI Universal-3 Pro Release](https://www.assemblyai.com/blog/introducing-universal-3-pro) — Feb 2026 announcement
- [Hugging Face Whisper Fine-Tuning](https://huggingface.co/blog/fine-tune-whisper) — Official tutorial

### MEDIUM Confidence (Research Papers plus Tech Blogs)

- [Fine-tuning Whisper on Low-Resource Languages](https://arxiv.org/abs/2412.15726) — Dec 2024 research, Swiss German case study
- [PEFT for Whisper Discussion](https://github.com/openai/whisper/discussions/988) — Community guide for LoRA fine-tuning
- [Speech Enhancement Degrades ASR](https://arxiv.org/pdf/2512.17562) — Dec 2025 research, 46.6% WER increase
- [DSPy Prompt Optimization](https://towardsdatascience.com/systematic-llm-prompt-engineering-using-dspy-optimization/) — Framework comparison
- [METEOR vs BLEU](https://www.researchgate.net/publication/368590740_A_Survey_on_Evaluation_Metrics_for_Machine_Translation) — MT metrics survey

### LOW Confidence (WebSearch Only, Needs Verification)

- mlx-whisper fine-tuning support — No authoritative source found. Likely inference-only.
- Dutch dialect NLP tools — Limited to standard Dutch (Frog, RobBERT). No Limburgse-specific tools.

---

_Stack research for: Limburgse dialect transcription and correction quality improvements_
_Researched: 2026-03-28_
_Confidence: MEDIUM — Core libraries verified, integration paths need testing_
