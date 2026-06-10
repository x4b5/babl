import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startPolishing, handleErrorEvent } from './polishing';
import type { PolishingRefs, PolishingCallbacks } from './polishing';
import { rateLimitMessage } from '$lib/utils/error-types';
import {
	getTranscribeState,
	setRaw,
	setPolished,
	setError,
	setErrorType,
	setStatus,
	setRetryCount,
	setCountdownSeconds,
	setMode,
	setSubject,
	setSpeakerLabels,
	setPolishAiMetadata,
	appendPolished
} from '$lib/stores/transcribe.svelte';

const s = getTranscribeState();

/** Helper: fake SSE Response whose body yields the given lines. */
function fakeSSEResponse(chunks: string[], overrides: Partial<Response> = {}): Response {
	let index = 0;
	const reader = {
		read: async () => {
			if (index >= chunks.length)
				return { done: true, value: undefined } as ReadableStreamReadResult<Uint8Array>;
			const value = new TextEncoder().encode(chunks[index++]);
			return { done: false, value } as ReadableStreamReadResult<Uint8Array>;
		},
		releaseLock: vi.fn(),
		cancel: vi.fn(),
		closed: Promise.resolve(undefined)
	};
	return {
		ok: true,
		status: 200,
		redirected: false,
		url: 'http://localhost:8000/polish',
		headers: { get: () => null },
		body: { getReader: () => reader },
		...overrides
	} as unknown as Response;
}

/** Helper: fake error Response (no body needed). */
function fakeErrorResponse(status: number, retryAfter?: string): Response {
	return {
		ok: false,
		status,
		redirected: false,
		url: 'http://localhost:8000/polish',
		headers: { get: (name: string) => (name === 'Retry-After' ? (retryAfter ?? null) : null) }
	} as unknown as Response;
}

function makeRefsAndCallbacks(): { refs: PolishingRefs; callbacks: PolishingCallbacks } {
	const refs: PolishingRefs = {
		polishingController: undefined,
		countdownInterval: undefined
	};
	const callbacks: PolishingCallbacks = {
		setPolishingController: (v) => {
			refs.polishingController = v;
		},
		setCountdownInterval: (v) => {
			refs.countdownInterval = v;
		}
	};
	return { refs, callbacks };
}

/** Flush pending microtasks (fetch + SSE chain). */
async function flush(): Promise<void> {
	await new Promise((r) => setTimeout(r, 0));
	await new Promise((r) => setTimeout(r, 0));
}

function resetStore(): void {
	setRaw('');
	setPolished('');
	setError('');
	setErrorType('');
	setStatus('idle');
	setRetryCount(0);
	setCountdownSeconds(0);
	setMode('local');
	setSubject('');
	setSpeakerLabels({});
	setPolishAiMetadata(null);
}

describe('startPolishing', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		resetStore();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('doet niets zonder ruwe tekst', () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		startPolishing(refs, callbacks);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(s.status).toBe('idle');
	});

	it('blokkeert dubbele requests terwijl polijsten al loopt', () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		setStatus('polishing');
		startPolishing(refs, callbacks);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('streamt tokens naar polished en voegt disclaimer toe', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		fetchMock.mockResolvedValue(
			fakeSSEResponse([
				'data: {"type":"token","text":"Hallo "}\n',
				'data: {"type":"token","text":"wereld."}\ndata: {"type":"done"}\n'
			])
		);

		startPolishing(refs, callbacks);
		await flush();

		expect(s.polished).toContain('Hallo wereld.');
		expect(s.polished).toContain('Dit verslag is automatisch gegenereerd');
		expect(s.status).toBe('idle');
		expect(s.error).toBe('');
	});

	it('bewaart ai_metadata uit het done-event', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo');
		fetchMock.mockResolvedValue(
			fakeSSEResponse([
				'data: {"type":"token","text":"Hoi"}\n',
				'data: {"type":"done","ai_metadata":{"generated_by_ai":true,"provider":"ollama","model":"gemma3","prompt_version":"v1"}}\n'
			])
		);

		startPolishing(refs, callbacks);
		await flush();

		expect(s.polishAiMetadata).toEqual({
			generated_by_ai: true,
			provider: 'ollama',
			model: 'gemma3',
			prompt_version: 'v1'
		});
	});

	it('stript een eerdere disclaimer uit de tekst voor verzending', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld\n\n---\nDit verslag is automatisch gegenereerd op gisteren.');
		fetchMock.mockResolvedValue(fakeSSEResponse(['data: {"type":"token","text":"Hoi"}\n']));

		startPolishing(refs, callbacks);
		await flush();

		const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
		expect(sentBody.text).toBe('hallo wereld');
	});

	it('valt terug op de originele tekst bij een lege succesvolle stream', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		fetchMock.mockResolvedValue(fakeSSEResponse(['data: {"type":"done"}\n']));

		startPolishing(refs, callbacks);
		await flush();

		expect(s.polished).toContain('hallo wereld');
		expect(s.polished).toContain('Dit verslag is automatisch gegenereerd');
	});

	it('valt NIET terug op de originele tekst bij een stream-fout', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		fetchMock.mockResolvedValue(
			fakeSSEResponse(['data: {"type":"error","error_type":"server_error","message":"kapot"}\n'])
		);

		startPolishing(refs, callbacks);
		await flush();

		expect(s.polished).toBe('');
		expect(s.error).toBe('kapot');
		expect(s.errorType).toBe('server_error');
		expect(s.status).toBe('idle');
	});

	it('wist polished en zet een foutmelding bij HTTP 500', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		fetchMock.mockResolvedValue(fakeErrorResponse(500));

		startPolishing(refs, callbacks);
		await flush();

		expect(s.polished).toBe('');
		expect(s.error).not.toBe('');
		expect(s.status).toBe('idle');
	});

	it('start countdown bij 429 en retry begint met schone polished', async () => {
		vi.useFakeTimers();
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		fetchMock
			.mockResolvedValueOnce(fakeErrorResponse(429, '2'))
			.mockResolvedValue(fakeSSEResponse(['data: {"type":"token","text":"Vers resultaat"}\n']));

		startPolishing(refs, callbacks);
		await vi.advanceTimersByTimeAsync(0);

		expect(s.errorType).toBe('rate_limit');
		expect(s.error).toBe(rateLimitMessage(2));
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// Simuleer achtergebleven output van de mislukte poging
		appendPolished('OUDE RESTANT');

		await vi.advanceTimersByTimeAsync(1000);
		expect(s.error).toBe(rateLimitMessage(1));

		await vi.advanceTimersByTimeAsync(1000);
		await vi.advanceTimersByTimeAsync(0);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(s.retryCount).toBe(1);
		expect(s.polished).not.toContain('OUDE RESTANT');
		expect(s.polished).toContain('Vers resultaat');
	});

	it('gebruikt de lokale backend in local mode en de API route in api mode', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo');
		fetchMock.mockResolvedValue(fakeSSEResponse(['data: {"type":"token","text":"Hoi"}\n']));

		setMode('local');
		startPolishing(refs, callbacks);
		await flush();
		expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/polish');

		setStatus('idle');
		setMode('api');
		startPolishing(refs, callbacks);
		await flush();
		expect(fetchMock.mock.calls[1][0]).toBe('/api/polish');
	});

	it('zet geen foutmelding bij een afgebroken verzoek', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('hallo wereld');
		const abortError = new Error('aborted');
		abortError.name = 'AbortError';
		fetchMock.mockRejectedValue(abortError);

		startPolishing(refs, callbacks);
		await flush();

		expect(s.error).toBe('');
		expect(refs.polishingController).toBeUndefined();
		expect(s.status).toBe('idle');
	});
});

describe('handleErrorEvent', () => {
	beforeEach(() => {
		setError('');
		setErrorType('');
		setCountdownSeconds(0);
	});

	it('zet direct een foutmelding voor niet-retryable fouten', () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		handleErrorEvent({ error_type: 'timeout', message: 'te traag' }, refs, callbacks);
		expect(s.errorType).toBe('timeout');
		expect(s.error).toBe('te traag');
	});

	it('valt terug op de standaardmelding zonder message', () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		handleErrorEvent({ error_type: 'server_error' }, refs, callbacks);
		expect(s.error).toBe('Verwerking niet gelukt — probeer opnieuw.');
	});

	it('start een countdown voor rate_limit met retry_after', () => {
		vi.useFakeTimers();
		const { refs, callbacks } = makeRefsAndCallbacks();
		handleErrorEvent({ error_type: 'rate_limit', retry_after: 5 }, refs, callbacks);
		expect(s.errorType).toBe('rate_limit');
		expect(s.error).toBe(rateLimitMessage(5));
		expect(refs.countdownInterval).toBeDefined();
		if (refs.countdownInterval) clearInterval(refs.countdownInterval);
		vi.useRealTimers();
	});
});
