# Feature Landscape

**Domain:** Dialect transcription and correction quality improvement
**Researched:** 2026-03-28

## Table Stakes

Features users expect for dialect quality improvement. Missing = product feels incomplete.

| Feature                             | Why Expected                                                                                                                | Complexity | Notes                                                                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom vocabulary / word boost**  | Industry standard for ASR accuracy improvement. AssemblyAI supports up to 1000 terms, Whisper supports prompt parameter     | Low        | AssemblyAI: `word_boost` param (low/default/high weight). Max 1000 terms, 6 words each. Already exists as `wordBoost` feature (5 regional profiles) — validate coverage and weight settings |
| **Few-shot prompting for LLM**      | Standard approach for consistency in dialect normalization tasks. Provides examples of correct input→output transformations | Low-Medium | Mistral and Ollama/Gemma support few-shot in prompt. Requires curating 3-5 representative examples per dialect region (15-25 total). Provides structured output patterns                    |
| **Structured JSON output from LLM** | Prevents drift in correction format, enables programmatic validation of results                                             | Low        | Mistral supports JSON mode via `response_format`, Ollama via `format: json` parameter. Define schema: `{original, corrected, confidence, changes[]}`                                        |
| **Error analysis dashboard**        | Users need visibility into what's failing (substitutions/deletions/insertions) to validate improvements                     | Medium     | Calculate WER/CER per session, categorize error types, show top 10 problematic words. Store minimal metadata (no PII). Links to PostHog analytics                                           |
| **Confidence scoring**              | Indicates which corrections are uncertain, builds trust through transparency                                                | Low        | Both AssemblyAI and Whisper provide word-level confidence. LLM adds correction confidence via prompt instruction. Display in UI where confidence < 0.7                                      |

## Differentiators

Features that set product apart. Not expected, but highly valued for dialect work.

| Feature                               | Value Proposition                                                                                                                                          | Complexity  | Notes                                                                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-pronunciation lexicon**       | Handles multiple valid pronunciations per Limburgse word across 5 regions. Limburgs has greatest linguistic distance from standard Dutch among NL dialects | Medium-High | W3C PLS format or simple JSON mapping. Requires linguistic expertise to build (50-200 terms initially). Can integrate with AssemblyAI word boost or Whisper prompt. Iterate based on error analysis   |
| **Dialect-aware glossary/term base**  | Ensures consistent translation of recurring dialect→standard pairs. Prevents LLM drift (probabilistic output causes terminology inconsistency over time)   | Medium      | JSON mapping `{dialect_term: {standard: "...", region: [...], notes: "..."}}`. Pre-populate from known substitutions. User feedback expands it. RAG integration for LLM prompt context                |
| **User correction feedback loop**     | Learns from manual edits to improve model freshness. Natural feedback loop when users fix errors                                                           | Medium      | Store user edits (original_transcript → corrected_transcript) per session. Weekly analysis identifies patterns. Update word boost / glossary accordingly. Federated learning approach (no PII stored) |
| **Prompt versioning and A/B testing** | Enables systematic improvement of LLM correction prompts. Measures which prompt variations produce better results                                          | Medium      | Store prompt templates with version tags. Track WER/CER per prompt version. A/B test new prompts on % of traffic. Requires baseline measurement capability                                            |
| **Phoneme-level error analysis**      | Reveals systematic acoustic confusions (e.g., "ich" → wrong phoneme). Deeper diagnostic than word-level WER                                                | High        | Requires phoneme confusion matrix. CMU Dict for reference phonemes. Identifies whether errors are acoustic (ASR) vs linguistic (LLM). Advanced feature, defer to later milestone                      |
| **Context window for correction**     | Process text in chunks with overlap to preserve context across boundaries. Prevents chunk-boundary errors                                                  | Low-Medium  | Already chunks at 400 words. Add 50-100 word overlap between chunks. Pass previous chunk summary to LLM for context continuity. Improves coherence for long transcripts                               |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature                                      | Why Avoid                                                                                                                          | What to Do Instead                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Custom ASR model training**                     | Requires massive labeled dialect corpus (100s of hours), ML expertise, compute resources. Not viable for small-scale app           | Use pre-trained models (Whisper, AssemblyAI Universal-3) + post-processing (word boost, custom vocab, lexicon)                     |
| **Real-time LLM correction during transcription** | Adds latency, complexity. Two-step process (transcribe → correct) provides better UX with clear progress                           | Keep existing two-step flow: show raw transcription first, then correction. Users validate transcription quality before correction |
| **Automatic retraining pipeline**                 | Over-engineering for current scale. Manual iteration on word lists and prompts is sufficient                                       | Periodic manual review of error logs, user feedback. Update word boost / glossary quarterly based on patterns                      |
| **Multi-model ensemble for ASR**                  | Increases cost (multiple API calls), latency, complexity. Single high-quality model (AssemblyAI Universal-3) handles dialects well | AssemblyAI Universal-3 Pro already has deep dialect understanding. Focus on post-processing and correction improvements            |
| **Voice biometrics / speaker enrollment**         | Out of scope for transcription task. Adds privacy concerns (PII risk)                                                              | Rely on existing speaker diarization if needed for multi-speaker scenarios. Don't store voice prints                               |
| **Inline transcript editing**                     | Already scoped out in PROJECT.md. Adds UI complexity before quality is validated                                                   | Users copy to external editor. Focus milestone on quality, not editing UX                                                          |

## Feature Dependencies

```
Custom vocabulary (word boost) → baseline for all improvements
    ↓
Error analysis dashboard → identifies gaps in vocabulary
    ↓
Multi-pronunciation lexicon → fills gaps from error analysis
    ↓
Dialect glossary → handles LLM correction consistency
    ↓
User feedback loop → continuously improves vocabulary + glossary
    ↓
Prompt versioning → optimizes LLM correction prompts
    ↓
Context window optimization → improves long-form coherence
```

**Critical path:** Word boost validation → Error analysis → Glossary → Few-shot prompting

## MVP Recommendation

**Phase 1: Validate and enhance existing foundation**

1. **Audit existing word boost lists** (5 regional profiles) — Are they comprehensive? Correct formatting? Validate against AssemblyAI guidelines (remove punctuation, spoken form, max 1000 terms)
2. **Add error analysis logging** — Track WER/CER, substitution/deletion/insertion breakdown per session. Minimal storage (aggregate metrics only, no PII)
3. **Implement confidence scoring UI** — Show word-level confidence from ASR, correction confidence from LLM. Flag uncertain results

**Phase 2: Improve LLM consistency**

1. **Few-shot prompting** — Add 3-5 examples per dialect region to correction prompts. Test with Mistral (Medium quality mode) first
2. **Structured JSON output** — Enforce schema: `{original, corrected, confidence, changes[]}`. Validates programmatically
3. **Dialect glossary v1** — JSON mapping of 50-100 known dialect→standard pairs from error analysis. Inject into LLM prompt via RAG or direct inclusion

**Phase 3: Iterative refinement**

1. **User feedback loop** — Collect manual corrections (opt-in), analyze patterns weekly, update word boost + glossary
2. **Prompt versioning** — A/B test prompt variations (e.g., with/without glossary, different few-shot examples). Measure WER improvement
3. **Context window overlap** — Add 50-100 word overlap for long transcripts to preserve coherence across chunks

**Defer to later milestones:**

- Multi-pronunciation lexicon (requires linguistic expertise, W3C PLS format)
- Phoneme-level error analysis (advanced diagnostic, high complexity)
- Advanced audio preprocessing (noise reduction, spectral enhancement — AssemblyAI already handles this)

## Complexity Notes

**Low (1-2 days):**

- Confidence scoring UI
- Structured JSON output
- Context window overlap
- Custom vocabulary audit

**Medium (3-7 days):**

- Error analysis dashboard
- Few-shot prompting
- Dialect glossary v1
- User feedback loop
- Prompt versioning

**High (2-3 weeks):**

- Multi-pronunciation lexicon (linguistic research + integration)
- Phoneme-level error analysis (requires phoneme mapping, confusion matrix)
- Advanced RAG integration for glossary (embedding search, vector DB)

## Technical Constraints

| Constraint                                   | Impact                                                 | Mitigation                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **AssemblyAI word boost limit: 1000 terms**  | May not cover all dialect variations across 5 regions  | Prioritize most frequent errors from analysis. Use 200 terms per region baseline                                       |
| **Mistral/Ollama prompt length limits**      | Few-shot examples + glossary may exceed context window | Gemma3: 8K tokens, Mistral: 128K tokens. Use glossary subset (top 50 terms) in prompt, full glossary via RAG if needed |
| **Privacy (no PII logging)**                 | Can't store raw transcripts for error analysis         | Store only aggregate metrics (WER, error type counts), top confused word pairs (de-identified)                         |
| **No custom model training**                 | Limited to pre-trained model capabilities              | Focus on post-processing: word boost, lexicon, prompt engineering, glossary                                            |
| **Limburgse linguistic distance from Dutch** | Whisper trained on standard Dutch may struggle         | AssemblyAI Universal-3 Pro has better dialect handling. Prioritize API mode for quality improvements                   |

## Sources

### ASR Accuracy Improvement

- [An overview of high-resource automatic speech recognition methods for low-resource environments](https://www.sciencedirect.com/science/article/pii/S0167639324001225)
- [Phoneme-Aware Hierarchical Augmentation for Low-Resource Speech Recognition](https://pmc.ncbi.nlm.nih.gov/articles/PMC12298586/)
- [Whisper vs Google Speech-to-Text: Complete 2026 Comparison](https://is4.ai/blog/our-blog-1/whisper-vs-google-speech-to-text-comparison-2026-267) — LOW confidence (comparison guide)

### Custom Vocabulary and Word Boost

- [AssemblyAI Speech Recognition Documentation](https://docs.assemblyai.com/core-transcription) — HIGH confidence
- [Introducing Keyterms Prompting to Streaming STT](https://www.assemblyai.com/blog/streaming-keyterms-prompting) — HIGH confidence
- [Adding custom vocabularies on Whisper](https://discuss.huggingface.co/t/adding-custom-vocabularies-on-whisper/29311) — MEDIUM confidence

### LLM Prompt Engineering and Consistency

- [Mistral AI Prompting Guide](https://docs.mistral.ai/guides/prompting_capabilities) — HIGH confidence
- [The Ultimate Guide to Prompt Engineering in 2026](https://www.lakera.ai/blog/prompt-engineering-guide) — MEDIUM confidence
- [Few-Shot Prompting Techniques](https://www.promptingguide.ai/techniques/fewshot) — HIGH confidence
- [Best LLM for Translation in 2026](https://www.hakunamatatatech.com/our-resources/blog/best-llm-for-translation) — LOW confidence
- [Optimizing translation for low-resource languages](https://www.sciencedirect.com/science/article/pii/S2666827025000325) — MEDIUM confidence (academic research)

### Gemma and Ollama Specific

- [Ollama System Prompts and Temperature Tuning Guide](https://dasroot.net/posts/2026/01/ollama-system-prompts-temperature-tuning-guide/) — MEDIUM confidence (2026 blog guide)
- [Gemma Prompt Engineering](https://www.promptingguide.ai/models/gemma) — HIGH confidence
- [Gemma formatting and system instructions](https://ai.google.dev/gemma/docs/core/prompt-structure) — HIGH confidence (official docs)

### Error Analysis and Evaluation

- [AI Transcription Accuracy Guide 2026](https://summarizemeeting.com/en/blog/ai-transcription-accuracy-guide) — MEDIUM confidence
- [Speech Recognition Accuracy: Production Metrics & Optimization](https://deepgram.com/learn/speech-recognition-accuracy-production-metrics) — HIGH confidence
- [How to Use Phoneme Error Rate to Debug Acoustic Model Weaknesses](https://deepgram.com/learn/phoneme-error-rate-guide-evaluating-speech-models) — HIGH confidence
- [Word Error Rate (WER) in Speech Recognition](https://www.futurebeeai.com/knowledge-hub/word-error-rate-wer) — MEDIUM confidence
- [Metrics for ASR Performance: WER and CER](https://apxml.com/courses/applied-speech-recognition/chapter-6-evaluating-deploying-asr-systems/asr-performance-metrics-wer-cer) — HIGH confidence

### Audio Preprocessing

- [Noise-Robust Speech Recognition Techniques](https://deepgram.com/learn/noise-robust-speech-recognition-techniques) — HIGH confidence
- [How do speech recognition systems manage audio preprocessing?](https://milvus.io/ai-quick-reference/how-do-speech-recognition-systems-manage-audio-preprocessing) — MEDIUM confidence
- [Speech Recognition Optimization: Debugging Accent Variation and Background Noise](https://johal.in/speech-recognition-optimization-debugging-accent-variation-and-background-noise-issues-2/) — LOW confidence (blog post)

### Post-processing and Correction

- [ASR Error Correction: Methods & Advances](https://www.emergentmind.com/topics/asr-error-correction-aec) — MEDIUM confidence
- [Post-Editing Error Correction Algorithm For Speech Recognition](https://arxiv.org/pdf/1203.5255) — MEDIUM confidence (2012 paper, may be dated)
- [SPELLING CORRECTION THROUGH REWRITING OF ASR LATTICES](https://arxiv.org/html/2409.16469v1) — MEDIUM confidence (2024 research)

### Pronunciation Lexicons

- [W3C Pronunciation Lexicon Specification (PLS)](https://www.w3.org/TR/pronunciation-lexicon/) — HIGH confidence (standard)
- [What is a Lexicon in Speech Recognition?](https://www.rev.com/resources/what-is-a-lexicon-in-speech-recognition) — MEDIUM confidence
- [How to Customize Riva ASR Vocabulary and Pronunciation with Lexicon Mapping](https://docs.nvidia.com/deeplearning/riva/user-guide/docs/tutorials/asr-customize-vocabulary-and-lexicon.html) — HIGH confidence (NVIDIA docs)
- [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) — HIGH confidence (reference resource)

### User Feedback and Iterative Improvement

- [The Gift of Feedback: Improving ASR Model Quality by Learning from User Corrections](https://arxiv.org/html/2310.00141) — MEDIUM confidence (academic research)
- [Interactive Real-Time Speaker Diarization Correction with Human Feedback](https://arxiv.org/html/2509.18377v1) — MEDIUM confidence (2025 research)
- [How Feedback Loops in Human-in-the-Loop AI Improve Model Accuracy](https://www.nextwealth.com/blog/how-feedback-loops-in-human-in-the-loop-ai-improve-model-accuracy-over-time/) — MEDIUM confidence

### Terminology and Glossary Management

- [Terminology Management: The Way To Consistent Translations](https://laoret.com/blog/terminology-management/) — MEDIUM confidence
- [Translation Glossary Software](https://taia.io/product/glossary) — LOW confidence (product marketing)
- [Why Your Translations Need Terminology Management](https://www.atltranslate.com/blog/terminology-management) — MEDIUM confidence

### Dutch and Limburgse Dialect Challenges

- [Top 6 Dutch ASR Challenges: Diverse Dialects, Data, and Dictionaries](https://deepgram.com/learn/top-6-dutch-asr-challenges) — HIGH confidence
- [Clearing the Transcription Hurdle in Dialect Corpus Building: The Corpus of Southern Dutch Dialects](https://pubmed.ncbi.nlm.nih.gov/33733130/) — MEDIUM confidence (academic)
- [Limburgish Wikipedia](https://en.wikipedia.org/wiki/Limburgish) — MEDIUM confidence (background context)
- [Language bias in ASR: Challenges and consequences](https://www.gladia.io/blog/asr-language-bias) — MEDIUM confidence
- [Enhancing Standard and Dialectal Frisian ASR](https://arxiv.org/html/2502.04883) — MEDIUM confidence (similar regional language)

### Practical Constraints and Approaches

- [Do I Need A Custom Speech Recognition Model?](https://www.assemblyai.com/blog/do-i-need-a-custom-speech-recognition-model) — HIGH confidence
- [Facing ASR Challenges? See How aiOla Outperforms Generic Speech Models](https://aiola.ai/blog/generic-asr-models-challenges/) — LOW confidence (vendor blog)
- [Fine-tuning ASR Models: Key Definitions, Mechanics, and Use Cases](https://www.gladia.io/blog/fine-tuning-asr-models) — MEDIUM confidence

## Confidence Assessment

| Area                           | Confidence | Notes                                                                                                      |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------- |
| Custom vocabulary / word boost | HIGH       | Official AssemblyAI docs, industry standard approach                                                       |
| Few-shot prompting             | HIGH       | Multiple sources, official Mistral + Gemma docs                                                            |
| Structured JSON output         | HIGH       | Documented in Mistral API, Ollama supports format param                                                    |
| Error analysis (WER/CER)       | HIGH       | Industry standard metrics, multiple authoritative sources                                                  |
| Multi-pronunciation lexicon    | MEDIUM     | W3C standard exists, but Limburgse-specific implementation needs linguistic expertise                      |
| User feedback loop             | MEDIUM     | Research demonstrates feasibility (federated learning approach), practical implementation needs validation |
| Phoneme-level analysis         | MEDIUM     | Advanced technique documented in Deepgram resources, high complexity for BABL scale                        |
| Limburgse dialect challenges   | MEDIUM     | Limited research on Limburgs specifically, but Dutch dialect challenges well-documented                    |

## Open Questions

1. **Limburgse linguistic resources:** Are there existing Limburgse pronunciation dictionaries or glossaries we can leverage? (Requires domain expert consultation)
2. **Word boost effectiveness:** What WER improvement can we realistically expect from enhanced word boost lists? (Requires A/B testing)
3. **Regional variation:** How much overlap is there in dialect terms across the 5 regions vs. region-specific terms? (Affects word boost budget allocation)
4. **LLM prompt length:** At what point does glossary injection degrade Gemma3 (4b/12b) performance due to context length? (Requires testing)
5. **User correction patterns:** Will users actually provide feedback, or is this a theoretical feature? (Requires UX validation)
