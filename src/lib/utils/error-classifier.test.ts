import { describe, it, expect, vi } from 'vitest';
import { classifyFrontendError } from './error-classifier';

describe('classifyFrontendError', () => {
	it('classifies TypeError (Failed to fetch) as upstream_disconnect when online', () => {
		// navigator.onLine defaults to true in jsdom
		expect(classifyFrontendError(new TypeError('Failed to fetch'))).toBe('upstream_disconnect');
	});

	it('classifies TypeError (Failed to fetch) as network_error when offline', () => {
		vi.stubGlobal('navigator', { ...navigator, onLine: false });
		expect(classifyFrontendError(new TypeError('Failed to fetch'))).toBe('network_error');
		vi.unstubAllGlobals();
	});

	it('classifies DOMException AbortError as timeout', () => {
		expect(classifyFrontendError(new DOMException('', 'AbortError'))).toBe('timeout');
	});

	it('classifies HTTP 429 error as rate_limit', () => {
		expect(classifyFrontendError(new Error('HTTP 429'))).toBe('rate_limit');
	});

	it('classifies rate limit message as rate_limit', () => {
		expect(classifyFrontendError(new Error('Rate Limit Exceeded'))).toBe('rate_limit');
	});

	it('classifies HTTP 502 as upstream_disconnect', () => {
		expect(classifyFrontendError(new Error('HTTP 502'))).toBe('upstream_disconnect');
	});

	it('classifies HTTP 503 as upstream_disconnect', () => {
		expect(classifyFrontendError(new Error('HTTP 503'))).toBe('upstream_disconnect');
	});

	it('classifies ECONNREFUSED as upstream_disconnect', () => {
		expect(classifyFrontendError(new Error('ECONNREFUSED'))).toBe('upstream_disconnect');
	});

	it('classifies timeout message as timeout', () => {
		expect(classifyFrontendError(new Error('Request timeout'))).toBe('timeout');
	});

	it('classifies TypeError with NetworkError as upstream_disconnect when online', () => {
		expect(classifyFrontendError(new TypeError('NetworkError when attempting to fetch'))).toBe(
			'upstream_disconnect'
		);
	});

	it('classifies non-TypeError NetworkError as server_error', () => {
		// Only TypeError gets special fetch-failure handling
		expect(classifyFrontendError(new Error('NetworkError'))).toBe('server_error');
	});

	it('classifies generic TypeError (not fetch-related) as server_error', () => {
		expect(classifyFrontendError(new TypeError('Cannot read properties of undefined'))).toBe(
			'server_error'
		);
	});

	it('defaults unknown errors to server_error', () => {
		expect(classifyFrontendError(new Error('Something completely unknown'))).toBe('server_error');
	});

	it('handles non-Error values', () => {
		expect(classifyFrontendError('string error')).toBe('server_error');
		expect(classifyFrontendError(42)).toBe('server_error');
	});
});
