# Phase 3: Resource Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 03-resource-cleanup
**Areas discussed:** Exit confirmation, Cleanup scope

---

## Exit Confirmation

| Option                 | Description                                                                                                             | Selected |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| During recording only  | Show confirmation when actively recording (mic is on). Silent cleanup during processing/correcting.                     |          |
| Recording + processing | Show confirmation during recording AND while transcription/correction is in progress. Prevents accidental loss of work. | ✓        |
| Never show dialog      | Always silently clean up. No confirmation dialogs — user decides, app respects it immediately.                          |          |

**User's choice:** Recording + processing
**Notes:** Confirmation dialog during both recording and processing/correcting phases to prevent accidental work loss.

---

## Cleanup Scope (Fetch Abort)

| Option                              | Description                                                                                                      | Selected |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Abort active requests (Recommended) | Use AbortController to cancel ongoing transcription/correction fetches. Cleaner — backend gets immediate signal. | ✓        |
| Let requests die                    | Only clean up audio resources (mic, AudioContext, WebSocket). Let HTTP fetches timeout naturally on their own.   |          |
| You decide                          | Claude picks the best approach based on the codebase patterns.                                                   |          |

**User's choice:** Abort active requests
**Notes:** AbortController for clean fetch cancellation. Backend gets immediate disconnect signal.

---

## Claude's Discretion

- AbortController implementation pattern (single vs. per-request)
- Whether $effect cleanup and beforeunload share a function or have separate paths
- Cleanup ordering (which resource first)
- Whether pagehide event is needed as fallback for mobile browsers

## Deferred Ideas

None — discussion stayed within phase scope
