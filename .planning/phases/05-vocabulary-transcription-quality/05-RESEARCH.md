# Phase 5: Vocabulary & Transcription Quality - Research

**Researched:** 2026-04-17
**Domain:** Speech recognition vocabulary optimization and hallucination detection
**Confidence:** MEDIUM-HIGH

## User Constraints

From CONTEXT.md (discuss-phase decisions):

- **D-01 to D-06:** All delegated to Claude's discretion
- Max 200-300 words per word boost list (PROJECT.md constraint)
- Extend existing `backend/dialects.py` — do not replace
- AssemblyAI `word_boost` + `custom_spelling` as primary API target
- Privacy: no PII, no raw text logging

## Phase Requirements

| ID       | Requirement                         | Success Criteria                                                             |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| TRANS-01 | Dialect profile audit and expansion | All 5 profiles audited, 50-100 high-quality terms per region                 |
| TRANS-02 | Multi-pronunciation lexicon         | System supports multiple pronunciation variants per word                     |
| TRANS-03 | Hallucination detection             | Whisper hallucinations (repetitive phrases, nonsense) automatically detected |

## Standard Stack

### AssemblyAI Vocabulary Boost

- `word_boost`: array of up to 100 terms; boost_param: "high" / "default" / "low"
- Current state: generic `DIALECT_WORD_BOOST` has ~50 words, regional profiles have 5-6 each
- `get_dialect_config(region)` merges generic + regional into single list
- Constraint: >200-300 combined words degrades general accuracy (PROJECT.md decision)

### AssemblyAI Custom Spelling

- `custom_spelling`: dict mapping source_word → target_word
- Used for dialect variant → standard Dutch mapping (e.g., "iech" → "ik")
- Current state: generic `DIALECT_CUSTOM_SPELLING` has ~12 mappings, regional profiles have 3-5 each
- Ideal for multi-pronunciation: map all spelling variants to canonical form

### jiwer 3.1.0 (Phase 4)

- Already installed in `backend/requirements.txt`
- `calculate_metrics()` in `backend/evaluation/metrics.py` — WER/CER measurement
- Can measure before/after improvement from vocabulary changes

### mlx-whisper (Local Transcription)

- Uses `initial_prompt` from dialect config for local transcription
- Separate from AssemblyAI flow but can benefit from same vocabulary lists
- Word boost not directly applicable — uses prompt-based guidance instead

## Architecture Patterns

### Pattern 1: Vocabulary Expansion Strategy

**Recommended:** Shared base + regional overlay (matching existing pattern)

```
DIALECT_WORD_BOOST (generic, ~50 words)
  + REGIONAL_PROFILES[region]["word_boost"] (region-specific, 40-50 words)
  = Combined list per region (90-100 words, within 200-300 limit)
```

Steps:

1. Audit current generic list — remove low-value/duplicate terms
2. Expand each regional profile to 40-50 high-quality region-specific terms
3. Curate from linguistic sources: D'n Dictionair (limburgs.org), Veldeke Mestreech
4. Validate combined list stays under 200-300 words per region

### Pattern 2: Multi-Pronunciation via Custom Spelling

**Recommended:** Expand existing `custom_spelling` dict pattern

```python
# Current pattern in dialects.py:
"custom_spelling": {
    "iech": "ik",
    "geer": "jullie"
}

# Expanded with variants:
"custom_spelling": {
    "iech": "ik",      # standard Limburgish
    "iéch": "ik",      # accented variant
    "ich": "ik",       # German-influenced variant
    "geer": "jullie",
    "gier": "jullie",  # Maastricht variant
}
```

Benefits:

- No new data structure needed — extends existing pattern
- AssemblyAI handles the mapping transparently
- Multiple source forms → single target form

### Pattern 3: Hallucination Detection (Backend)

**Recommended:** Python post-processing in FastAPI backend

Detection methods:

1. **Repetition detection** — consecutive repeated phrases (>5 repeats)
2. **Bag-of-Hallucinations blocklist** — known Whisper phantoms ("Thank you for watching", "Ondertiteling door", etc.)
3. **Levenshtein deduplication** — near-duplicate segments within tolerance

Implementation location: New module `backend/hallucination.py`

- Called after transcription, before returning to frontend
- Returns cleaned text + detected hallucination metadata
- Backend choice aligns with existing architecture patterns (all processing in FastAPI)

### Pattern 4: Profile Prioritization

**Recommended:** Focus on most-used profiles first

Priority order:

1. **limburgs** (generic) — baseline for all users
2. **mestreechs** (Maastricht) — largest dialect community
3. **zittesj** (Sittard) — second-largest
4. **venloos** (Venlo) — distinct from south-Limburgish
5. **kirchroeadsj** (Kerkrade) — most German-influenced, unique vocabulary

All 5 get audit + expansion, but effort distribution follows this priority.

## Common Pitfalls

### Vocabulary Pitfalls

1. **Over-biasing** — too many boost words degrades general accuracy. Stick to ≤100 per regional list, ≤300 combined.
2. **Generic vs specific tension** — common Dutch words in boost list waste slots. Focus on distinctly Limburgish terms.
3. **Accent sensitivity** — AssemblyAI may treat "iech" and "iéch" as different words. Include both in custom_spelling.

### Hallucination Pitfalls

1. **False positives** — legitimate repetition (e.g., "ja ja ja" in conversation) stripped as hallucination. Use min_repeat=5 (conservative).
2. **Language-specific phantoms** — English hallucinations ("Thank you for watching") well-documented; Dutch/Limburgish phantoms less catalogued. Start with known patterns, expand via user feedback.
3. **Timing** — hallucination detection adds latency. Keep processing lightweight (<100ms).

### Integration Pitfalls

1. **Local vs API divergence** — mlx-whisper and AssemblyAI use different vocabulary mechanisms. Maintain one source list, format for each engine.
2. **Regression risk** — vocabulary changes can improve some transcriptions while degrading others. Use WER/CER (Phase 4) to measure.

## Validation Architecture

### Test Strategy

1. **Unit tests** — `backend/tests/test_dialects.py`:
   - Each regional profile has 50-100 word_boost entries
   - No duplicate words in combined (generic + regional) list
   - custom_spelling maps all known variants
   - Hallucination detector catches known patterns
   - Hallucination detector preserves legitimate repetition

2. **Integration tests** — `backend/tests/test_hallucination.py`:
   - Repetition detector with configurable threshold
   - Blocklist matching (exact + fuzzy)
   - Levenshtein deduplication with configurable tolerance
   - Full pipeline: transcription text → hallucination filter → cleaned text

3. **Quality validation** (manual):
   - WER/CER comparison before/after vocabulary changes using Phase 4 evaluation
   - Spot-check: 5-10 sample transcriptions per dialect region
   - Check hallucination detection does not strip legitimate content

### Acceptance Gates

- All 5 profiles: 50-100 word_boost entries (no more than 300 combined per region)
- All 5 profiles: custom_spelling covers common pronunciation variants
- Hallucination detector catches: repetitive phrases (>5 repeats), known phantom strings
- Hallucination detector false positive rate: <5% on test corpus
- All unit tests pass
- WER/CER does not regress (measured via Phase 4 evaluation)

## Data Sources

### Linguistic References

- **D'n Dictionair** (limburgs.org) — 50,000+ Limburgish words across dialects. No API; manual curation needed.
- **Veldeke Mestreech** — Maastricht-specific terminology and spelling conventions
- **Kirchröadsjer Disjelandj** — Kerkrade dialect resources (German-influenced)
- Existing `dialects.py` word lists as seed data

### Hallucination Reference

- Common Whisper hallucinations: "Thank you for watching", "Ondertiteling door", "Please subscribe", whisper-loops
- Research: "Whisper hallucination" patterns documented in OpenAI community + research papers
- Community-maintained blocklists available on GitHub

## Open Questions

1. **Regional profile prioritization**: Which dialects get most usage? Default: all 5 at same depth, limburgs+mestreechs first.
2. **Hallucination aggressiveness**: Conservative (min_repeat=5) vs aggressive (min_repeat=3). Default: conservative.
3. **Local/API vocabulary unification**: Same source lists, different formatting per engine. Default: yes.

---

_Phase: 05-vocabulary-transcription-quality_
_Research completed: 2026-04-17_
