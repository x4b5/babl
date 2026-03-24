/**
 * Resource cleanup utilities for audio/network resources.
 * Extracted from +page.svelte for testability and reuse.
 * Used by beforeunload, pagehide, and $effect cleanup paths.
 *
 * STUB: Function signatures only. Implementation added in Plan 01.
 */

/**
 * Stop media resources: MediaRecorder, MediaStream tracks, AudioContext, animation frame.
 * Safe to call multiple times (idempotent).
 */
export function cleanupMediaResources(refs: {
	mediaRecorder: MediaRecorder | undefined;
	stream: MediaStream | undefined;
	audioContext: AudioContext | undefined;
	analyser: { current: AnalyserNode | undefined };
	animationFrameId: { current: number | undefined };
}): void {
	// STUB — implementation in Plan 01
}

/**
 * Abort active network requests and close WebSocket.
 * Safe to call multiple times (idempotent).
 */
export function cleanupNetworkResources(refs: {
	transcribeController: AbortController | undefined;
	correctionController: AbortController | undefined;
	liveChunkController: AbortController | undefined;
	apiPollController: AbortController | undefined;
	streamSocket: { close: () => void } | undefined;
}): void {
	// STUB — implementation in Plan 01
}

/**
 * Clear all active timers.
 * Safe to call multiple times (idempotent).
 */
export function cleanupTimers(refs: {
	timerInterval: ReturnType<typeof setInterval> | undefined;
	processingTimerInterval: ReturnType<typeof setInterval> | undefined;
	liveInterval: ReturnType<typeof setInterval> | undefined;
	countdownInterval: ReturnType<typeof setInterval> | undefined;
	streamStallTimer: ReturnType<typeof setTimeout> | undefined;
}): void {
	// STUB — implementation in Plan 01
}
