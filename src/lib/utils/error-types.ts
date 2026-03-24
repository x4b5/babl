export type ErrorType = 'rate_limit' | 'timeout' | 'upstream_disconnect' | 'network_error';

export const ERROR_MESSAGES: Record<ErrorType, string> = {
	rate_limit: 'Overbelast. Even geduld.',
	timeout: 'Duurt te lang — probeer een korter fragment.',
	upstream_disconnect: 'Backend niet bereikbaar.',
	network_error: 'Geen internet.'
};

/** Rate limit message with countdown — per D-01, D-02, D-09 */
export function rateLimitMessage(seconds: number): string {
	return `Overbelast. Wacht ${seconds}s...`;
}

/** Final rate limit message after max retries exhausted */
export const RATE_LIMIT_EXHAUSTED = 'Nog steeds overbelast. Probeer later handmatig.';
