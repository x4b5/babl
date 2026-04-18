---
phase: 5
slug: vocabulary-transcription-quality
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **Framework**          | pytest 7.x (backend), vitest (frontend)                                 |
| **Config file**        | `backend/pytest.ini` or inline, `vitest.config.ts`                      |
| **Quick run command**  | `cd backend && python -m pytest tests/ -x -q`                           |
| **Full suite command** | `cd backend && python -m pytest tests/ -v && cd .. && npm run test:run` |
| **Estimated runtime**  | ~15 seconds                                                             |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/ -x -q`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                    | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ---------------------------------------------------- | ----------- | ---------- |
| 05-00-01 | 00   | 0    | TRANS-01    | unit        | `pytest tests/test_dialects.py`                      | ❌ W0       | ⬜ pending |
| 05-00-02 | 00   | 0    | TRANS-03    | unit        | `pytest tests/test_hallucination.py`                 | ❌ W0       | ⬜ pending |
| 05-01-01 | 01   | 1    | TRANS-01    | unit        | `pytest tests/test_dialects.py -k "word_boost"`      | ❌ W0       | ⬜ pending |
| 05-01-02 | 01   | 1    | TRANS-02    | unit        | `pytest tests/test_dialects.py -k "custom_spelling"` | ❌ W0       | ⬜ pending |
| 05-02-01 | 02   | 1    | TRANS-03    | unit        | `pytest tests/test_hallucination.py`                 | ❌ W0       | ⬜ pending |
| 05-02-02 | 02   | 1    | TRANS-03    | integration | `pytest tests/test_hallucination.py -k "pipeline"`   | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/tests/test_dialects.py` — stubs for TRANS-01, TRANS-02 (word_boost counts, custom_spelling coverage)
- [ ] `backend/tests/test_hallucination.py` — stubs for TRANS-03 (repetition detection, blocklist, dedup)
- [ ] `backend/tests/conftest.py` — shared fixtures (sample dialect configs, hallucination test strings)

_Existing `backend/evaluation/test_metrics.py` and `test_patterns.py` from Phase 4 cover evaluation infrastructure._

---

## Manual-Only Verifications

| Behavior                                                  | Requirement | Why Manual                                      | Test Instructions                                                     |
| --------------------------------------------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| WER/CER does not regress after vocabulary changes         | TRANS-01    | Requires real audio samples + AssemblyAI API    | Run sample transcription before/after, compare WER/CER scores         |
| Hallucination detection does not strip legitimate content | TRANS-03    | Requires natural speech samples with repetition | Test with real conversation recordings containing "ja ja ja" patterns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
