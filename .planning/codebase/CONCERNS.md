# Codebase Concerns

**Analysis Date:** 2026-03-23

## Tech Debt

**Monolithic Frontend Component — /page.svelte Exceeds Reasonable Size:**

- Issue: `src/routes/transcribe/+page.svelte` contains 1,662 lines of mixed logic (recording, streaming, UI state, audio processing, error handling). This violates single-responsibility and makes testing/maintenance difficult.
- Files: `src/routes/transcribe/+page.svelte`
- Impact: Difficult to test individual features; high cognitive load; harder to isolate bugs; component reload cycles are expensive.
- Fix approach: Extract audio processing logic (`startRecording`, `downsampleToWav`, `toPcmInt16`, `sendAudio*`, `sendLiveChunk`) into a separate module. Move streaming handlers into composable functions. Create smaller sub-components for UI sections (recording controls, results display, correction controls).

**Duplicate System Prompts Across Codebase:**

- Issue: System prompt definitions for dialect correction exist in both `backend/main.py` (lines 116–193) AND `src/routes/api/correct/+server.ts` (lines 13–85). Same prompts, different implementations — this violates DRY and creates maintenance burden.
- Files: `backend/main.py`, `src/routes/api/correct/+server.ts`
- Impact: Prompts may drift; updates must happen in two places; harder to maintain consistency between local and API correction modes.
- Fix approach: Store system prompts in a shared configuration file (JSON or YAML) that both backend and frontend load. Or expose prompts via a dedicated API endpoint.

**Inconsistent Error Handling Between Frontend and Backend:**

- Issue: Frontend uses try/catch with console.log/console.error (lines 339–878 in +page.svelte) while backend uses print() statements. Neither consistently logs with structured fields or severity levels. Recovery strategies vary (e.g., fallbacks in some functions, hard errors in others).
- Files: `src/routes/transcribe/+page.svelte`, `backend/main.py`
- Impact: Difficult to debug issues in production; inconsistent user error messages; no centralized error tracking.
- Fix approach: Implement consistent error handling: Frontend uses analytics wrapper for errors; backend uses structured logging (Python logging module with JSON formatting); both use consistent error codes.

**Untested Async Streaming Code Path:**

- Issue: No test coverage for SSE streaming endpoints (`/transcribe`, `/correct`, `/transcribe-api`). Server-Sent Events and streaming responses are complex and error-prone (e.g., queue cleanup, backpressure handling, client disconnection).
- Files: `backend/main.py` (lines 402–470, 844–911), `src/routes/api/correct/+server.ts` (lines 173–239)
- Impact: Streaming failures (e.g., incomplete messages, queue hangs) may go undetected in production; difficult to reproduce locally.
- Fix approach: Add integration tests for SSE streams. Mock AssemblyAI/Ollama responses; verify message ordering; test client disconnect during streaming.

## Known Bugs

**Live Transcription Offset Filtering May Skip Segments:**

- Symptoms: When `offset > 0` in `/transcribe-live` (line 532 in main.py), segments with `start < offset` are filtered out. If a segment straddles the boundary (e.g., `start=4.9s, offset=5s`), it gets dropped even though it contains new content.
- Files: `backend/main.py` line 532–533
- Trigger: Live transcription on recordings > 5 seconds; check if partial words at segment boundaries are dropped.
- Workaround: Currently none. Use a small overlap buffer (e.g., offset = 4.95) or accept minor duplication.

**WebSocket Real-Time Streaming May Silently Fail if Backend Disconnects:**

- Symptoms: Frontend WebSocket connection stays open but AssemblyAI on backend loses connection. Frontend stops receiving transcription but no error is surfaced to user; they see "recording" status indefinitely.
- Files: `src/routes/transcribe/+page.svelte` (lines 394–440), `backend/main.py` (lines 699–803)
- Trigger: Long recordings (>10 min) with network interruption; backend timeout during WebSocket forward.
- Workaround: Implement client-side timeout (e.g., no transcription event for 30s = error).

**Mistral Rate Limiting Causes Silent Failures in Correction:**

- Symptoms: When Mistral API returns 429 (rate limited), the retry logic in `correct_chunk_mistral_stream` (backend line 310–334) retries up to 8 times with exponential backoff. However, if all retries fail, the exception is raised but frontend sees generic "Verslaglegging mislukt" error—no hint about rate limiting.
- Files: `backend/main.py` (lines 310–334), `src/routes/api/correct/+server.ts` (lines 161–169)
- Trigger: Rapid successive corrections; high user load on API.
- Workaround: Add `Retry-After` header parsing; inform user to wait X seconds before retrying.

**Potential Audio Memory Leak on Browser Crashes During Recording:**

- Symptoms: If browser crashes or page unloads during recording, MediaRecorder stream and AudioContext may not be properly closed, leaving microphone access active.
- Files: `src/routes/transcribe/+page.svelte` (lines 281–318, 488–494)
- Trigger: Browser crash/kill; page navigation during recording; OS sleep during recording.
- Workaround: Add `beforeunload` event listener to stop recording; ensure AudioContext.close() is called in cleanup.

## Security Considerations

**Audio Data Exposure in Browser Logs (Dev Only):**

- Risk: Frontend logs audio blob sizes and filenames to console (line 652). In dev mode, this is fine, but if console statements are accidentally left in production, file names might hint at content type.
- Files: `src/routes/transcribe/+page.svelte` (lines 339, 519, 555, 584, 652, 823)
- Current mitigation: Console logs are dev-only; no PII is logged.
- Recommendations: Wrap console logs in `if (dev)` or use a debug flag. Remove filenames from logs; use hashes instead.

**AssemblyAI API Key Exposed if Request Fails on Frontend:**

- Risk: If AssemblyAI submit request fails with 400/500, frontend may expose full error details from server response (line 681 in +server.ts). If the error message includes sensitive details, it leaks to user.
- Files: `src/routes/api/transcribe-api/+server.ts` (line 681)
- Current mitigation: ErrorHTTPException wraps errors; no API keys in error messages by default.
- Recommendations: Sanitize error responses; only return user-facing messages (e.g., "Transcription service unavailable"), not raw server errors.

**WebSocket Protocol Upgrade Not Validated:**

- Risk: Frontend WebSocket (line 399 in +page.svelte) connects to `ws://localhost:8000/ws/transcribe-stream` without checking certificate/origin validation. In production (on Vercel), this will fail because Vercel doesn't allow backend connections. Risk is mitigated by deployment mismatch (local dev only), but hard to catch.
- Files: `src/routes/transcribe/+page.svelte` (line 399), `backend/main.py` (lines 699–803)
- Current mitigation: WebSocket only works on localhost; Vercel deployment will fail gracefully (API mode fallback available).
- Recommendations: Document that WebSocket is local-dev only. Add explicit warning if WebSocket fails in production. Consider removing WebSocket support if Vercel deployment is target.

## Performance Bottlenecks

**Whisper Large-V3 Model Loads on First Request (Backend):**

- Problem: `/transcribe` endpoint loads `mlx-community/whisper-large-v3-mlx` on first use (lazy load). This causes a 5–10 second delay on first request while model downloads to disk.
- Files: `backend/main.py` (lines 88–89, 432)
- Cause: No eager model loading; MLX doesn't cache in memory like PyTorch.
- Improvement path: In `warmup_ollama()` (lines 57–69), add Whisper warmup that touches the model file. Cache model locally in `.cache/` and check before running transcription.

**Audio Downsampling Happens Twice for Real-Time API Stream:**

- Problem: Frontend uses `toPcmInt16()` for WebSocket streaming (line 446), then backend doesn't re-downsample because AssemblyAI accepts raw PCM. However, `downsampleToWav()` is also called for SSE fallback (line 583), leading to wasted CPU cycles if both code paths are tested.
- Files: `src/routes/transcribe/+page.svelte` (lines 199–251, 254–279, 446, 583)
- Cause: Two separate audio encoding pipelines (WebSocket + SSE) were developed independently.
- Improvement path: Consolidate to single pipeline; pass `format: 'wav' | 'pcm'` parameter and encode once.

**Three-Second Overlap Chunks in Live Transcription (5KB–10KB Per Chunk):**

- Problem: `sendLiveChunk()` re-encodes last 6 chunks (3s of audio) for every new chunk sent (line 331). For a 1-hour recording, this means ~7,200 duplicate re-encodings, each 5–10KB.
- Files: `src/routes/transcribe/+page.svelte` (lines 322–366)
- Cause: Overlap is necessary for Whisper context, but re-encoding is wasteful.
- Improvement path: Cache the last N seconds of PCM in memory (browser); only encode new audio. Send full audio at 5-second intervals (not 500ms chunks).

**Correction Chunks Split by Sentence Boundary (400-Word Max):**

- Problem: Large documents get split into 5–10 chunks, each sent sequentially to Mistral/Ollama. For a 4,000-word document, this means 10 API calls, each with full context passed (inefficient token usage).
- Files: `backend/main.py` (lines 337–360), `src/routes/api/correct/+server.ts` (lines 87–109)
- Cause: Naive chunking without token awareness; full context sent for each chunk.
- Improvement path: Estimate tokens per chunk; pass context only for first and last chunks; use token-efficient prompting (e.g., "Continue from previous" vs. full context repeat).

## Fragile Areas

**Hybrid Transcription Mode (AssemblyAI + Whisper):**

- Files: `backend/main.py` (lines 623–648)
- Why fragile: When `lang == "li"` and using AssemblyAI API, the code extracts audio segments by timestamp and re-transcribes with Whisper for dialect accuracy. This creates a tight coupling between AssemblyAI speaker diarization timestamps and Whisper re-transcription. If AssemblyAI timestamps are off by even 100ms, Whisper segments won't align.
- Safe modification: Add tolerance window (±200ms) when extracting segments. Log misalignment warnings. Add test cases for timestamp edge cases.
- Test coverage: No tests for hybrid mode; verify alignment on variety of audio lengths (< 1min, 5min, 30min, 60min).

**Dialect Configuration Per Region:**

- Files: `backend/dialects.py` (lines 55–109)
- Why fragile: 5 regional profiles (Limburgs, Mestreechs, Zittesj, Venloos, Kirchröadsj) are hand-coded. Each has word_boost, custom_spelling, translation_key. If a region is misspelled in frontend, it silently falls back to "limburgs" (line 100). No validation that frontend uses valid region keys.
- Safe modification: Export region keys as constants shared between frontend and backend. Validate region parameter on API endpoints. Add test cases for each region with sample audio.
- Test coverage: No tests for regional profiles; need regression tests to ensure dialect accuracy doesn't degrade.

**Live Audio Duration Tracking Across Retransmissions:**

- Files: `src/routes/transcribe/+page.svelte` (lines 36–39, 322–366)
- Why fragile: `liveAudioDuration` tracks offset to avoid duplication (line 357). But if `sendLiveChunk()` fails mid-transmission, offset state isn't rolled back. Subsequent sends may skip audio or duplicate words.
- Safe modification: Use immutable state updates; track pending vs. confirmed offsets separately. Add retry backoff.
- Test coverage: No tests for network failures during live transcription.

## Scaling Limits

**Max 500MB Audio Files → ~2 Hours Compressed:**

- Current capacity: 500MB (line 26 in main.py)
- Limit: ffmpeg processing of 500MB takes 30–60 seconds on Apple Silicon; user sees processing spinner for 1 minute.
- Scaling path: (a) Offload to S3 + Lambda (if moving to cloud); (b) Stream segments to Whisper without buffering entire file; (c) Implement chunked upload with resume.

**Ollama Parallel Correction Capped at 3 (Semaphore):**

- Current capacity: MAX_PARALLEL_CORRECTIONS = 3 (line 29 in main.py)
- Limit: On Apple Silicon with M1/M3, 3 parallel requests to Ollama cause 90%+ CPU usage. Can't handle >3 concurrent users.
- Scaling path: (a) Use API mode (Mistral) for multi-user; (b) Implement job queue (Redis + Celery); (c) Upgrade hardware.

**AssemblyAI Polling Timeout at 60 Minutes:**

- Current capacity: MAX_POLL_TIME = 60 minutes (line 691 in +page.svelte)
- Limit: Recordings > 60 minutes will timeout during polling. AssemblyAI can process up to ~4 hours per request, but frontend gives up.
- Scaling path: Remove 60-min cap; implement exponential backoff polling; show user progress ("Estimated 15 more minutes").

**WebSocket Connection Limit (Single Backend Instance):**

- Current capacity: One FastAPI worker process
- Limit: Default Uvicorn single-threaded; can handle ~10 concurrent WebSocket connections before queueing delays become noticeable.
- Scaling path: Use multiple Uvicorn workers with Nginx load balancing; or use async worker pool (Gunicorn with async workers).

## Dependencies at Risk

**AssemblyAI SDK Major Version Upgrade Path Unclear:**

- Risk: Current `assemblyai@4.27.0` (package.json) uses older SDK API. SDK is actively developed; breaking changes likely in v5. No migration guide in codebase.
- Impact: Dependency becomes outdated; security patches may require breaking changes.
- Migration plan: Monitor AssemblyAI changelog. Test v5 in staging. Update submit/poll flow if API changes.

**Mistral AI SDK Rate Limiting Not Documented:**

- Risk: `@mistralai/mistralai@1.15.1` implements retry logic but no official docs on rate limit headers. Custom retry loop in code (main.py lines 310–334) may not align with future SDK improvements.
- Impact: Rate limiting behavior may change unexpectedly; custom retry logic becomes obsolete.
- Migration plan: Switch to official SDK retry mechanism once documented. Remove custom retry loop.

**FFmpeg/FFprobe Not Pinned:**

- Risk: System dependencies ffmpeg and ffprobe (used in extract_audio_segment, get_audio_duration) are not version-pinned. Future macOS/Linux distributions may ship incompatible versions.
- Impact: Audio processing may fail on different systems; CI/CD environments may have different ffmpeg versions.
- Migration plan: Add version check at startup; fail gracefully with installation instructions. Docker-ize backend for consistency.

## Missing Critical Features

**No Crash Recovery / Session Resumption:**

- Problem: If browser crashes or connection drops mid-transcription, all progress is lost. User must start recording again.
- Blocks: Professional use cases where reliability is critical.
- Suggested implementation: Save audio chunks to IndexedDB as they arrive; resume from last chunk on reload.

**No Audio Quality Presets:**

- Problem: Audio is always downsampled to 16kHz mono. No option for higher quality (48kHz stereo) or lower (8kHz mono for speech-only).
- Blocks: Users with high-end audio equipment; users on slow connections.
- Suggested implementation: Add UI toggle for "Standard / High / Low" quality; adjust downsampling accordingly.

**No Batch Processing / Bulk Upload:**

- Problem: Only single-file transcription supported. Users with 100 audio files must upload one at a time.
- Blocks: Researchers, content creators, enterprise use cases.
- Suggested implementation: Add folder upload (drag-drop directory); queue files for batch transcription with progress tracking.

**No Transcript Editing UI:**

- Problem: Corrected text is displayed but not editable. User must copy, edit externally, paste back if changes needed.
- Blocks: Users who want to make manual tweaks.
- Suggested implementation: Add inline editing for corrected text; save edits locally and export.

## Test Coverage Gaps

**No E2E Tests for Recording + Transcription + Correction:**

- What's not tested: Full user flow from microphone recording → transcription → correction. Streaming SSE events. Error recovery.
- Files: `src/routes/transcribe/+page.svelte` (all streaming logic)
- Risk: Breaking changes to streaming format (e.g., SSE structure) go undetected.
- Priority: High — core feature must work end-to-end.

**No Tests for Dialect Accuracy:**

- What's not tested: Regional dialect correctness (Mestreechs, Zittesj, etc.). Whether word_boost actually improves transcription. Hybrid mode alignment.
- Files: `backend/dialects.py`, `backend/main.py` (hybrid mode)
- Risk: Dialect features degrade without notice; users report accuracy drops.
- Priority: High — USP of the app.

**No Tests for WebSocket Streaming:**

- What's not tested: WebSocket connection lifecycle; partial messages; client disconnect during streaming; server errors forwarded to client.
- Files: `backend/main.py` (lines 699–803), `src/routes/transcribe/+page.svelte` (lines 394–440)
- Risk: Silent failures; memory leaks on disconnect.
- Priority: Medium — local-dev-only feature but used in demo.

**No Tests for Rate Limiting / Retry Logic:**

- What's not tested: Mistral 429 rate limiting; retry exponential backoff; max retries exceeded.
- Files: `backend/main.py` (lines 310–334), `src/routes/api/correct/+server.ts` (lines 141–169)
- Risk: Rate limit handling breaks under load; no graceful degradation.
- Priority: Medium — affects multi-user scenarios.

**No Tests for Audio Streaming Error Handling:**

- What's not tested: Network timeout during `/transcribe` SSE stream; malformed audio blob; audio encoding failures; Whisper timeout.
- Files: `src/routes/transcribe/+page.svelte` (lines 647–803), `backend/main.py` (lines 363–470)
- Risk: User sees spinner indefinitely; unclear error state.
- Priority: Medium — common failure points.

---

_Concerns audit: 2026-03-23_
