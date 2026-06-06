import type { ErrorType } from './error-types';
import { ERROR_MESSAGES } from './error-types';
import { setError, setErrorType, setStatus } from '$lib/stores/transcribe.svelte';

/**
 * Classify a frontend-caught error into the error taxonomy.
 * Used for non-SSE errors (fetch failures, AbortErrors, etc.)
 * SSE errors already arrive classified from backend/API routes.
 * Per D-04: universal error system for all API calls.
 */
export function classifyFrontendError(e: unknown): ErrorType {
	// AbortError = timeout (AbortController signal fired)
	if (e instanceof DOMException && e.name === 'AbortError') {
		return 'timeout';
	}

	const msg = e instanceof Error ? e.message : String(e);

	// TypeError with fetch-specific message = can't reach server.
	// Check navigator.onLine to distinguish "no internet" from "backend down".
	if (
		e instanceof TypeError &&
		(msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed'))
	) {
		if (typeof navigator !== 'undefined' && navigator.onLine) {
			return 'upstream_disconnect';
		}
		return 'network_error';
	}

	// Rate limit
	if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
		return 'rate_limit';
	}

	// Upstream disconnect
	if (msg.includes('502') || msg.includes('503') || msg.includes('ECONNREFUSED')) {
		return 'upstream_disconnect';
	}

	// Timeout
	if (msg.toLowerCase().includes('timeout')) {
		return 'timeout';
	}

	// Default: server_error — don't blame the user's internet for unknown errors
	return 'server_error';
}

/**
 * Get user-facing Dutch message for an error type.
 * Per D-05: no technical details. Per D-09: short and direct.
 * Per EH-02: never generic "mislukt".
 */
export function getUserMessage(errorType: ErrorType): string {
	return ERROR_MESSAGES[errorType] || ERROR_MESSAGES['server_error'];
}

/**
 * Whether the error type supports auto-retry with countdown.
 * Only rate_limit is retry-able (per D-03: auto-retry after countdown).
 */
export function isRetryable(errorType: ErrorType): boolean {
	return errorType === 'rate_limit';
}

/** Check if an error is an AbortController cancellation. */
export function isAbortError(e: unknown): boolean {
	return e instanceof Error && e.name === 'AbortError';
}

/** Classify a caught error, set store error state, and reset status to idle. */
export function handleCaughtError(e: unknown): void {
	const classified = classifyFrontendError(e);
	setErrorType(classified);
	setError(getUserMessage(classified));
	setStatus('idle');
}
