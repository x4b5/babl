import { describe, it, expect } from 'vitest';
import { getUserMessage, isRetryable } from './error-classifier';
import type { ErrorType } from './error-types';

const ALL_ERROR_TYPES: ErrorType[] = [
	'rate_limit',
	'timeout',
	'upstream_disconnect',
	'network_error'
];

describe('getUserMessage', () => {
	it('rate_limit returns Dutch rate limit message', () => {
		expect(getUserMessage('rate_limit')).toBe('Overbelast. Even geduld.');
	});

	it('timeout returns Dutch timeout message', () => {
		expect(getUserMessage('timeout')).toBe('Duurt te lang — probeer een korter fragment.');
	});

	it('upstream_disconnect returns Dutch disconnect message', () => {
		expect(getUserMessage('upstream_disconnect')).toBe('Backend niet bereikbaar.');
	});

	it('network_error returns Dutch network message', () => {
		expect(getUserMessage('network_error')).toBe('Geen internet.');
	});

	describe('EH-02: no generic messages', () => {
		for (const errorType of ALL_ERROR_TYPES) {
			it(`${errorType} message does NOT contain "mislukt"`, () => {
				expect(getUserMessage(errorType)).not.toContain('mislukt');
			});

			it(`${errorType} message does NOT contain "Fout:"`, () => {
				expect(getUserMessage(errorType)).not.toContain('Fout:');
			});
		}
	});

	describe('D-05: no technical details', () => {
		for (const errorType of ALL_ERROR_TYPES) {
			it(`${errorType} message does NOT contain HTTP status codes`, () => {
				const msg = getUserMessage(errorType);
				expect(msg).not.toMatch(/\b(4\d{2}|5\d{2})\b/);
			});

			it(`${errorType} message does NOT contain "HTTP"`, () => {
				expect(getUserMessage(errorType)).not.toContain('HTTP');
			});
		}
	});
});

describe('isRetryable', () => {
	it('rate_limit is retryable', () => {
		expect(isRetryable('rate_limit')).toBe(true);
	});

	it('timeout is NOT retryable', () => {
		expect(isRetryable('timeout')).toBe(false);
	});

	it('upstream_disconnect is NOT retryable', () => {
		expect(isRetryable('upstream_disconnect')).toBe(false);
	});

	it('network_error is NOT retryable', () => {
		expect(isRetryable('network_error')).toBe(false);
	});
});
