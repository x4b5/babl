import { describe, it, expect } from 'vitest';
import { classifyFrontendError } from './error-classifier';

describe('classifyFrontendError', () => {
	it('classifies TypeError (Failed to fetch) as network_error', () => {
		expect(classifyFrontendError(new TypeError('Failed to fetch'))).toBe('network_error');
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

	it('classifies NetworkError as network_error', () => {
		expect(classifyFrontendError(new Error('NetworkError'))).toBe('network_error');
	});

	it('defaults unknown errors to network_error', () => {
		expect(classifyFrontendError(new Error('Something completely unknown'))).toBe('network_error');
	});

	it('handles non-Error values', () => {
		expect(classifyFrontendError('string error')).toBe('network_error');
		expect(classifyFrontendError(42)).toBe('network_error');
	});
});
