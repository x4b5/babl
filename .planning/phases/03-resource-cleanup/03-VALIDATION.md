---
phase: 3
slug: resource-cleanup
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-24
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value              |
| ---------------------- | ------------------ |
| **Framework**          | Vitest 4.1.1       |
| **Config file**        | vite.config.ts     |
| **Quick run command**  | `npm run test:run` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime**  | ~5 seconds         |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type | Automated Command                                             | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------- | ------------------------------------------------------------- | ----------- | ---------- |
| 03-00-01 | 00   | 0    | RC-01       | scaffold  | `npm run check`                                               | Created W0  | ⬜ pending |
| 03-00-02 | 00   | 0    | RC-01       | unit-RED  | `npx vitest run src/lib/utils/cleanup.test.ts 2>&1 \|\| true` | Created W0  | ⬜ pending |
| 03-01-01 | 01   | 1    | RC-01       | unit      | `npm run test:run -- src/lib/utils/cleanup.test.ts`           | Yes (W0)    | ⬜ pending |
| 03-01-02 | 01   | 1    | RC-01       | manual    | Browser checkpoint (Task 2)                                   | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Plan (03-00-PLAN.md)

Wave 0 creates test scaffolding BEFORE implementation (Nyquist compliance):

- [x] `src/lib/utils/cleanup.ts` — Stub exports (function signatures, empty bodies)
- [x] `src/lib/utils/cleanup.test.ts` — Full test suite (12 tests, imports from stub)

Tests are expected to FAIL against stubs (RED phase). Plan 01 fills in implementations (GREEN phase).

---

## Manual-Only Verifications

| Behavior                            | Requirement | Why Manual                                | Test Instructions                                                                 |
| ----------------------------------- | ----------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Mic LED turns off after tab close   | RC-01       | Hardware indicator, no programmatic check | 1. Start recording 2. Close tab 3. Verify mic LED is off                          |
| Browser confirmation dialog appears | RC-01/D-01  | Browser-native UI, no DOM access          | 1. Start recording 2. Try to close tab 3. Verify "Leave site?" dialog             |
| Network requests cancelled          | D-04        | Requires DevTools inspection              | 1. Start transcription 2. Close tab 3. Check Network tab shows cancelled requests |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 00 creates test scaffolding)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (revision — Wave 0 plan added for Nyquist compliance)
