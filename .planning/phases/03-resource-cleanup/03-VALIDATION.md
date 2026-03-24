---
phase: 3
slug: resource-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                  |
| ---------------------- | ---------------------- |
| **Framework**          | Vitest 4.1.1           |
| **Config file**        | None — Wave 0 installs |
| **Quick run command**  | `npm run test:run`     |
| **Full suite command** | `npm run test:run`     |
| **Estimated runtime**  | ~5 seconds             |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                        | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | -------------------------------------------------------- | ----------- | ---------- |
| 03-01-01 | 01   | 1    | RC-01       | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |
| 03-01-02 | 01   | 1    | RC-01       | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |
| 03-01-03 | 01   | 1    | RC-01       | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |
| 03-01-04 | 01   | 1    | RC-02       | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |
| 03-01-05 | 01   | 1    | RC-03       | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |
| 03-01-06 | 01   | 1    | D-04        | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/routes/transcribe/cleanup.test.ts` — Unit tests for cleanup function, beforeunload/pagehide handlers, AbortController abort
- [ ] Test utilities — Mock implementations for MediaStream, AudioContext, WebSocket, addEventListener/removeEventListener

_Note: Vitest config already exists via package.json scripts. Browser API mocks needed for lifecycle event testing._

---

## Manual-Only Verifications

| Behavior                            | Requirement | Why Manual                                | Test Instructions                                                                 |
| ----------------------------------- | ----------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Mic LED turns off after tab close   | RC-01       | Hardware indicator, no programmatic check | 1. Start recording 2. Close tab 3. Verify mic LED is off                          |
| Browser confirmation dialog appears | RC-01/D-01  | Browser-native UI, no DOM access          | 1. Start recording 2. Try to close tab 3. Verify "Leave site?" dialog             |
| Network requests cancelled          | D-04        | Requires DevTools inspection              | 1. Start transcription 2. Close tab 3. Check Network tab shows cancelled requests |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
