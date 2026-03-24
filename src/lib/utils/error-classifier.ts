import type { ErrorType } from './error-types';
import { ERROR_MESSAGES } from './error-types';

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

	// TypeError = network error (browser fetch failure)
	if (e instanceof TypeError) {
		return 'network_error';
	}

	const msg = e instanceof Error ? e.message : String(e);

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

	// Network errors
	if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
		return 'network_error';
	}

	// Default: network_error (safest fallback for unknown errors)
	return 'network_error';
}

/**
 * Get user-facing Dutch message for an error type.
 * Per D-05: no technical details. Per D-09: short and direct.
 * Per EH-02: never generic "mislukt".
 */
export function getUserMessage(errorType: ErrorType): string {
	return ERROR_MESSAGES[errorType];
}

/**
 * Whether the error type supports auto-retry with countdown.
 * Only rate_limit is retry-able (per D-03: auto-retry after countdown).
 */
export function isRetryable(errorType: ErrorType): boolean {
	return errorType === 'rate_limit';
}
