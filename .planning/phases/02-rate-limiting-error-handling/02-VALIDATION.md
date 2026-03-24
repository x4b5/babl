---
phase: 2
slug: rate-limiting-error-handling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **Framework**          | pytest (backend), vitest (frontend)                            |
| **Config file**        | `backend/pytest.ini` (if exists), `vitest.config.ts`           |
| **Quick run command**  | `cd backend && python -m pytest tests/ -x -q`                  |
| **Full suite command** | `cd backend && python -m pytest tests/ -v && npm run test:run` |
| **Estimated runtime**  | ~15 seconds                                                    |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/ -x -q`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -v && npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                           | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | ------------------------------------------- | ----------- | ---------- |
| 02-01-01 | 01   | 1    | RL-01       | unit      | `pytest tests/test_retry.py -k retry_after` | ❌ W0       | ⬜ pending |
| 02-01-02 | 01   | 1    | RL-04       | unit      | `pytest tests/test_retry.py -k tenacity`    | ❌ W0       | ⬜ pending |
| 02-01-03 | 01   | 1    | RL-02       | unit      | `pytest tests/test_retry.py -k sse_error`   | ❌ W0       | ⬜ pending |
| 02-02-01 | 02   | 1    | EH-01       | unit      | `npm run test:run -- --grep error_taxonomy` | ❌ W0       | ⬜ pending |
| 02-02-02 | 02   | 1    | EH-02       | unit      | `npm run test:run -- --grep user_messages`  | ❌ W0       | ⬜ pending |
| 02-02-03 | 02   | 1    | RL-03       | manual    | Manual: trigger 429 and verify countdown    | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/tests/test_retry.py` — stubs for RL-01, RL-02, RL-04 (Retry-After parsing, tenacity retry, SSE error events)
- [ ] `src/lib/utils/error-taxonomy.test.ts` — stubs for EH-01, EH-02 (error classification, user messages)
- [ ] `pip install tenacity>=9.0.0` — new dependency for retry logic

_Existing test infrastructure from Phase 1 covers pytest and vitest setup._

---

## Manual-Only Verifications

| Behavior                          | Requirement | Why Manual                                           | Test Instructions                                                                                                                                              |
| --------------------------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limit countdown UI           | RL-03       | Requires visual verification of live countdown timer | 1. Trigger Mistral 429 (rate limit), 2. Verify "Overbelast. Wacht Xs..." appears, 3. Verify countdown ticks every second, 4. Verify auto-retry after countdown |
| Error severity visual distinction | EH-01       | CSS color verification                               | 1. Trigger rate_limit error → verify amber/yellow tint, 2. Trigger network_error → verify red tint                                                             |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
