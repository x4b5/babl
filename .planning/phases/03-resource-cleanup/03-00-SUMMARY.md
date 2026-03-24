---
phase: 03
plan: 00
subsystem: resource-cleanup
tags:
  - test-scaffolding
  - wave-0
  - nyquist-compliance
  - tdd-red
dependency_graph:
  requires: []
  provides:
    - cleanup.ts (stub exports)
    - cleanup.test.ts (12 test cases)
  affects: []
tech_stack:
  added:
    - Vitest mocking (vi.fn, vi.spyOn)
  patterns:
    - TDD RED-GREEN-REFACTOR cycle
    - Browser API mocking strategy
key_files:
  created:
    - src/lib/utils/cleanup.ts
    - src/lib/utils/cleanup.test.ts
  modified: []
decisions:
  - Test-first approach per Nyquist rule
  - Three cleanup functions (media, network, timers)
  - Idempotent design - safe to call multiple times
metrics:
  duration: 1
  completed: 2026-03-24T20:13:42Z
requirements:
  - RC-01
  - RC-02
  - RC-03
---

# Phase 03 Plan 00: Test Scaffolding for Resource Cleanup

**One-liner:** Created test suite (12 tests, RED phase) and stub module for resource cleanup utilities per Nyquist compliance.

## Summary

Wave 0 plan that establishes test scaffolding BEFORE implementation (Nyquist rule). Created `cleanup.ts` with three exported function stubs (empty bodies, correct TypeScript signatures) and `cleanup.test.ts` with comprehensive test suite covering all cleanup scenarios. Tests fail as expected (RED phase) - Plan 01 will implement the logic to make them pass (GREEN phase).

## What Was Built

### 1. Stub Module (`cleanup.ts`)

Three exported functions with complete TypeScript signatures but empty bodies:

- `cleanupMediaResources(refs)` - Will stop MediaRecorder, MediaStream tracks, AudioContext, animation frames
- `cleanupNetworkResources(refs)` - Will abort AbortControllers and close WebSocket
- `cleanupTimers(refs)` - Will clear intervals and timeouts

Module compiles without errors (`npm run check` passes). Functions are importable and callable.

### 2. Test Suite (`cleanup.test.ts`)

12 test cases across 3 describe blocks:

**cleanupMediaResources (7 tests):**

- Stops MediaRecorder when state is 'recording'
- Does NOT stop MediaRecorder when state is 'inactive'
- Stops all MediaStream tracks (turns off mic LED)
- Closes AudioContext when state is not 'closed'
- Does NOT close AudioContext when already 'closed'
- Cancels animation frame and clears references
- Handles all undefined refs without throwing

**cleanupNetworkResources (3 tests):**

- Aborts all active AbortControllers
- Closes WebSocket
- Handles all undefined refs without throwing

**cleanupTimers (2 tests):**

- Clears all interval and timeout timers
- Handles all undefined timers without throwing

**Test Results (RED phase):**

- 7 tests failed (expected - stubs have no implementation)
- 5 tests passed (undefined handling works correctly)
- 1 test has mocking issue (`cancelAnimationFrame` not available in test environment - Plan 01 will add proper setup)

## Verification

- `npm run check` - PASSED (TypeScript compilation clean)
- `npx vitest run src/lib/utils/cleanup.test.ts` - 7 failed / 5 passed (expected RED phase result)

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps (Plan 01)

1. Add Vitest setup for browser API mocks (`cancelAnimationFrame`)
2. Implement `cleanup.ts` functions (GREEN phase)
3. Integrate into `+page.svelte` (beforeunload, pagehide, $effect cleanup)
4. All 12 tests should pass after implementation

## Known Stubs

All three functions in `cleanup.ts` are intentional stubs (Wave 0 contract):

- **src/lib/utils/cleanup.ts:20** - `cleanupMediaResources` has empty body - Plan 01 will implement
- **src/lib/utils/cleanup.ts:35** - `cleanupNetworkResources` has empty body - Plan 01 will implement
- **src/lib/utils/cleanup.ts:48** - `cleanupTimers` has empty body - Plan 01 will implement

These stubs exist per Nyquist compliance - tests must exist before implementation. Plan 01's goal is to make all tests pass (GREEN phase).

## Self-Check: PASSED

All created files exist:

- FOUND: src/lib/utils/cleanup.ts
- FOUND: src/lib/utils/cleanup.test.ts

All commits exist:

- FOUND: 958b8f3 (Task 1 - cleanup.ts stub)
- FOUND: 49b0b66 (Task 2 - cleanup.test.ts RED phase)
