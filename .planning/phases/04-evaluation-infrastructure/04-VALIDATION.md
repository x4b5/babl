---
phase: 4
slug: evaluation-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| **Framework**          | vitest (frontend), pytest (backend)                              |
| **Config file**        | `vite.config.ts` (vitest), `backend/pytest.ini` (Wave 0 creates) |
| **Quick run command**  | `npm run test:run`                                               |
| **Full suite command** | `npm run test:run && cd backend && python -m pytest evaluation/` |
| **Estimated runtime**  | ~10 seconds                                                      |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                            | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ------------------------------------------------------------ | ----------- | ---------- |
| 04-00-01 | 00   | 0    | EVAL-01     | unit        | `cd backend && python -m pytest evaluation/test_metrics.py`  | ❌ W0       | ⬜ pending |
| 04-00-02 | 00   | 0    | EVAL-03     | unit        | `cd backend && python -m pytest evaluation/test_patterns.py` | ❌ W0       | ⬜ pending |
| 04-00-03 | 00   | 0    | EVAL-03     | unit        | `cd backend && python -m pytest evaluation/test_logger.py`   | ❌ W0       | ⬜ pending |
| 04-01-01 | 01   | 1    | EVAL-01     | unit        | `cd backend && python -m pytest evaluation/test_metrics.py`  | ❌ W0       | ⬜ pending |
| 04-01-02 | 01   | 1    | EVAL-03     | unit        | `cd backend && python -m pytest evaluation/test_patterns.py` | ❌ W0       | ⬜ pending |
| 04-01-03 | 01   | 1    | EVAL-03     | integration | `cd backend && python -m pytest evaluation/test_logger.py`   | ❌ W0       | ⬜ pending |
| 04-02-01 | 02   | 2    | EVAL-02     | unit        | `npm run test:run -- --grep confidence`                      | ❌ W0       | ⬜ pending |
| 04-02-02 | 02   | 2    | EVAL-01     | manual      | Browser: check WER/CER display                               | N/A         | ⬜ pending |
| 04-02-03 | 02   | 2    | EVAL-02     | manual      | Browser: check confidence highlighting                       | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/evaluation/__init__.py` — package init
- [ ] `backend/evaluation/test_metrics.py` — stubs for WER/CER calculation (EVAL-01)
- [ ] `backend/evaluation/test_patterns.py` — stubs for error pattern extraction (EVAL-03)
- [ ] `backend/evaluation/test_logger.py` — stubs for JSONL logging (EVAL-03)
- [ ] `pip install jiwer==3.1.1` — WER/CER library
- [ ] `backend/pytest.ini` or `backend/pyproject.toml` — pytest config if missing

---

## Manual-Only Verifications

| Behavior                         | Requirement | Why Manual                                | Test Instructions                                                      |
| -------------------------------- | ----------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| WER/CER score visible in UI      | EVAL-01     | Visual rendering                          | Record audio, transcribe, verify score appears below transcript        |
| Low-confidence words highlighted | EVAL-02     | Visual rendering + AssemblyAI data needed | Transcribe in API mode, verify amber/underline on low-confidence words |
| Feedback widget functional       | EVAL-01     | User interaction                          | Click thumbs up/down, verify response sent                             |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
