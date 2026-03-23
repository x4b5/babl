---
phase: 1
slug: websocket-offset-filtering-stability
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-23
updated: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Framework**          | vitest (frontend), pytest (backend)                                                         |
| **Config file**        | `vite.config.ts` (vitest), `backend/tests/` (pytest)                                        |
| **Quick run command**  | `npm run test:run` (frontend) / `cd backend && python -m pytest tests/ -x` (backend)        |
| **Full suite command** | `npm run test:run && cd backend && source .venv/bin/activate && python -m pytest tests/ -v` |
| **Estimated runtime**  | ~10 seconds                                                                                 |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run` + `cd backend && python -m pytest tests/ -x`
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type    | Automated Command                                                            | File Exists | Status  |
| -------- | ---- | ---- | ----------- | ------------ | ---------------------------------------------------------------------------- | ----------- | ------- |
| 01-00-01 | 00   | 0    | OF-01,OF-02 | unit (RED)   | `cd backend && python -m pytest tests/test_offset_filter.py -v`              | W0 creates  | pending |
| 01-00-02 | 00   | 0    | WS-03       | unit         | `cd backend && python -m pytest tests/test_heartbeat.py -v`                  | W0 creates  | pending |
| 01-00-03 | 00   | 0    | OF-03       | unit (GREEN) | `npx vitest run src/lib/utils/dedup.test.ts`                                 | W0 creates  | pending |
| 01-01-01 | 01   | 1    | WS-01..05   | type+unit    | `npm run check && cd backend && python -m pytest tests/test_heartbeat.py -v` | W0          | pending |
| 01-02-01 | 02   | 2    | OF-01,OF-02 | unit (GREEN) | `cd backend && python -m pytest tests/test_offset_filter.py -v`              | W0          | pending |
| 01-02-02 | 02   | 2    | OF-03       | unit (GREEN) | `npx vitest run src/lib/utils/dedup.test.ts`                                 | W0          | pending |
| 01-02-03 | 02   | 2    | EH-03       | type         | `npm run check`                                                              | N/A         | pending |

_Status: pending / green / red / flaky_

---

## Wave 0 Requirements

- [x] Offset filtering unit tests -- stubs for OF-01, OF-02 (Plan 01-00 Task 1)
- [x] Heartbeat message structure tests -- stubs for WS-03 (Plan 01-00 Task 1)
- [x] Dedup module + tests -- OF-03 (Plan 01-00 Task 2)
- [x] pytest + pytest-asyncio installed in backend venv
- [x] Existing vitest infrastructure covers frontend test runner

---

## Manual-Only Verifications

| Behavior                      | Requirement | Why Manual                                  | Test Instructions                                                           |
| ----------------------------- | ----------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| WebSocket reconnection        | WS-01       | Requires live backend disconnect simulation | 1. Start recording with WS, 2. Kill backend, 3. Verify auto-reconnect       |
| "Verbinding verloren" message | WS-02       | UI visual verification                      | 1. Disconnect 5x, 2. Verify error message appears                           |
| Backend heartbeat             | WS-03       | Requires live WebSocket session             | 1. Open WS, 2. Wait 15s, 3. Check ping/pong in backend logs                 |
| New session on reconnect      | WS-04       | Requires AssemblyAI API key                 | 1. Record, 2. Disconnect, 3. Verify new session starts                      |
| Stalled stream detection      | WS-05       | Requires simulated stall                    | 1. Start stream, 2. Block backend data, 3. Wait 30s, 4. Verify timeout      |
| SSE timeout                   | EH-03       | Requires simulated SSE stall                | 1. Start SSE transcription, 2. Block response, 3. Wait 30s, 4. Verify error |

---

## Nyquist Compliance

Sampling continuity check: no 3 consecutive tasks without automated behavioral verification.

| Window               | Tasks              | Automated Behavioral Tests | Compliant |
| -------------------- | ------------------ | -------------------------- | --------- |
| Wave 0 (01-00)       | 01-00-01, 01-00-02 | 2/2 (pytest + vitest)      | YES       |
| Wave 0-1 (01-00..01) | 01-00-02, 01-01-01 | 2/2 (heartbeat pytest)     | YES       |
| Wave 1-2 (01-01..02) | 01-01-01, 01-02-01 | 2/2 (heartbeat + offset)   | YES       |
| Wave 2 (01-02)       | 01-02-01, 01-02-02 | 2/2 (offset + dedup)       | YES       |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
