# Features Research

**Research Date:** 2026-03-23
**Focus:** Table stakes features for streaming audio app stability

## Table Stakes (Must-Have for Stability)

| Feature                         | Why Table Stakes                           | BABL Status                                        |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| WebSocket auto-reconnect        | Users expect uninterrupted streaming       | Missing — silent failure on disconnect             |
| Rate limit user feedback        | 429 errors must surface to user            | Missing — generic "mislukt" error                  |
| Audio segment boundary handling | Offset filtering must not drop content     | Missing — segments straddling boundary get dropped |
| Resource cleanup on unload      | Mic/AudioContext must release on leave     | Missing — no beforeunload handler                  |
| Consistent error messages       | Users need actionable errors               | Partial — mix of generic and specific              |
| SSE reconnection                | Server-Sent Events must resume after drops | Partial — no auto-retry on SSE disconnect          |
| Streaming timeout detection     | Stalled streams must alert user            | Missing — no client-side timeout                   |
| Graceful degradation            | App works when services unavailable        | Present — mode availability detection              |
| Health check on mount           | Detect unavailable backends early          | Present — dual health check on load                |
| Audio format validation         | Reject unsupported formats before upload   | Present — basic validation                         |
| Progress indication             | User sees processing state                 | Present — status states + spinners                 |
| Copy to clipboard               | Export corrected text                      | Present — copy button                              |
| Abort/cancel support            | User can stop long operations              | Present — AbortController                          |
| Session persistence             | Auth survives page refresh                 | Present — httpOnly cookie                          |

## Differentiators (Unique to BABL)

| Feature                        | Value                                     |
| ------------------------------ | ----------------------------------------- |
| Limburgse dialect correction   | Core USP — 5 regional profiles            |
| Dual-mode per step             | User chooses local vs API per operation   |
| Privacy-first architecture     | No PII, EU-only servers, local option     |
| Two-phase processing           | Raw transcription shown before correction |
| Live incremental transcription | Real-time feedback during recording       |
| Quality mode selection         | Light/Medium affects model choice         |
| Cost estimation                | User sees estimated API costs             |
| Glassmorphism dark UI          | Distinctive visual identity               |
| Spacebar shortcut              | Quick record toggle                       |
| Long recording support         | Submit+poll for 60+ min files             |

## Anti-Features (Explicitly Out of Scope)

| Feature                      | Why Out of Scope                       |
| ---------------------------- | -------------------------------------- |
| Inline transcript editing    | Later milestone                        |
| Batch/bulk upload            | Later milestone                        |
| Mobile app                   | Web-first                              |
| Multi-user support           | Single-user tool                       |
| Real-time collaboration      | Not needed for use case                |
| Transcript history/database  | No server-side storage by design       |
| Speaker identification UI    | AssemblyAI provides it but not exposed |
| Custom vocabulary management | Word boost is hardcoded per region     |

## Gap Analysis for Stability Milestone

**Critical Gaps (all 3 known bugs):**

1. WebSocket reconnection — need heartbeat + auto-reconnect pattern
2. Offset boundary filtering — need overlap tolerance or segment merging
3. Rate limit feedback — need 429 detection + Retry-After parsing + user message

**Supporting Gaps:** 4. Resource cleanup — beforeunload + visibilitychange handlers 5. Error message consistency — error code taxonomy + user-facing messages

## Recommended Priority

1. WebSocket reconnection (highest user impact — recording appears to work but produces nothing)
2. Rate limit feedback (user has no way to know what went wrong)
3. Offset filtering (subtle data loss — hardest to detect)
4. Resource cleanup (defensive — prevents mic staying active)
5. Error consistency (quality of life improvement)

---

_Research completed: 2026-03-23_
