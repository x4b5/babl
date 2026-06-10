import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendAudio } from './transcription';
import type { TranscriptionRefs, TranscriptionCallbacks } from './transcription';
import { sendAudioApiSegmented } from './file-transcription';
import {
	getTranscribeState,
	setRaw,
	setError,
	setErrorType,
	setStatus,
	setApiStatus,
	setLanguage,
	setConfidenceWords,
	setLowConfidenceCount,
	setTranscribeMode,
	setLocalAvailable
} from '$lib/stores/transcribe.svelte';

vi.mock('./file-transcription', () => ({
	sendAudioApiSegmented: vi.fn()
}));

const s = getTranscribeState();

const SMALL_BLOB = new Blob(['audio-data'], { type: 'audio/webm' });
// Groter dan de Vercel-limiet van 4MB
const LARGE_BLOB = new Blob([new Uint8Array(5 * 1024 * 1024)], { type: 'audio/webm' });

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
		url: 'http://localhost:8000/transcribe',
		body: { getReader: () => reader },
		...overrides
	} as unknown as Response;
}

/** Helper: fake JSON Response (for API submit/poll). */
function fakeJsonResponse(json: unknown, overrides: Partial<Response> = {}): Response {
	return {
		ok: true,
		status: 200,
		redirected: false,
		url: '/api/transcribe-api',
		json: async () => json,
		...overrides
	} as unknown as Response;
}

function makeRefsAndCallbacks(): {
	refs: TranscriptionRefs;
	callbacks: TranscriptionCallbacks;
	clearSaved: ReturnType<typeof vi.fn>;
	errorEvents: { error_type?: string; retry_after?: number; message?: string }[];
} {
	const refs: TranscriptionRefs = {
		transcribeController: undefined,
		apiPollController: undefined
	};
	const clearSaved = vi.fn().mockResolvedValue(undefined);
	const errorEvents: { error_type?: string; retry_after?: number; message?: string }[] = [];
	const callbacks: TranscriptionCallbacks = {
		setTranscribeController: (v) => {
			refs.transcribeController = v;
		},
		setApiPollController: (v) => {
			refs.apiPollController = v;
		},
		onClearSavedRecording: clearSaved,
		onHandleErrorEvent: (event) => {
			errorEvents.push(event);
		}
	};
	return { refs, callbacks, clearSaved, errorEvents };
}

function resetStore(): void {
	setRaw('');
	setError('');
	setErrorType('');
	setStatus('idle');
	setApiStatus('');
	setLanguage('');
	setConfidenceWords([]);
	setLowConfidenceCount(0);
	setTranscribeMode('local');
	setLocalAvailable(false);
}

describe('sendAudio — algemeen', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		resetStore();
		vi.mocked(sendAudioApiSegmented).mockClear();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('weigert een leeg audiobestand zonder verzoek te sturen', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		await sendAudio(new Blob([]), 'leeg.webm', refs, callbacks);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(s.error).toBe('Audio-bestand is leeg. Probeer opnieuw.');
		expect(s.status).toBe('idle');
	});

	it('wist eerdere resultaten bij een nieuwe verzending', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setRaw('oude tekst');
		setError('oude fout');
		fetchMock.mockResolvedValue(fakeSSEResponse(['data: {"type":"segment","text":"nieuw"}\n']));

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.raw).not.toContain('oude tekst');
		expect(s.raw).toContain('nieuw');
	});
});

describe('sendAudio — lokale modus', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		resetStore();
		setTranscribeMode('local');
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('voegt segmenten samen en sluit af met disclaimer', async () => {
		const { refs, callbacks, clearSaved } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeSSEResponse([
				'data: {"type":"segment","text":"Eerste zin."}\n',
				'data: {"type":"segment","text":"Tweede zin."}\ndata: {"type":"done"}\n'
			])
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/transcribe');
		expect(s.raw).toContain('Eerste zin.\nTweede zin.');
		expect(s.raw).toContain('Dit transcript is automatisch gegenereerd');
		expect(s.status).toBe('idle');
		expect(clearSaved).toHaveBeenCalled();
	});

	it('zet sprekerlabels voor segmenten met een spreker', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeSSEResponse(['data: {"type":"segment","text":"Hallo daar.","speaker":"A"}\n'])
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.raw).toContain('Spreker A: Hallo daar.');
	});

	it('zet de gedetecteerde taal uit het info-event', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeSSEResponse([
				'data: {"type":"info","language":"nl"}\ndata: {"type":"segment","text":"Hoi"}\n'
			])
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.language).toBe('nl');
	});

	it('geeft een error-event met fouttype door en stopt de stream', async () => {
		const { refs, callbacks, errorEvents } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeSSEResponse([
				'data: {"type":"error","error_type":"ollama_unavailable","message":"Ollama down"}\ndata: {"type":"segment","text":"na de fout"}\n'
			])
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(errorEvents).toHaveLength(1);
		expect(errorEvents[0].error_type).toBe('ollama_unavailable');
		expect(s.raw).not.toContain('na de fout');
		expect(s.status).toBe('idle');
	});

	it('toont de juiste melding bij een HTTP-fout met fouttype', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeJsonResponse({ error_type: 'ollama_model_missing' }, { ok: false, status: 503 })
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.errorType).toBe('ollama_model_missing');
		expect(s.error).toContain('niet geïnstalleerd');
		expect(s.status).toBe('idle');
	});

	it('toont een melding bij een HTTP-fout zonder fouttype (missende-await bug)', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeJsonResponse({ error: 'interne serverfout' }, { ok: false, status: 500 })
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.error).not.toBe('');
		expect(s.status).toBe('idle');
	});

	it('zet geen foutmelding bij een afgebroken verzoek', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		const abortError = new Error('aborted');
		abortError.name = 'AbortError';
		fetchMock.mockRejectedValue(abortError);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.error).toBe('');
		expect(refs.transcribeController).toBeUndefined();
	});

	it('toont een nette melding bij een netwerkfout', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.error).not.toBe('');
		expect(s.status).toBe('idle');
	});
});

describe('sendAudio — API modus', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		resetStore();
		setTranscribeMode('api');
		vi.mocked(sendAudioApiSegmented).mockClear();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('uploadt, pollt en verwerkt het resultaat', async () => {
		const { refs, callbacks, clearSaved } = makeRefsAndCallbacks();
		fetchMock
			.mockResolvedValueOnce(fakeJsonResponse({ transcriptId: 'abc123' }))
			.mockResolvedValueOnce(fakeJsonResponse({ status: 'processing' }))
			.mockResolvedValueOnce(
				fakeJsonResponse({
					status: 'completed',
					text: 'Klaar resultaat',
					language: 'nl',
					words: [{ text: 'Klaar', confidence: 0.4 }],
					low_confidence_count: 1
				})
			);

		const promise = sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);
		await vi.advanceTimersByTimeAsync(0);
		expect(s.apiStatus).toBe('Wachtrij...');

		await vi.advanceTimersByTimeAsync(5000); // poll 1: processing
		expect(s.apiStatus).toBe('Verwerken...');

		await vi.advanceTimersByTimeAsync(5000); // poll 2: completed
		await promise;

		expect(fetchMock.mock.calls[0][0]).toBe('/api/transcribe-api');
		expect(fetchMock.mock.calls[1][0]).toBe('/api/transcribe-api/abc123');
		expect(s.raw).toContain('Klaar resultaat');
		expect(s.raw).toContain('Dit transcript is automatisch gegenereerd');
		expect(s.confidenceWords).toEqual([{ text: 'Klaar', confidence: 0.4 }]);
		expect(s.lowConfidenceCount).toBe(1);
		expect(s.apiStatus).toBe('');
		expect(s.status).toBe('idle');
		expect(clearSaved).toHaveBeenCalled();
	});

	it('toont de juiste melding als de submit faalt met een fouttype', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(
			fakeJsonResponse({ error_type: 'rate_limit', error: 'too many' }, { ok: false, status: 429 })
		);

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.errorType).toBe('rate_limit');
		expect(s.error).toBe('Overbelast. Even geduld. (too many)');
		expect(s.status).toBe('idle');
	});

	it('toont een sessie-melding bij een redirect naar login', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock.mockResolvedValue(fakeJsonResponse({}, { redirected: true, url: '/login' }));

		await sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);

		expect(s.error).toBe('Sessie verlopen — log opnieuw in.');
		expect(s.status).toBe('idle');
	});

	it('zet een foutmelding als de transcriptie zelf faalt', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		fetchMock
			.mockResolvedValueOnce(fakeJsonResponse({ transcriptId: 'abc123' }))
			.mockResolvedValueOnce(fakeJsonResponse({ status: 'error', error: 'audio onleesbaar' }));

		const promise = sendAudio(SMALL_BLOB, 'opname.webm', refs, callbacks);
		await vi.advanceTimersByTimeAsync(5000);
		await promise;

		expect(s.error).not.toBe('');
		expect(s.status).toBe('idle');
	});

	it('gebruikt de lokale proxy voor grote bestanden als de backend draait', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setLocalAvailable(true);
		fetchMock.mockResolvedValue(
			fakeSSEResponse(['data: {"type":"segment","text":"Groot bestand"}\n'])
		);

		await sendAudio(LARGE_BLOB, 'groot.webm', refs, callbacks);

		expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/transcribe-api');
		expect(s.raw).toContain('Groot bestand');
	});

	it('valt terug op gesegmenteerd uploaden voor grote bestanden zonder lokale backend', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		setLocalAvailable(false);

		await sendAudio(LARGE_BLOB, 'groot.webm', refs, callbacks);

		expect(vi.mocked(sendAudioApiSegmented)).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
