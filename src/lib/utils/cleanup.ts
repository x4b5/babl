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
	// Stop MediaRecorder if recording
	if (refs.mediaRecorder && refs.mediaRecorder.state === 'recording') {
		try {
			refs.mediaRecorder.stop();
		} catch {
			// Already stopped - safe to ignore
		}
	}

	// Stop all media tracks (turns off microphone LED)
	if (refs.stream) {
		refs.stream.getTracks().forEach((track) => track.stop());
	}

	// Cancel animation frame
	if (refs.animationFrameId.current !== undefined) {
		cancelAnimationFrame(refs.animationFrameId.current);
		refs.animationFrameId.current = undefined;
	}

	// Close AudioContext if not already closed
	if (refs.audioContext && refs.audioContext.state !== 'closed') {
		refs.audioContext.close();
	}

	// Clear analyser reference
	refs.analyser.current = undefined;
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
	// Abort all active AbortControllers
	refs.transcribeController?.abort();
	refs.correctionController?.abort();
	refs.liveChunkController?.abort();
	refs.apiPollController?.abort();

	// Close WebSocket
	if (refs.streamSocket) {
		refs.streamSocket.close();
	}
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
	// Clear all intervals
	if (refs.timerInterval !== undefined) {
		clearInterval(refs.timerInterval);
	}
	if (refs.processingTimerInterval !== undefined) {
		clearInterval(refs.processingTimerInterval);
	}
	if (refs.liveInterval !== undefined) {
		clearInterval(refs.liveInterval);
	}
	if (refs.countdownInterval !== undefined) {
		clearInterval(refs.countdownInterval);
	}

	// Clear timeout
	if (refs.streamStallTimer !== undefined) {
		clearTimeout(refs.streamStallTimer);
	}
}
