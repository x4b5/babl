# Phase 03: Resource Cleanup - Research

**Researched:** 2026-03-24
**Domain:** Browser resource lifecycle (MediaStream, AudioContext, WebSocket, AbortController)
**Confidence:** HIGH

## Summary

Phase 03 implements proper cleanup of audio resources (microphone, AudioContext, WebSocket) and network requests (fetch/SSE) when the user leaves the page or the component is destroyed. The phase addresses three requirements: beforeunload handler (RC-01), Svelte $effect cleanup (RC-02), and WebSocket close (RC-03).

This is a well-understood browser API domain with stable patterns. The primary challenges are (1) correctly triggering browser confirmation dialogs during active recording/processing, (2) ensuring cleanup runs in all exit paths (tab close, navigation, component destroy), and (3) coordinating cleanup across multiple resource types in the correct order.

**Primary recommendation:** Use beforeunload for both cleanup and confirmation dialog, add pagehide as mobile fallback, implement shared cleanup function called from both event handlers and $effect return, move `stream` variable to component scope (currently trapped in closure), add AbortController instances to component state for fetch/SSE cancellation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Exit Confirmation:**

- **D-01:** Browser "Leave page?" bevestigingsdialoog tonen tijdens zowel recording als processing/correcting status. Voorkomt per ongeluk verlies van opname of verwerking.
- **D-02:** Geen dialoog bij idle status — gebruiker kan altijd vrij vertrekken als er niets actief is.

**Cleanup Scope:**

- **D-03:** Bij vertrek worden alle audio resources opgeruimd: MediaRecorder stop, AudioContext close, alle MediaStreamTracks stop (microfoon LED uit), WebSocket close frame.
- **D-04:** Actieve fetch/SSE requests worden geaborteerd via AbortController bij page unload. Backend krijgt direct signaal dat client weg is.
- **D-05:** `stream` variabele moet naar component-level scope verplaatst worden (momenteel lokaal in `startRecording()` closure) zodat beforeunload en $effect cleanup erbij kunnen.

**Error Messaging:**

- **D-06:** Consistent met Phase 1/2: Nederlandse foutmeldingen (D-08/D-09 Phase 1), alleen tekst geen actieknoppen (D-11 Phase 2).

### Claude's Discretion

- Exacte implementatie van AbortController pattern (single controller vs. per-request)
- Of `$effect` cleanup en `beforeunload` dezelfde functie aanroepen of aparte paths volgen
- Cleanup volgorde (welke resource eerst)
- Of `pagehide` event als fallback naast `beforeunload` nodig is (mobile browsers)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                           | Research Support                                                                                             |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| RC-01 | beforeunload handler stopt MediaRecorder, sluit AudioContext, stopt MediaStreamTracks | Browser lifecycle events (beforeunload + pagehide), MediaStream cleanup pattern, confirmation dialog pattern |
| RC-02 | Svelte $effect cleanup ruimt audio resources op bij component destroy                 | Svelte 5 effect cleanup pattern, shared cleanup function reused between beforeunload and effect              |
| RC-03 | WebSocket verbinding wordt gesloten bij page unload                                   | ReconnectingWebSocket.close() best practices, cleanup in both beforeunload and effect                        |

</phase_requirements>

## Standard Stack

### Core

| Library                | Version          | Purpose                                                            | Why Standard                                                                         |
| ---------------------- | ---------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Browser APIs (native)  | —                | beforeunload, pagehide, MediaStream, AudioContext, AbortController | No external libraries needed — native browser lifecycle and resource management APIs |
| Svelte 5 runes         | 5.51.0 (current) | $effect cleanup pattern                                            | Project standard (CLAUDE.md), replaces legacy onDestroy                              |
| reconnecting-websocket | 4.4.0 (current)  | WebSocket with auto-reconnect                                      | Already in project (Phase 1), provides .close() method                               |

### Supporting

| Library | Version         | Purpose        | When to Use                                               |
| ------- | --------------- | -------------- | --------------------------------------------------------- |
| Vitest  | 4.1.1 (current) | Test framework | Phase validation — testing cleanup in component lifecycle |

### Alternatives Considered

| Instead of                  | Could Use                     | Tradeoff                                                                                                                                                  |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| beforeunload + pagehide     | visibilitychange              | visibilitychange fires when tab is hidden (not closed), doesn't reliably indicate page unload — wrong semantic event                                      |
| Native $effect cleanup      | onDestroy (Svelte 4)          | Project uses Svelte 5 runes only (CLAUDE.md rule) — onDestroy is legacy                                                                                   |
| AbortController per request | Single shared AbortController | Single controller aborts all requests simultaneously — loses granularity if only one request should cancel (recommendation: per-request for independence) |

**Installation:**
No new packages required — all APIs are native browser or already installed.

**Version verification:** Performed 2026-03-24.

- Svelte: 5.51.0 (package.json matches)
- reconnecting-websocket: 4.4.0 (package.json matches)
- Vitest: 4.1.1 (latest 4.1.1, published 2025-01-20)

## Architecture Patterns

### Recommended Cleanup Flow

```
Page unload OR component destroy
    ↓
Cleanup function called (shared implementation)
    ↓
1. Abort fetch/SSE requests (AbortController.abort())
2. Stop MediaRecorder (if state === 'recording')
3. Stop all MediaStreamTracks (stream.getTracks().forEach(track => track.stop()))
4. Close AudioContext (audioContext.close())
5. Close WebSocket (streamSocket.close())
6. Clear timers (intervals, timeouts)
```

### Pattern 1: beforeunload + pagehide Dual Handler

**What:** Register both beforeunload (desktop, confirmation dialog) and pagehide (mobile fallback, bfcache compatible) event handlers. beforeunload triggers confirmation dialog if status is active, then runs cleanup. pagehide runs cleanup without dialog (no cancellation possible on mobile).

**When to use:** Always — covers desktop and mobile exit paths.

**Example:**

```typescript
// Source: MDN beforeunload event + Chrome deprecating unload guidance
$effect(() => {
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		// Trigger confirmation dialog if recording/processing/correcting (D-01)
		if (status === 'recording' || status === 'processing' || status === 'correcting') {
			e.preventDefault(); // Modern standard
			e.returnValue = ''; // Legacy support (custom message no longer shown)
		}
		// Cleanup runs regardless of dialog result
		cleanupResources();
	}

	function handlePageHide(e: PageTransitionEvent) {
		// Mobile fallback — no confirmation dialog possible
		cleanupResources();
	}

	window.addEventListener('beforeunload', handleBeforeUnload);
	window.addEventListener('pagehide', handlePageHide);

	return () => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
		window.removeEventListener('pagehide', handlePageHide);
	};
});
```

### Pattern 2: Shared Cleanup Function

**What:** Extract cleanup logic into a single function called from both event handlers and $effect cleanup. Prevents code duplication and ensures consistent cleanup.

**When to use:** Always when cleanup logic appears in multiple places.

**Example:**

```typescript
// Source: Svelte 5 effect cleanup pattern (GitHub discussion #11980)
function cleanupResources() {
	// 1. Abort fetch/SSE (D-04)
	if (transcribeController) {
		transcribeController.abort();
		transcribeController = undefined;
	}
	if (correctionController) {
		correctionController.abort();
		correctionController = undefined;
	}

	// 2. Stop recording (D-03)
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		mediaRecorder.stop(); // Triggers onstop callback which cleans tracks
	}

	// 3. Stop media tracks directly (D-03)
	if (stream) {
		stream.getTracks().forEach((track) => track.stop());
		stream = undefined;
	}

	// 4. Close AudioContext (D-03)
	if (audioContext) {
		audioContext.close();
		audioContext = undefined;
	}

	// 5. Close WebSocket (RC-03)
	if (streamSocket) {
		streamSocket.close();
		streamSocket = undefined;
	}

	// 6. Clear timers
	if (streamStallTimer) clearTimeout(streamStallTimer);
	if (timerInterval) clearInterval(timerInterval);
	if (processingTimerInterval) clearInterval(processingTimerInterval);
	if (liveInterval) clearInterval(liveInterval);
}

// Component-level effect cleanup
$effect(() => {
	return () => {
		cleanupResources();
	};
});
```

### Pattern 3: AbortController Per Request

**What:** Create separate AbortController instances for each fetch/SSE request (transcribe, correction). Store as component-level state. Call .abort() in cleanup function.

**When to use:** When multiple concurrent requests may need independent cancellation. Safer than single shared controller.

**Example:**

```typescript
// Source: MDN AbortController + TypeOfNaN multi-request pattern
let transcribeController: AbortController | undefined;
let correctionController: AbortController | undefined;

async function sendAudioLocal(formData: FormData) {
	transcribeController = new AbortController(); // Fresh instance per request
	let stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);

	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
			method: 'POST',
			body: formData,
			signal: transcribeController.signal // Pass signal
		});
		// ... SSE reading logic
	} catch (e) {
		if (e.name === 'AbortError') {
			console.log('Request aborted'); // Don't treat as error
			return;
		}
		// Handle genuine errors
	} finally {
		clearTimeout(stallTimeout);
		transcribeController = undefined; // Clear after completion
	}
}

// Cleanup aborts all active controllers
function cleanupResources() {
	if (transcribeController) {
		transcribeController.abort();
		transcribeController = undefined;
	}
	if (correctionController) {
		correctionController.abort();
		correctionController = undefined;
	}
	// ... other cleanup
}
```

### Pattern 4: Move Stream to Component Scope

**What:** Relocate `stream` variable from `startRecording()` function scope to component-level `let stream: MediaStream | undefined`. Allows cleanup functions to access it.

**When to use:** Required (D-05) — cleanup must stop tracks, but `stream` is currently inaccessible outside `startRecording()`.

**Example:**

```typescript
// Source: Existing code + CONTEXT.md D-05
// Component scope (top of <script>)
let stream: MediaStream | undefined;

async function startRecording() {
	// ... setup code
	stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Assign to component var
	mediaRecorder = new MediaRecorder(stream, { mimeType });
	// ... rest of function
}

// Now cleanup can access stream
function cleanupResources() {
	if (stream) {
		stream.getTracks().forEach((track) => track.stop());
		stream = undefined;
	}
}
```

### Anti-Patterns to Avoid

- **Cleanup in mediaRecorder.onstop only:** onstop doesn't fire if page unloads during recording — tracks leak. Must also cleanup in beforeunload/pagehide.
- **Custom confirmation dialog:** Browser no longer shows custom messages in beforeunload dialog (security/UX). Only generic browser text appears. Don't waste time crafting messages.
- **Single AbortController reused:** AbortController instances are single-use — once aborted, cannot be reused. Must create fresh instance per request.
- **Cleanup without null assignment:** After closing resources (AudioContext, stream), set variables to `undefined` to prevent double-close errors on subsequent cleanup calls.
- **unload event:** Chrome/Safari deprecating unload in favor of pagehide. unload is unreliable on mobile and blocks bfcache optimization.

## Don't Hand-Roll

| Problem                         | Don't Build                                          | Use Instead                                        | Why                                                                                                                            |
| ------------------------------- | ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| WebSocket reconnection          | Custom retry logic with timers                       | reconnecting-websocket library (already installed) | Handles exponential backoff, jitter, max attempts — project already uses this (Phase 1)                                        |
| Browser lifecycle detection     | Custom beforeunload + visibilitychange state machine | beforeunload + pagehide event handlers             | visibilitychange fires on tab hide (not close), wrong semantic event — beforeunload/pagehide are purpose-built for page unload |
| AbortController polyfill        | Custom fetch cancellation wrapper                    | Native AbortController (supported since 2017)      | All modern browsers support AbortController — no polyfill needed, project targets modern browsers                              |
| Cleanup orchestration framework | State machine with cleanup phases                    | Single shared cleanup function                     | Over-engineering — cleanup is simple imperative sequence (abort, stop, close), no complex state needed                         |

**Key insight:** Browser lifecycle and resource cleanup are well-solved problems with stable APIs. The complexity is coordination (ensuring cleanup runs in all exit paths) not individual API usage. Stick to native APIs and simple patterns.

## Runtime State Inventory

> Phase is frontend code/config-only (no rename/refactor/migration). No runtime state outside the codebase.

**Skipped:** This section applies to phases involving rename, refactor, or migration. Phase 03 is greenfield implementation.

## Common Pitfalls

### Pitfall 1: Mobile beforeunload Unreliability

**What goes wrong:** Code only uses beforeunload for cleanup. Works on desktop (Chrome, Firefox, Safari) but fails on mobile — tabs are backgrounded and killed without firing beforeunload.

**Why it happens:** Mobile browsers aggressively manage memory by killing backgrounded tabs. The page doesn't technically "unload" via navigation — it's suspended and then terminated. beforeunload doesn't fire in this scenario.

**How to avoid:** Add pagehide event listener alongside beforeunload. pagehide fires when page is hidden (tab switch, browser background, tab close). More reliable on mobile and compatible with browser back/forward cache (bfcache).

**Warning signs:** User reports microphone LED stays on after closing tab on iPhone/Android. Desktop testing passes but mobile fails.

**Source:** [MDN: Window pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event), [Chrome: Deprecating unload event](https://developer.chrome.com/docs/web-platform/deprecating-unload)

### Pitfall 2: stream Variable Closure Trap

**What goes wrong:** `stream` is declared as `const stream = await getUserMedia()` inside `startRecording()` function. beforeunload handler can't access it to stop tracks. Microphone LED stays on after page close.

**Why it happens:** JavaScript closure scope — `stream` is local to `startRecording()` function. Cleanup functions (beforeunload, pagehide, $effect) are in different scope.

**How to avoid:** Declare `let stream: MediaStream | undefined` at component scope (alongside other component-level variables like `mediaRecorder`, `audioContext`). Assign to it in `startRecording()`: `stream = await getUserMedia()`. Now all cleanup functions can access it.

**Warning signs:** TypeScript error "Cannot find name 'stream'" in cleanup function. Microphone permission indicator stays active after leaving page.

**Source:** CONTEXT.md D-05 explicitly calls this out as required change.

### Pitfall 3: AbortController Reuse

**What goes wrong:** Code creates single AbortController at component initialization, uses it for all fetch requests. After first .abort() call, subsequent requests immediately abort (or don't abort when expected).

**Why it happens:** AbortController instances are single-use. Once .abort() is called, the signal remains aborted permanently. Creating new requests with an already-aborted signal causes immediate abort.

**How to avoid:** Create fresh AbortController instance per request. Store as component state (e.g., `transcribeController`, `correctionController`). Set to `undefined` after request completes. Create new instance for next request.

**Warning signs:** Second transcription request fails immediately with AbortError. Cleanup doesn't abort active request (because controller was already aborted by previous request).

**Source:** [TypeOfNaN: Abort Multiple Fetch Requests](https://typeofnan.dev/how-to-abort-multiple-fetch-requests-in-javascript-using-abortcontroller/), [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

### Pitfall 4: Custom Confirmation Message

**What goes wrong:** Code sets `e.returnValue = "Are you sure you want to leave?"` expecting custom message in dialog. Browser shows generic "Leave site?" text instead.

**Why it happens:** Browsers removed custom beforeunload messages in 2016-2017 (security/UX: malicious sites abused them). Only generic browser-controlled text appears regardless of returnValue string.

**How to avoid:** Use empty string `e.returnValue = ''` or any truthy value. Don't waste time crafting messages — they won't display. Focus on cleanup logic instead.

**Warning signs:** Developer confused why custom message doesn't appear. Time spent wordsmithing messages that users never see.

**Source:** [MDN: BeforeUnloadEvent returnValue](https://developer.mozilla.org/en-US/docs/Web/API/BeforeUnloadEvent/returnValue)

### Pitfall 5: Cleanup Race Condition with onstop

**What goes wrong:** beforeunload calls `mediaRecorder.stop()`, which triggers onstop callback. onstop callback also runs cleanup (stops tracks, closes AudioContext). beforeunload then tries to close already-closed AudioContext → error or no-op.

**Why it happens:** MediaRecorder.stop() is asynchronous — onstop callback fires shortly after. beforeunload doesn't wait for onstop to complete before running its own cleanup.

**How to avoid:** Make cleanup functions idempotent (safe to call multiple times). Check resource state before closing: `if (audioContext && audioContext.state !== 'closed') audioContext.close()`. Alternatively, remove cleanup from onstop and only cleanup in beforeunload/pagehide/$effect.

**Warning signs:** Console errors "AudioContext already closed" during page unload. Cleanup seems to run twice.

**Source:** Current code pattern in +page.svelte (onstop at line 570-589 already does cleanup) + beforeunload adding second cleanup path.

## Code Examples

Verified patterns from official sources and existing project code:

### beforeunload Confirmation Dialog

```typescript
// Source: MDN Window beforeunload event
// https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
$effect(() => {
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		// Show confirmation only if recording/processing/correcting (D-01)
		if (status === 'recording' || status === 'processing' || status === 'correcting') {
			e.preventDefault(); // Standard way to trigger dialog
			e.returnValue = ''; // Legacy support (empty string is sufficient)
		}
		// No dialog if idle (D-02) — cleanup still runs
	}

	window.addEventListener('beforeunload', handleBeforeUnload);
	return () => window.removeEventListener('beforeunload', handleBeforeUnload);
});
```

### MediaStream Cleanup

```typescript
// Source: MDN MediaStreamTrack.stop() + Chrome MediaStream deprecations
// https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop
// https://developer.chrome.com/blog/mediastream-deprecations
if (stream) {
	stream.getTracks().forEach((track) => {
		track.stop(); // Sets track.readyState to 'ended'
	});
	stream = undefined; // Release reference for GC
}
```

### AudioContext Cleanup

```typescript
// Source: Existing code (stopWaveform function, line 333-344)
if (audioContext && audioContext.state !== 'closed') {
	audioContext.close(); // Returns Promise, but cleanup doesn't need to await
	audioContext = undefined;
	analyser = undefined;
}
if (animationFrameId) {
	cancelAnimationFrame(animationFrameId);
	animationFrameId = undefined;
}
```

### WebSocket Cleanup

```typescript
// Source: Existing code (stopRealtimeStream function, line 509-521)
// + reconnecting-websocket library documentation
if (streamSocket) {
	streamSocket.close(); // Sends close frame, stops reconnection attempts
	streamSocket = undefined;
}
reconnecting = false;
reconnectStatus = '';
if (streamStallTimer) {
	clearTimeout(streamStallTimer);
	streamStallTimer = undefined;
}
```

### AbortController for SSE Cleanup

```typescript
// Source: Existing code (sendAudioLocal, line 824-891) + cleanup integration
let transcribeController: AbortController | undefined;

async function sendAudioLocal(formData: FormData) {
	transcribeController = new AbortController();
	let stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);

	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
			method: 'POST',
			body: formData,
			signal: transcribeController.signal
		});

		const reader = resp.body!.getReader();
		// ... SSE reading loop
	} catch (e) {
		clearTimeout(stallTimeout);
		if (e.name === 'AbortError') {
			// Intentional abort — don't show error
			console.log('Transcription aborted');
			return;
		}
		// Handle genuine errors
		const classified = classifyFrontendError(e);
		errorType = classified;
		error = getUserMessage(classified);
	} finally {
		transcribeController = undefined;
	}
}

// Cleanup aborts active request
function cleanupResources() {
	if (transcribeController) {
		transcribeController.abort();
		transcribeController = undefined;
	}
}
```

### Svelte 5 Effect Cleanup Pattern

```typescript
// Source: Svelte 5 docs + GitHub discussion #11980
// https://svelte.dev/docs/svelte/lifecycle-hooks
// https://github.com/sveltejs/svelte/discussions/11980
$effect(() => {
	// Setup code (if any)

	// Return cleanup function — runs on component destroy
	return () => {
		cleanupResources();
	};
});
```

## State of the Art

| Old Approach                | Current Approach                             | When Changed                               | Impact                                                                                                |
| --------------------------- | -------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| unload event                | pagehide + beforeunload                      | 2020-2021 (Chrome 117 deprecation warning) | unload unreliable on mobile, blocks bfcache — use pagehide for cleanup, beforeunload for confirmation |
| Custom beforeunload message | Generic browser message only                 | 2016-2017 (all major browsers)             | Custom text ignored for security — don't craft messages, use empty string                             |
| MediaStream.stop()          | MediaStreamTrack.stop()                      | 2015 (Chrome 47)                           | Call .stop() on individual tracks, not stream — MediaStream.stop() deprecated                         |
| Single cleanup in onstop    | Cleanup in beforeunload + pagehide + $effect | Ongoing best practice                      | onstop doesn't fire on page unload — must cleanup in lifecycle events too                             |
| onDestroy (Svelte 4)        | $effect cleanup return (Svelte 5)            | Svelte 5 release (2024)                    | Project uses Svelte 5 runes only — $effect replaces onDestroy                                         |

**Deprecated/outdated:**

- **unload event:** Chrome showing deprecation warnings, will be removed. Use pagehide instead.
- **MediaStream.stop():** Use MediaStreamTrack.stop() on individual tracks (via getTracks()).
- **Svelte onDestroy:** Legacy lifecycle hook — Svelte 5 uses $effect cleanup return.

## Open Questions

None — domain is well-understood with stable browser APIs and clear documentation. All requirements have verified implementation patterns.

## Environment Availability

| Dependency                  | Required By                 | Available  | Version | Fallback |
| --------------------------- | --------------------------- | ---------- | ------- | -------- |
| Browser beforeunload API    | RC-01 (confirmation dialog) | ✓ (native) | —       | —        |
| Browser pagehide API        | RC-01 (mobile fallback)     | ✓ (native) | —       | —        |
| Browser AbortController API | RC-04 (fetch/SSE abort)     | ✓ (native) | —       | —        |
| MediaStream.getTracks() API | RC-01 (stop tracks)         | ✓ (native) | —       | —        |
| AudioContext.close() API    | RC-01 (close audio)         | ✓ (native) | —       | —        |
| reconnecting-websocket      | RC-03 (WebSocket close)     | ✓          | 4.4.0   | —        |
| Svelte 5 $effect            | RC-02 (component cleanup)   | ✓          | 5.51.0  | —        |

**Missing dependencies with no fallback:**

- None — all dependencies are native browser APIs (universally supported) or already installed packages.

**Missing dependencies with fallback:**

- None

## Validation Architecture

### Test Framework

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| Framework          | Vitest 4.1.1 (installed)                     |
| Config file        | None — see Wave 0 gap                        |
| Quick run command  | `npm run test` (runs vitest in watch mode)   |
| Full suite command | `npm run test:run` (runs vitest once, exits) |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                            | Test Type | Automated Command                                        | File Exists? |
| ------ | ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------- | ------------ |
| RC-01  | beforeunload stops MediaRecorder, closes AudioContext, stops MediaStreamTracks      | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |
| RC-01  | beforeunload shows confirmation dialog if status is recording/processing/correcting | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |
| RC-01  | pagehide runs cleanup (mobile fallback)                                             | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |
| RC-02  | $effect cleanup calls cleanup function on component destroy                         | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |
| RC-03  | WebSocket.close() called in cleanup                                                 | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |
| RC-04  | AbortController.abort() called for active fetch/SSE requests                        | unit      | `npm run test:run src/routes/transcribe/cleanup.test.ts` | ❌ Wave 0    |

**Note:** Testing browser lifecycle events (beforeunload, pagehide) and Svelte component destroy requires mocking browser APIs and Svelte test utilities. Primary validation will be manual testing (open DevTools → Network tab, close tab during recording, verify mic LED turns off + requests cancelled).

### Sampling Rate

- **Per task commit:** `npm run test:run` (full suite — quick for unit tests)
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green + manual verification (mic LED off after tab close, no console errors)

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration (browser mode for DOM APIs, aliases)
- [ ] `src/routes/transcribe/cleanup.test.ts` — Unit tests for cleanup function, beforeunload/pagehide handlers, $effect cleanup, AbortController abort
- [ ] Test utilities — Mock implementations for MediaStream, AudioContext, WebSocket, addEventListener/removeEventListener

**Manual verification required:** Browser mic LED indicator (hardware signal), browser confirmation dialog appearance, Network tab request cancellation. These cannot be fully automated.

## Sources

### Primary (HIGH confidence)

- [MDN: Window beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event) — Confirmation dialog pattern, preventDefault + returnValue
- [MDN: Window pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event) — Mobile fallback, bfcache compatibility
- [MDN: MediaStreamTrack.stop()](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop) — Stop individual tracks pattern
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Fetch cancellation API
- [Chrome: Deprecating unload event](https://developer.chrome.com/docs/web-platform/deprecating-unload) — Why pagehide replaces unload
- [Chrome: MediaStream deprecations](https://developer.chrome.com/blog/mediastream-deprecations) — MediaStream.stop() deprecated, use track.stop()
- [Svelte: Lifecycle hooks](https://svelte.dev/docs/svelte/lifecycle-hooks) — $effect cleanup pattern
- Existing code: `src/routes/transcribe/+page.svelte` (line 333-344 stopWaveform, 509-521 stopRealtimeStream, 570-589 onstop cleanup, 824-891 AbortController usage)

### Secondary (MEDIUM confidence)

- [TypeOfNaN: Abort Multiple Fetch Requests](https://typeofnan.dev/how-to-abort-multiple-fetch-requests-in-javascript-using-abortcontroller/) — Multi-request AbortController pattern (verified against MDN)
- [GitHub: Svelte $effect cleanup discussion #11980](https://github.com/sveltejs/svelte/discussions/11980) — Community patterns for runes cleanup (verified against Svelte docs)
- [OneUpTime: WebSocket Graceful Shutdown](https://oneuptime.com/blog/post/2026-02-02-websocket-graceful-shutdown/view) — Close frame best practices (verified against existing code)

### Tertiary (LOW confidence)

- None — all findings verified with official documentation or existing project code

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Native browser APIs, existing project dependencies, no new installations
- Architecture: HIGH - Well-documented patterns (MDN, Chrome docs), existing project code provides templates
- Pitfalls: HIGH - Known issues documented in browser changelogs (unload deprecation), stack overflow common errors, CONTEXT.md explicitly calls out stream closure trap

**Research date:** 2026-03-24
**Valid until:** 60 days (stable browser APIs, no fast-moving ecosystem)
