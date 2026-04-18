---
phase: 6
slug: llm-correction-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| **Framework**          | pytest 8.3.5 (backend), vitest 4.0.18 (frontend)                           |
| **Config file**        | backend/tests/conftest.py (pytest fixtures), package.json (vitest scripts) |
| **Quick run command**  | `pytest backend/tests/test_dialects.py -x`                                 |
| **Full suite command** | `pytest backend/tests/ -v`                                                 |
| **Estimated runtime**  | ~15 seconds                                                                |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_dialects.py -x`
- **After every plan wave:** Run `pytest backend/tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                                             | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ----------------------------------------------------------------------------- | ----------- | ---------- |
| 06-01-01 | 01   | 1    | CORR-01     | unit        | `pytest backend/tests/test_dialects.py::test_few_shot_examples_exist -x`      | ❌ W0       | ⬜ pending |
| 06-01-02 | 01   | 1    | CORR-01     | unit        | `pytest backend/tests/test_dialects.py::test_few_shot_schema_valid -x`        | ❌ W0       | ⬜ pending |
| 06-02-01 | 02   | 1    | CORR-02     | unit        | `pytest backend/tests/test_correction_schema.py::test_parse_valid_json -x`    | ❌ W0       | ⬜ pending |
| 06-02-02 | 02   | 1    | CORR-02     | unit        | `pytest backend/tests/test_correction_schema.py::test_parse_fallback -x`      | ❌ W0       | ⬜ pending |
| 06-03-01 | 03   | 1    | CORR-03     | unit        | `pytest backend/tests/test_dialects.py::test_glossary_size -x`                | ❌ W0       | ⬜ pending |
| 06-03-02 | 03   | 1    | CORR-03     | integration | `pytest backend/tests/test_correction_prompts.py::test_glossary_injection -x` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/tests/test_correction_schema.py` — stubs for CORR-02 (Pydantic validation, fallback parsing)
- [ ] `backend/tests/test_correction_prompts.py` — stubs for CORR-03 (glossary injection)
- [ ] Expand `backend/tests/test_dialects.py` — stubs for CORR-01 (few-shot examples validation)
- [ ] `backend/correction.py` — new module for `CorrectionOutput`, `parse_correction_output()`, prompt builders
- [ ] Update `backend/tests/conftest.py` — add fixture for sample `CorrectionOutput`

_Existing infrastructure covers framework (pytest already installed)._

---

## Manual-Only Verifications

| Behavior                                 | Requirement   | Why Manual                             | Test Instructions                                                                          |
| ---------------------------------------- | ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Correction quality on real dialect audio | CORR-01/02/03 | Requires subjective quality assessment | 1. Record 30s Mestreechs dialect 2. Run correction 3. Verify output matches expected Dutch |
| Streaming UX shows tokens then validates | CORR-02       | Visual UX cannot be automated          | 1. Start correction 2. Observe token streaming 3. Verify final JSON validation succeeds    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
