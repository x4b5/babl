---
phase: 05-vocabulary-transcription-quality
plan: 01
subsystem: backend
tags:
  - dialect
  - vocabulary
  - transcription
  - AssemblyAI
dependency_graph:
  requires:
    - '05-00: TDD test infrastructure'
  provides:
    - 'Expanded 5 regional dialect profiles (50-100 word_boost, 15+ custom_spelling each)'
  affects:
    - 'backend/main.py (consumes dialect config via get_dialect_config)'
    - 'AssemblyAI transcription accuracy for all 5 Limburgish regions'
tech_stack:
  added: []
  patterns:
    - 'AssemblyAI word_boost optimization (region-specific vocabulary)'
    - 'AssemblyAI custom_spelling (multi-pronunciation support)'
key_files:
  created: []
  modified:
    - backend/dialects.py
decisions:
  - "Generic 'limburgs' profile expanded to 70 word_boost + 20 custom_spelling (serves as base and fallback)"
  - 'Regional profiles expanded: mestreechs (74/22), zittesj (72/21), venloos (59/18), kirchroeadsj (71/22)'
  - "Removed circular mapping 'zich' → ['zich'] in zittesj (Rule 1: auto-fix bug)"
  - 'All custom_spelling values are lists (AssemblyAI format requirement)'
  - 'Regional profiles contain region-SPECIFIC vocabulary (not duplicates of generic list)'
metrics:
  duration_minutes: 8
  completed_date: '2026-04-18'
  tasks_completed: 2
  files_modified: 1
  tests_added: 0
  tests_passing: 44
---

# Phase 05 Plan 01: Expand Dialect Profiles Summary

**One-liner:** Expanded all 5 Limburgish regional dialect profiles from 5-6 entries to 50-100 word_boost and 15+ custom_spelling entries, enabling high-quality AssemblyAI transcription with region-specific vocabulary and multi-pronunciation support.

## Tasks Completed

### Task 1: Expand generic DIALECT_WORD_BOOST and DIALECT_CUSTOM_SPELLING

**Commit:** 277108b

Expanded the generic Limburgish vocabulary (used by 'limburgs' profile and as base):

- **DIALECT_WORD_BOOST**: 53 → 70 entries
- **DIALECT_CUSTOM_SPELLING**: 12 → 20 entries

**Added vocabulary categories:**

- Pronouns: eur, hön, dae, dat, wae
- Verbs: gaon, kómme, höbbe, zeen, wete
- Nouns: sjtad, sjtroat, kènk, wèrk, aovend
- Adjectives: groeët, good, sjtil, flot

**Updated DIALECT_HOTWORDS** to include all new vocabulary for mlx-whisper initial_prompt.

**Validation:**

- All custom_spelling values are lists (AssemblyAI format)
- No duplicates (case-insensitive check passed)
- Generic 'limburgs' profile automatically inherits expanded lists

### Task 2: Expand all 4 regional profiles

**Commit:** 72e4987

Expanded each regional profile with region-specific vocabulary:

**mestreechs (Maastricht — French-influenced, soft sounds):**

- 74 word_boost entries (was 6)
- 22 custom_spelling entries (was 3)
- Added: French loanwords (sjampetter, trottoir, paraplu)
- Added: Local places (Mestreech, Vrijthof, Maas, Sjlaansen, Mooswief)
- Added: Both "iech" and "iéch" accent variants in custom_spelling (TRANS-02 requirement)
- Added: Soft g variants, common expressions (ajuu, adiees, dankewaal)

**zittesj (Sittard — German-influenced, harder consonants):**

- 72 word_boost entries (was 6)
- 21 custom_spelling entries (was 3)
- Added: German-influenced words (richtig, zusamme, plötzlich, bitte, wirklich)
- Added: Harder consonant variants
- Fixed: Removed circular mapping "zich" → ["zich"] (Rule 1: auto-fix bug)
- Added: Sittard-specific verbs (sjpraoke, kump, geit)

**venloos (Venlo — Northern Limburgish):**

- 59 word_boost entries (was 5)
- 18 custom_spelling entries (was 3)
- Added: Northern vocabulary closer to standard Dutch
- Added: Venlo-specific features (ouch, gans, mótte, waas)
- Less German influence than southern dialects

**kirchroeadsj (Kerkrade — Ripuarian, strongest German influence):**

- 71 word_boost entries (was 6)
- 22 custom_spelling entries (was 3)
- Added: Ripuarian-specific vocabulary (mure, uvver, wasser, tsimmer, sjtraos)
- Added: Multi-target mapping "d'r" → ["de", "het", "hij"] (TRANS-02 requirement)
- Added: Strongest German influence words (jonge, meëdsje, kirchof)

**All profiles:**

- Updated hotwords strings to include new vocabulary
- Updated translation_key with key new mappings (5-10 per region)
- No duplicates within profiles (case-insensitive)
- No circular mappings
- All custom_spelling values are lists

## Verification Results

**All 44 tests in backend/tests/test_dialects.py pass GREEN:**

- ✓ All profiles: 50-100 word_boost entries
- ✓ All profiles: 15+ custom_spelling entries
- ✓ All custom_spelling values are lists
- ✓ No duplicate words (case-insensitive)
- ✓ No circular mappings
- ✓ mestreechs has accent variants (iech/iéch)
- ✓ kirchroeadsj has multi-target mapping (d'r)
- ✓ get_dialect_config() returns correct merged config
- ✓ Unknown region falls back to 'limburgs'

**All 96 backend tests pass (no regressions).**

**Final profile counts:**

```
limburgs:       70 boost, 20 spelling
mestreechs:     74 boost, 22 spelling
zittesj:        72 boost, 21 spelling
venloos:        59 boost, 18 spelling
kirchroeadsj:   71 boost, 22 spelling
```

**Combined word_boost per region: all <= 300 (PROJECT.md constraint satisfied).**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed circular mapping in zittesj**

- **Found during:** Task 2, when running test_dialects.py
- **Issue:** custom_spelling had "zich" → ["zich"], causing circular mapping test to fail
- **Fix:** Removed the circular mapping and added two new mappings: "bitte" → ["alsjeblieft"], "wirklich" → ["werkelijk"]
- **Files modified:** backend/dialects.py
- **Commit:** 72e4987
- **Rationale:** "zich" is identical in Sittard dialect and standard Dutch (reflexive pronoun), so mapping is redundant and creates circular reference

**2. [Rule 1 - Bug] Fixed duplicate words in mestreechs**

- **Found during:** Task 2, duplicate validation check
- **Issue:** "inne" appeared twice, "dao" appeared twice in word_boost list
- **Fix:** Removed duplicate entries
- **Files modified:** backend/dialects.py
- **Commit:** 72e4987
- **Rationale:** Test requirement "no duplicates (case-insensitive)" would have failed

## Impact

**Transcription quality improvements:**

- AssemblyAI word_boost now covers 50-100 high-frequency words per region (was 5-6)
- custom_spelling provides multi-pronunciation support (15-22 mappings per region, was 3)
- Region-specific vocabulary targeting improves recognition accuracy
- Accent variants (iéch/iech) and multi-target mappings (d'r) enable flexible pronunciation handling

**Requirements satisfied:**

- ✓ TRANS-01: Audited, expanded dialect profiles (all profiles 50-100 word_boost)
- ✓ TRANS-02: Multi-pronunciation support via custom_spelling (all profiles 15+ entries)

**Next steps:**

- Plan 05-02: Optimize correction prompts for LLM consistency
- Real-world testing with actual Limburgish audio in API mode

## Self-Check: PASSED

**Created files:** None (all files existed)

**Modified files:**

- ✓ backend/dialects.py exists and contains expanded profiles

**Commits:**

- ✓ 277108b exists (Task 1: generic vocabulary expansion)
- ✓ 72e4987 exists (Task 2: regional profiles expansion)

**Tests:**

- ✓ All 44 dialect tests pass GREEN
- ✓ All 96 backend tests pass (no regressions)

**Profile validation:**

- ✓ All profiles have 50-100 word_boost entries
- ✓ All profiles have 15+ custom_spelling entries
- ✓ All custom_spelling values are lists
- ✓ No duplicates in any profile
- ✓ No circular mappings
- ✓ mestreechs has both "iech" and "iéch" variants
- ✓ kirchroeadsj has "d'r" multi-target mapping
