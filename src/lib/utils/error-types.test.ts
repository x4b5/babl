import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES, rateLimitMessage, RATE_LIMIT_EXHAUSTED } from './error-types';
import type { ErrorType } from './error-types';

describe('ERROR_MESSAGES', () => {
	const allTypes: ErrorType[] = [
		'rate_limit',
		'timeout',
		'upstream_disconnect',
		'network_error',
		'server_error',
		'mic_denied',
		'ollama_model_missing',
		'ollama_unavailable'
	];

	it('has a message for every ErrorType', () => {
		for (const type of allTypes) {
			expect(ERROR_MESSAGES[type]).toBeDefined();
			expect(typeof ERROR_MESSAGES[type]).toBe('string');
			expect(ERROR_MESSAGES[type].length).toBeGreaterThan(0);
		}
	});

	it('has no extra keys beyond defined ErrorTypes', () => {
		const keys = Object.keys(ERROR_MESSAGES);
		expect(keys).toHaveLength(allTypes.length);
		for (const key of keys) {
			expect(allTypes).toContain(key);
		}
	});

	it('mic_denied message mentions adresbalk', () => {
		expect(ERROR_MESSAGES.mic_denied).toContain('adresbalk');
	});

	it('ollama_unavailable message mentions Ollama', () => {
		expect(ERROR_MESSAGES.ollama_unavailable).toContain('Ollama');
	});
});

describe('rateLimitMessage', () => {
	it('includes countdown seconds', () => {
		expect(rateLimitMessage(5)).toBe('Overbelast. Wacht 5s...');
		expect(rateLimitMessage(30)).toBe('Overbelast. Wacht 30s...');
		expect(rateLimitMessage(1)).toBe('Overbelast. Wacht 1s...');
	});
});

describe('RATE_LIMIT_EXHAUSTED', () => {
	it('is a non-empty string', () => {
		expect(typeof RATE_LIMIT_EXHAUSTED).toBe('string');
		expect(RATE_LIMIT_EXHAUSTED.length).toBeGreaterThan(0);
	});

	it('mentions handmatig', () => {
		expect(RATE_LIMIT_EXHAUSTED).toContain('handmatig');
	});
});
