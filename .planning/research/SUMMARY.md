# Project Research Summary

**Project:** Limburgse Dialect Quality Improvements for BABL
**Domain:** Speech recognition quality enhancement for low-resource regional dialects
**Researched:** 2026-03-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

BABL is a privacy-first speech-to-text tool that transcribes and corrects Limburgse dialect to standard Dutch. The recommended approach for quality improvement focuses on **post-processing optimization** rather than custom model training. Research shows that modern ASR models (Whisper, AssemblyAI Universal-3) are robust enough for dialect recognition when enhanced with custom vocabulary, improved prompting, and systematic evaluation. The key is to layer improvements incrementally while avoiding over-biasing (which degrades general accuracy) and prompt complexity (which confuses LLMs).

The critical path involves: (1) establishing baseline metrics using WER and semantic similarity, (2) optimizing custom vocabulary and LLM prompts through systematic testing, (3) implementing feedback collection to identify real-world failure patterns, and (4) iterating based on data rather than intuition. The existing dual-mode architecture (local Whisper+Ollama vs API AssemblyAI+Mistral) is well-suited for this approach and requires only layered enhancements, not architectural changes.

Key risks include over-biasing vocabulary lists (which forces incorrect matches), Whisper hallucinations from silence/repetition, LLM non-determinism producing inconsistent corrections, and test set overfitting. These are all preventable through measurement-driven iteration: track WER on both dialect and general Dutch, implement hallucination detection, use temperature=0 with few-shot prompting, and maintain separate dev/validation test sets. The roadmap should prioritize infrastructure (evaluation, prompt versioning) before feature expansion to ensure quality improvements are measurable and reproducible.

## Key Findings

### Recommended Stack

The stack research identified essential libraries for evaluation and improvement without requiring custom model training. The focus is on **measurement and optimization tools** rather than deep learning frameworks.

**Core technologies:**

- **jiwer** (4.0.0+): WER/CER evaluation metrics — industry standard, fast C++ implementation, essential for baseline measurement and tracking improvements
- **instructor** (latest): Structured LLM outputs with Pydantic — ensures consistent correction format, reduces non-determinism through schema validation and automatic retries
- **evaluate** (Hugging Face): Semantic similarity metrics (METEOR, COMET) — complements WER by measuring meaning preservation, critical for dialect where literal word matching fails

**Supporting libraries:**

- **peft** (0.18.1+): LoRA fine-tuning for Whisper — only if prompt engineering proves insufficient (deferred to later milestone)
- **transformers/datasets**: Whisper fine-tuning infrastructure — requires switching from mlx-whisper (inference-only) to Hugging Face Whisper
- **SentenceTransformers**: Embedding-based semantic similarity — measures meaning preservation beyond word-level accuracy

**Critical integration notes:**

- mlx-whisper (current local mode) does NOT support fine-tuning; only prompting improvements are possible without switching inference engines
- AssemblyAI Universal-3 Pro (released Feb 2026) offers 1000-word context prompting vs current 100-word limit, 57% better on critical terms
- Mistral/Ollama consistency improves dramatically with structured outputs via instructor + few-shot prompting

### Expected Features

Feature research prioritized practical improvements over complex ML engineering. The focus is on **incremental quality gains** through vocabulary, prompting, and evaluation.

**Must have (table stakes):**

- Custom vocabulary / word boost — already exists (5 regional profiles), needs validation of coverage and weight settings
- Few-shot prompting for LLM — provides structured correction examples, prevents drift (currently missing)
- Structured JSON output from LLM — enforces format schema, enables validation (currently freeform text)
- Error analysis dashboard — visibility into substitutions/deletions/insertions, drives vocabulary expansion (currently missing)
- Confidence scoring — word-level confidence from ASR + correction confidence from LLM (partially implemented)

**Should have (competitive differentiators):**

- Multi-pronunciation lexicon — handles 5 regional variants of same Limburgse word (medium complexity, high linguistic value)
- Dialect-aware glossary/term base — ensures consistent dialect-to-Dutch translation pairs, prevents LLM drift
- User correction feedback loop — learns from manual edits, expands vocabulary and glossary organically
- Prompt versioning and A/B testing — systematic prompt improvement with metrics-driven validation
- Context window for correction — overlap between chunks prevents boundary errors (low complexity, immediate value)

**Defer (v2+):**

- Custom ASR model training — requires 100+ hours labeled audio, ML expertise, massive compute (not viable for small-scale app)
- Real-time LLM correction during transcription — adds latency and complexity; two-step UX (transcribe then correct) is clearer
- Automatic retraining pipeline — over-engineering for current scale; manual quarterly updates sufficient
- Phoneme-level error analysis — advanced diagnostic tool, high complexity, defer until vocabulary/prompt improvements plateaued

**Anti-features (explicitly avoid):**

- Multi-model ensemble for ASR — increases cost and latency without clear benefit given AssemblyAI Universal-3 quality
- Voice biometrics / speaker enrollment — out of scope, privacy concerns
- Inline transcript editing — already scoped out in PROJECT.md, focus on quality first

### Architecture Approach

Architecture research recommends **layered enhancement** of the existing dual-mode pipeline rather than structural changes. New components for evaluation, prompt management, and vocabulary adaptation integrate at specific extension points.

**Major components (new):**

1. **Prompt Registry** (backend/dialects/prompts/) — Version-controlled text files for Whisper initial prompts and LLM correction system prompts per dialect region. Enables A/B testing, rollback, and non-developer contributions. Replaces hardcoded prompt strings.

2. **Vocabulary Manager** (backend/dialects/vocabulary/) — Centralized TSV-based storage for word boost lists with confidence levels and source tracking. Supports core + domain + user-contributed expansions. Replaces hardcoded DIALECT_WORD_BOOST dictionaries.

3. **Pre/Post-Processing Hooks** (backend/processing/) — Pluggable pipeline stages for audio normalization (pre) and dialect cleanup (post). Implements known Whisper substitution error fixes without touching core transcription logic. Enables independent testing of enhancements.

4. **Evaluation Service** (backend/evaluation/) — Calculates WER/CER and semantic similarity, stores evaluation pairs as JSONL for analysis. Provides `/evaluation/submit` endpoint for frontend feedback collection. Enables data-driven iteration.

5. **Quality Feedback UI** (src/lib/components/quality-feedback.svelte) — User interface for thumbs up/down votes, inline word correction suggestions, and reference text input. Feeds Evaluation Service to identify real-world failure patterns.

**Architectural patterns:**

- Pipeline hook system for pluggable enhancements
- Version-controlled prompts with metadata (author, date, confidence level)
- JSONL storage for evaluation data (append-only, no DB complexity)
- Semantic similarity via embeddings (complements WER)

**Integration strategy:**

- Frontend remains unchanged except for Quality Feedback component
- Backend adds evaluation layer and refactors config loading (prompts, vocab)
- Existing transcription/correction endpoints gain optional `prompt_version` parameter
- No breaking changes to API contracts or data flows

### Critical Pitfalls

Research identified 12 pitfalls specific to dialect ASR improvement. Top 5 most critical:

1. **Over-Biasing Vocabulary Destroys General Accuracy** — Adding too many custom words (>200-300) forces incorrect matches, degrading overall WER. Limit to 50-100 high-value terms per dialect, track WER on general Dutch separately from dialect-specific content.

2. **Whisper Hallucinations from Silence and Repetition** — Silence at beginning/end of audio triggers looping phrases ("transcribed by..."). Trim silences, use VAD for live transcription, set temperature=0.0-0.2, implement repetitive n-gram detection.

3. **LLM Correction Inconsistency (Non-Determinism)** — Same input produces different outputs across runs even at temperature=0 due to floating-point arithmetic and batch context. Use few-shot examples, structured outputs via instructor, log prompt+response pairs, implement majority voting for critical content.

4. **Test Set Bias and Overfitting** — Optimizing on small test set (10-20 samples) produces excellent test WER but poor production performance. Use stratified test sets (5+ speakers per dialect × age × gender), maintain separate dev and held-out validation sets, A/B test in production before full rollout.

5. **WER as Misleading Success Metric** — WER treats all errors equally, penalizes valid dialect variations that preserve meaning. Use Semantic Word Error Rate (LLM-as-judge) as primary metric, track keyword recall and intent preservation separately from raw WER.

**Additional high-priority pitfalls:**

- Prompt over-specification confuses LLMs (keep under 200 words, use few-shot examples instead of rules)
- Regression in existing pipeline functionality (freeze integration tests before changes)
- Audio preprocessing artifacts degrade ASR (test raw audio first, only preprocess if proven beneficial)
- Dictionary inconsistency across dialect variants (no standard Limburgse orthography; implement phonetic normalization)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes **measurement infrastructure before feature expansion**:

### Phase 0: Pre-Work and Validation (1-2 days)

**Rationale:** Establish baseline and prevent regressions before making changes. Research shows production ASR degrades 7.5x-16x from benchmarks when deployment conditions differ.

**Delivers:** Documented current behavior, frozen regression tests, baseline WER/semantic metrics per dialect region.

**Addresses:** Pitfall 6 (regression in pipeline), Pitfall 5 (WER as only metric), Pitfall 8 (audio preprocessing validation)

**Tasks:**

- Document v1.0 critical path behaviors (live transcription, WebSocket reconnection, SSE streaming)
- Create manual regression checklist (or minimal automated tests if time permits)
- Validate current audio preprocessing (16kHz downsampling) doesn't introduce artifacts
- Establish WER/CER baseline on test samples per dialect region

### Phase 1: Evaluation Infrastructure (3-5 days)

**Rationale:** Can't improve what you can't measure. Research emphasizes data-driven iteration over intuition-based prompt tweaking.

**Delivers:** Backend evaluation service, WER/semantic similarity calculation, JSONL storage, Quality Feedback UI component.

**Uses:** jiwer (WER/CER), evaluate (semantic metrics), SentenceTransformers (embeddings)

**Implements:** Evaluation Service (backend/evaluation/), Quality Feedback UI

**Avoids:** Pitfall 5 (WER-only metrics), Pitfall 4 (test set bias through production feedback collection)

**Research flags:** Standard pattern (ASR evaluation is well-documented), no deep research needed.

**Tasks:**

- Install jiwer, evaluate, sentence-transformers
- Implement Evaluation Service with JSONL storage
- Add `/evaluation/submit` and `/evaluation/stats` endpoints
- Create Quality Feedback UI component (thumbs up/down, corrections, reference text)
- Integrate feedback UI into transcribe page

### Phase 2: Prompt and Vocabulary Optimization (5-7 days)

**Rationale:** Research shows prompt engineering + vocabulary boosting delivers 80% of quality improvement without model training. Structured outputs reduce LLM non-determinism.

**Delivers:** Prompt Registry with versioned templates, Vocabulary Manager with TSV-based storage, few-shot prompting, structured JSON outputs from LLM, optimized word boost lists.

**Uses:** instructor (structured outputs), Prompt Registry pattern, Vocabulary Manager pattern

**Implements:** Prompt Registry (backend/dialects/prompts/), Vocabulary Manager (backend/dialects/vocabulary/)

**Avoids:** Pitfall 3 (LLM inconsistency via structured outputs), Pitfall 1 (over-biasing via validation), Pitfall 4 (prompt over-specification)

**Research flags:** Needs dialect-specific research — consult Limburgse linguistic resources for phonetic normalization rules, validate multi-pronunciation patterns.

**Tasks:**

- Migrate existing prompts to versioned text files in Prompt Registry
- Migrate word boost lists to TSV format in Vocabulary Manager
- Implement instructor integration for Mistral/Ollama correction
- Define Pydantic schema for corrections: `{corrected_text, confidence, dialect_region, applied_rules}`
- Add 3-5 few-shot examples per dialect region to correction prompts
- Audit existing word boost lists: validate coverage, remove duplicates, limit to 50-100 terms
- Add `prompt_version` parameter to `/transcribe` and `/correct` endpoints

### Phase 3: Post-Processing and Refinement (3-5 days)

**Rationale:** Hook-based post-processing enables targeted fixes for known Whisper errors without modifying core pipeline. Context overlap prevents chunk boundary errors.

**Delivers:** Hook pipeline infrastructure, dialect cleanup hook with substitution rules, context window overlap for chunked corrections, hallucination detection.

**Uses:** Hook Pipeline pattern

**Implements:** Pre/Post-Processing Hooks (backend/processing/)

**Avoids:** Pitfall 2 (Whisper hallucinations via detection), Pitfall 6 (regressions via isolated hooks)

**Research flags:** Standard pattern (ASR post-processing is well-documented), no deep research needed.

**Tasks:**

- Implement HookPipeline and PostHook base class
- Create DialectCleanupHook with known Whisper substitution error fixes
- Integrate hooks into `/transcribe` and `/transcribe-live` endpoints
- Add hallucination detection (repetitive n-gram filter)
- Implement context window overlap (50-100 words between chunks)
- Validate hooks don't break existing features (regression tests)

### Phase 4: Production Validation and Iteration (ongoing)

**Rationale:** Research shows test set performance doesn't predict production performance. Canary testing and A/B testing prevent silent quality degradation.

**Delivers:** A/B testing framework, prompt version comparison analytics, production monitoring, feedback-driven vocabulary expansion.

**Uses:** Evaluation Service data, Prompt Registry versioning

**Avoids:** Pitfall 5 (test set overfitting via production validation), Pitfall 1 (over-biasing via monitoring)

**Research flags:** Standard pattern (A/B testing is well-documented), no deep research needed.

**Tasks:**

- Analyze collected evaluation pairs for error patterns
- Create v2 prompts based on data (not intuition)
- Implement A/B testing: route % of traffic to v2 prompts
- Compare WER/semantic scores between prompt versions
- Expand word boost lists based on substitution error analysis
- Implement production monitoring: alert if WER degrades >10%

### Phase Ordering Rationale

**Why evaluation first:** Research consistently emphasizes measurement-driven iteration. Without WER and semantic similarity baselines, improvements are guesswork. Pitfall 4 (test set overfitting) and Pitfall 5 (WER-only metrics) both stem from inadequate evaluation infrastructure.

**Why prompt optimization before post-processing:** Prompt engineering delivers the highest value-to-effort ratio. Research shows modern ASR models are robust; the bottleneck is LLM correction consistency (Pitfall 3). Structured outputs + few-shot prompting address this directly. Post-processing hooks are valuable but secondary.

**Why vocabulary optimization is cautious:** Pitfall 1 (over-biasing) is the most dangerous early-stage mistake. Research shows custom vocabulary helps until it doesn't — the tipping point varies by dialect and domain. Phase 2 establishes the infrastructure (Vocabulary Manager) but defers aggressive expansion until Phase 4's data analysis identifies gaps.

**Why production validation is separate:** Pitfall 4 (test set overfitting) shows that dev performance doesn't predict production performance. Phase 4 closes the loop by collecting real-world feedback and A/B testing changes before full rollout.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (Vocabulary Optimization):** Limburgse linguistic resources research needed — identify authoritative phonetic normalization rules, multi-pronunciation patterns across 5 regions, canonical forms vs variants. Low confidence on availability of structured linguistic resources (research found limited Limburgse-specific NLP tools).

- **Phase 4 (Production Validation):** Semantic similarity threshold tuning — what's "good enough" semantic score? Research provides tools (SentenceTransformers, COMET) but not domain-specific thresholds for dialect-to-Dutch translation quality.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Evaluation):** WER/CER calculation is industry standard, jiwer is well-documented, evaluation service architecture is straightforward JSONL storage.

- **Phase 3 (Post-Processing):** Hook pattern is common in ASR pipelines, hallucination detection via n-gram analysis is well-established.

- **Phase 4 (A/B Testing):** Prompt versioning and A/B testing are standard LLMOps practices, multiple references found.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                        |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stack        | MEDIUM     | Core libraries verified (jiwer, instructor, peft), integration paths clear. LOW confidence on mlx-whisper fine-tuning support (likely inference-only).       |
| Features     | HIGH       | Custom vocabulary and prompt engineering are well-documented industry standards. Multi-pronunciation lexicon is MEDIUM (requires linguistic expertise).      |
| Architecture | HIGH       | Layered enhancement approach is sound, patterns (Hook Pipeline, Prompt Registry, JSONL storage) are proven. Integration points with existing code are clear. |
| Pitfalls     | MEDIUM     | Critical pitfalls (over-biasing, hallucinations, LLM non-determinism) are well-researched. Limburgse-specific challenges are MEDIUM (limited dialect data).  |

**Overall confidence:** MEDIUM-HIGH

Stack and architecture recommendations are solid. Feature prioritization is well-supported by research. Pitfall mitigation strategies are actionable. The main uncertainty is Limburgse-specific linguistic resources — phonetic normalization rules, canonical spellings, pronunciation variants. This can be addressed incrementally during Phase 2 through consultation with native speakers or dialect linguistics research.

### Gaps to Address

**Limburgse linguistic resources:** Research found limited Limburgse-specific NLP tools or standardized orthography. The dialect lacks formal grammar rules, and written forms are phonetic transliterations that vary by individual. **Mitigation:** Phase 2 should include consultation with dialect experts or review of VarDial 2026 research on dialect normalization. Accept that perfect consistency is impossible; focus on most common variations.

**AssemblyAI Universal-3 Pro pricing and availability:** Released Feb 2026, search results show features (1000-word context prompting, 57% better on critical terms) but not pricing or free tier limits. **Mitigation:** Test Universal-3 Pro in Phase 2 if within budget; compare WER improvement vs cost increase relative to Universal-2.

**Semantic similarity threshold calibration:** Research provides tools (SentenceTransformers, COMET) but not domain-specific thresholds for "good enough" dialect-to-Dutch correction quality. **Mitigation:** Phase 1 should establish baseline semantic scores on test set, Phase 4 should correlate semantic scores with user satisfaction votes to find practical threshold.

**mlx-whisper fine-tuning support:** Search results showed MLX supports LoRA for LLMs (mlx-lm) but no evidence of adapter support for mlx-whisper specifically. **Mitigation:** Assume mlx-whisper is inference-only. If Phase 4 data shows prompt engineering plateaus, consider switching to Hugging Face Whisper + PEFT for local mode (trade inference speed for fine-tuning capability).

**Ollama concurrency limits:** Research shows concurrency capacity varies by hardware (2-4 concurrent streams on RTX 4090). Current semaphore limit (3 requests) may be too high or too low. **Mitigation:** Phase 1 load testing should validate Ollama concurrency under realistic load, tune OLLAMA_NUM_PARALLEL and semaphore limit accordingly.

**Test set representativeness:** Current test samples (if they exist) may not be stratified by age, gender, or sub-dialect. **Mitigation:** Phase 0 should audit test set composition, Phase 1 should add production samples monthly to maintain representativeness.

## Sources

### Primary (HIGH confidence)

**Stack:**

- [jiwer PyPI](https://pypi.org/project/jiwer/) and [GitHub](https://github.com/jitsi/jiwer) — WER/CER calculation, version 4.0.0
- [instructor PyPI](https://pypi.org/project/instructor/) and [Docs](https://python.useinstructor.com/) — Structured LLM outputs, 3M+ downloads
- [PEFT GitHub](https://github.com/huggingface/peft) and [Docs](https://huggingface.co/docs/peft/en/index) — Version 0.18.1, LoRA fine-tuning
- [AssemblyAI Universal-3 Pro](https://www.assemblyai.com/universal-3-pro) — Official product page, Feb 2026 release
- [Hugging Face Whisper Fine-Tuning](https://huggingface.co/blog/fine-tune-whisper) — Official tutorial

**Features:**

- [AssemblyAI Speech Recognition Documentation](https://docs.assemblyai.com/core-transcription) — Custom vocabulary, word boost
- [Mistral AI Prompting Guide](https://docs.mistral.ai/guides/prompting_capabilities) — Few-shot prompting, JSON mode
- [Gemma Prompt Engineering](https://www.promptingguide.ai/models/gemma) and [Official Docs](https://ai.google.dev/gemma/docs/core/prompt-structure) — System instructions, formatting
- [Speech Recognition Accuracy Production Metrics](https://deepgram.com/learn/speech-recognition-accuracy-production-metrics) — WER, CER, evaluation
- [W3C Pronunciation Lexicon Specification](https://www.w3.org/TR/pronunciation-lexicon/) — PLS format standard

**Architecture:**

- [NVIDIA NeMo ASR Pipeline Architecture](https://docs.nvidia.com/nemo/curator/latest/about/concepts/audio/asr-pipeline.html) — Pipeline patterns
- [Hugging Face ASR Pipeline](https://huggingface.co/learn/audio-course/en/chapter2/asr_pipeline) — Standard architecture
- [Latitude Prompt Versioning Best Practices](https://latitude-blog.ghost.io/blog/prompt-versioning-best-practices/) — Versioning patterns
- [Deepgram Semantic Error Rate](https://deepgram.com/learn/semantic-error-rate-asr-accuracy-metric) — Semantic WER vs traditional WER

**Pitfalls:**

- [Deepgram Top 6 Dutch ASR Challenges](https://deepgram.com/learn/top-6-dutch-asr-challenges) — Dialect challenges
- [AssemblyAI How Accurate is Speech-to-Text](https://www.assemblyai.com/blog/how-accurate-speech-to-text) — Production vs benchmark performance
- [Gladia What is WER](https://www.gladia.io/blog/what-is-wer) — WER limitations
- [Whisper Hallucination Solutions](https://memo.ac/blog/whisper-hallucinations) — Repetition issues, silence triggers
- [How Ollama Handles Parallel Requests](https://www.glukhov.org/llm-performance/ollama/how-ollama-handles-parallel-requests/) — Concurrency patterns

### Secondary (MEDIUM confidence)

**Research papers:**

- [Fine-tuning Whisper on Low-Resource Languages](https://arxiv.org/abs/2412.15726) — Swiss German case study, Dec 2024
- [Speech Enhancement Degrades ASR](https://arxiv.org/pdf/2512.17562) — Preprocessing artifacts, Dec 2025
- [Non-Determinism of Deterministic LLM Settings](https://arxiv.org/html/2408.04667v5) — Temperature=0 variance
- [Contextual Biasing Whisper](https://aclanthology.org/2024.lrec-main.262.pdf) — Custom vocabulary patterns
- [VarDial 2026 Dialect Normalization](https://aclanthology.org/2024.vardial-1.13.pdf) — Phonetic normalization research

**Community guides:**

- [PEFT for Whisper Discussion](https://github.com/openai/whisper/discussions/988) — LoRA fine-tuning community guide
- [DSPy Prompt Optimization](https://towardsdatascience.com/systematic-llm-prompt-engineering-using-dspy-optimization/) — Alternative to manual prompting
- [ASR Buyers Guide Benchmarks to Production](https://deepgram.com/learn/asr-buyers-guide-benchmarks-to-production-tests) — Production validation
- [Troubleshooting Ollama API Rate Limiting](https://markaicode.com/troubleshoot-ollama-api-rate-limiting-performance-optimization/) — Concurrency tuning

### Tertiary (LOW confidence, needs validation)

- mlx-whisper fine-tuning support — No authoritative source found. Likely inference-only.
- Dutch dialect NLP tools — Limited to standard Dutch (Frog, RobBERT). No Limburgse-specific tools found.
- AssemblyAI Universal-3 Pro pricing — Released Feb 2026, pricing not in search results.
- Limburgse phonetic normalization rules — Research found VarDial patterns but not Limburgse-specific orthography standards.

---

_Research completed: 2026-03-28_
_Ready for roadmap: yes_
