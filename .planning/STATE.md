---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Dialect Quality
status: Complete
stopped_at: Completed 07-02 (Phase 07 complete, v2.0 milestone done)
last_updated: '2026-04-18T12:00:00Z'
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 12
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Betrouwbare spraak-naar-tekst met dialectcorrectie -- de transcriptie moet kloppen en het proces mag niet stilzwijgend falen.
**Current focus:** v2.0 Dialect Quality milestone complete

## Current Position

Phase: 07 (feedback-iteration) — COMPLETE
Milestone: v2.0 Dialect Quality — COMPLETE

## Performance Metrics

**Velocity:**

- Total plans completed: 12 (v2.0 milestone)
- Average duration: ~11 min
- Total execution time: ~2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
| ----- | ----- | ----- | -------- |
| 4     | 3     | ~50m  | ~17m     |
| 5     | 3     | ~22m  | ~7m      |
| 6     | 3     | ~18m  | ~6m      |
| 7     | 3     | ~30m  | ~10m     |

**v1.0 Velocity (reference):**

- Total plans completed: 7
- Average duration: ~45 min
- Total execution time: ~5.5 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stability milestone v1.0 complete: WebSocket, offset filtering, rate limiting, resource cleanup all resolved
- API modus als primaire focus: Gebruiker werkt voornamelijk met AssemblyAI + Mistral
- Dialectkwaliteit als v2.0 focus: Transcriptie en correctie van Limburgs zijn de primaire bottleneck
- Research emphasizes measurement-driven iteration: evaluation infrastructure first, then vocabulary/prompt optimization
- Avoid over-biasing vocabulary (>200-300 words degrades general accuracy)
- LLM consistency via structured outputs (instructor) + few-shot prompting
- Phase 4 shipped: WER/CER via jiwer 3.1.0, JSONL logging, confidence highlighting, FeedbackWidget
- Phase 5 shipped: Dialect profiles expanded (50-100 word_boost per regio), hallucination detection integrated
- Phase 6 shipped: Few-shot examples (3-5 per region), glossaries (50-100+ terms), JSON structured output, prompt builder wired into both endpoints
- [Phase 06]: Moved SYSTEM_PROMPTS to correction.py as single source of truth for prompt assembly
- [Phase 06]: JSON tokens accumulated silently, parsed, corrected text emitted (not raw JSON)
- [Phase 07]: Chunk overlap (75 words) preserves context across chunk boundaries
- [Phase 07]: PROMPT_VERSION tracks prompt template versions for A/B testing
- [Phase 07]: User corrections stored in JSONL, glossary suggestions derived from accumulated corrections

### Pending Todos

None yet.

### Blockers/Concerns

- FeedbackWidget only calls localhost:8000/evaluate — no SvelteKit API route fallback for deployed mode yet

## Session Continuity

Last session: 2026-04-18T12:00:00Z
Stopped at: Completed 07-02 (Phase 07 complete, v2.0 milestone done)
Resume file: None
