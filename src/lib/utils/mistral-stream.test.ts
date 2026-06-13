import { describe, it, expect } from 'vitest';
import { classifyError } from './mistral-stream';

describe('classifyError', () => {
	it('classifies statusCode 429 as rate_limit with parsed retry-after', () => {
		const err = { statusCode: 429, response: { headers: { 'retry-after': '10' } } };
		const result = classifyError(err);
		expect(result.errorType).toBe('rate_limit');
		expect(result.retryAfter).toBe(10);
	});

	it('classifies statusCode 429 without headers as rate_limit (default retry-after)', () => {
		const result = classifyError({ statusCode: 429 });
		expect(result.errorType).toBe('rate_limit');
		expect(result.retryAfter).toBe(3);
	});

	it('classifies statusCode 502 as upstream_disconnect', () => {
		expect(classifyError({ statusCode: 502 }).errorType).toBe('upstream_disconnect');
	});

	it('classifies statusCode 503 as upstream_disconnect', () => {
		expect(classifyError({ status: 503 }).errorType).toBe('upstream_disconnect');
	});

	it('classifies "HTTP 429" message as rate_limit', () => {
		const result = classifyError(new Error('HTTP 429 Too Many Requests'));
		expect(result.errorType).toBe('rate_limit');
		expect(result.retryAfter).toBe(3);
	});

	it('classifies ECONNREFUSED as upstream_disconnect', () => {
		expect(classifyError(new Error('connect ECONNREFUSED')).errorType).toBe('upstream_disconnect');
	});

	it('classifies AbortError as timeout', () => {
		expect(classifyError(new DOMException('aborted', 'AbortError')).errorType).toBe('timeout');
	});

	it('classifies a timeout message as timeout', () => {
		expect(classifyError(new Error('request timeout')).errorType).toBe('timeout');
	});

	it('classifies "Failed to fetch" as server_error', () => {
		expect(classifyError(new Error('Failed to fetch')).errorType).toBe('server_error');
	});

	it('defaults unknown errors to server_error', () => {
		expect(classifyError(new Error('iets onverwachts')).errorType).toBe('server_error');
		expect(classifyError('plain string').errorType).toBe('server_error');
	});
});
