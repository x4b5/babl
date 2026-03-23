---
phase: 1
slug: websocket-offset-filtering-stability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value              |
| ---------------------- | ------------------ |
| **Framework**          | vitest             |
| **Config file**        | `vitest.config.ts` |
| **Quick run command**  | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime**  | ~10 seconds        |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                   | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | ----------------------------------- | ----------- | ---------- |
| 01-01-01 | 01   | 1    | WS-01       | manual    | WebSocket disconnect/reconnect      | N/A         | ⬜ pending |
| 01-01-02 | 01   | 1    | WS-02       | manual    | Check "Verbinding verloren" UI      | N/A         | ⬜ pending |
| 01-01-03 | 01   | 1    | WS-03       | manual    | Backend heartbeat ping/pong         | N/A         | ⬜ pending |
| 01-01-04 | 01   | 1    | WS-04       | manual    | New AssemblyAI session on reconnect | N/A         | ⬜ pending |
| 01-01-05 | 01   | 1    | WS-05       | manual    | Stalled stream 30s timeout          | N/A         | ⬜ pending |
| 01-02-01 | 02   | 1    | OF-01       | unit      | `npm run test:run`                  | ❌ W0       | ⬜ pending |
| 01-02-02 | 02   | 1    | OF-02       | unit      | `npm run test:run`                  | ❌ W0       | ⬜ pending |
| 01-02-03 | 02   | 1    | OF-03       | unit      | `npm run test:run`                  | ❌ W0       | ⬜ pending |
| 01-03-01 | 03   | 1    | EH-03       | manual    | SSE stream 30s no-data timeout      | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Offset filtering unit tests — stubs for OF-01, OF-02, OF-03 (pure function, testable)
- [ ] Existing vitest infrastructure covers test runner

_WebSocket and SSE tests are manual — require running backend + browser._

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

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
