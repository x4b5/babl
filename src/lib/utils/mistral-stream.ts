/**
 * Mistral API streaming helpers — error classification, retry logic, and streaming.
 */

import type { ErrorType } from '$lib/utils/error-types';

export function classifyError(e: unknown): { errorType: ErrorType; retryAfter?: number } {
	if (e && typeof e === 'object') {
		const statusCode =
			(e as Record<string, unknown>).statusCode ??
			(e as Record<string, unknown>).status ??
			((e as Record<string, unknown>).response as Record<string, unknown> | undefined)?.status;

		if (statusCode === 429) {
			const headers = (
				(e as Record<string, unknown>).response as Record<string, unknown> | undefined
			)?.headers;
			const retryAfter = parseRetryAfter(headers);
			return { errorType: 'rate_limit', retryAfter };
		}
		if (statusCode === 502 || statusCode === 503) {
			return { errorType: 'upstream_disconnect' };
		}
	}

	const msg = e instanceof Error ? e.message : String(e);

	if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
		return { errorType: 'rate_limit', retryAfter: 3 };
	}
	if (msg.includes('502') || msg.includes('503') || msg.includes('ECONNREFUSED')) {
		return { errorType: 'upstream_disconnect' };
	}
	if (e instanceof DOMException && e.name === 'AbortError') {
		return { errorType: 'timeout' };
	}
	if (msg.toLowerCase().includes('timeout')) {
		return { errorType: 'timeout' };
	}
	if (
		msg.includes('Failed to fetch') ||
		msg.includes('NetworkError') ||
		msg.includes('ENOTFOUND')
	) {
		return { errorType: 'server_error' };
	}

	return { errorType: 'server_error' };
}

function parseRetryAfter(headers: unknown): number {
	if (!headers || typeof headers !== 'object') return 3;
	const h = headers as Record<string, string>;
	const val = h['retry-after'] || h['Retry-After'] || '';
	if (!val) return 3;

	const asInt = parseInt(val, 10);
	if (!isNaN(asInt)) return Math.max(1, asInt);

	try {
		const retryDate = new Date(val);
		const delta = Math.ceil((retryDate.getTime() - Date.now()) / 1000);
		return Math.max(1, delta);
	} catch {
		return 3;
	}
}

function buildMistralPrompt(
	chunk: string,
	detectedLang: string,
	fullContext: string | null
): string {
	if (fullContext && fullContext !== chunk) {
		return (
			`[Taal: ${detectedLang}]\n\n` +
			`VOLLEDIGE CONTEXT (alleen ter referentie):\n${fullContext}\n\n` +
			`CORRIGEER DIT FRAGMENT:\n${chunk}`
		);
	}
	return `[Taal: ${detectedLang}]\n\n${chunk}`;
}

export async function* polishChunkMistralStream(
	apiKey: string,
	chunk: string,
	detectedLang: string,
	mistralModel: string,
	fullContext: string | null,
	temperature: number,
	systemPrompt: string
): AsyncGenerator<string> {
	const { Mistral } = await import('@mistralai/mistralai');
	const client = new Mistral({ apiKey });
	const userPrompt = buildMistralPrompt(chunk, detectedLang, fullContext);
	const wordCount = chunk.split(/\s+/).length;
	const maxTokens = Math.max(512, wordCount * 2);

	const maxAttempts = 5;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const stream = await client.chat.stream({
				model: mistralModel,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature,
				maxTokens
			});

			for await (const event of stream) {
				const token = event.data.choices[0]?.delta?.content;
				if (token && typeof token === 'string') {
					yield token;
				}
			}
			return;
		} catch (e) {
			const classified = classifyError(e);
			const isRetryable =
				classified.errorType === 'rate_limit' || classified.errorType === 'upstream_disconnect';

			if (isRetryable && attempt < maxAttempts - 1) {
				const backoff = Math.min(30, Math.pow(2, attempt)) + Math.random() * 2;
				const wait = classified.retryAfter ? Math.max(backoff, classified.retryAfter) : backoff;
				await new Promise((r) => setTimeout(r, wait * 1000));
			} else {
				throw e;
			}
		}
	}
}
