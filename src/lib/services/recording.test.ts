import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	processRecording,
	handleFileUpload,
	requestMicPermission,
	acquireMicrophone
} from './recording';
import type { TranscriptionRefs, TranscriptionCallbacks } from './recording';
import { sendAudio } from './transcription';
import { saveRecording } from '$lib/utils/recording-db';
import { getSupportedMimeType } from '$lib/utils/audio';
import {
	getTranscribeState,
	setRaw,
	setError,
	setErrorType,
	setStatus,
	setCountdown,
	setPartialText,
	setElapsed,
	setLiveSegments,
	setSavedRecordingId,
	setSavedRecordingMimeType
} from '$lib/stores/transcribe.svelte';

vi.mock('./transcription', () => ({
	sendAudio: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/utils/recording-db', () => ({
	saveRecording: vi.fn().mockResolvedValue('rec-1')
}));

vi.mock('$lib/utils/audio', () => ({
	getSupportedMimeType: vi.fn(() => 'audio/webm')
}));

const s = getTranscribeState();

function makeRefsAndCallbacks(): {
	refs: TranscriptionRefs;
	callbacks: TranscriptionCallbacks;
	clearSaved: ReturnType<typeof vi.fn<() => Promise<void>>>;
} {
	const refs: TranscriptionRefs = {
		transcribeController: undefined,
		apiPollController: undefined
	};
	const clearSaved = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
	const callbacks: TranscriptionCallbacks = {
		setTranscribeController: vi.fn(),
		setApiPollController: vi.fn(),
		onClearSavedRecording: clearSaved,
		onHandleErrorEvent: vi.fn()
	};
	return { refs, callbacks, clearSaved };
}

function resetStore(): void {
	setRaw('');
	setError('');
	setErrorType('');
	setStatus('idle');
	setCountdown(0);
	setPartialText('');
	setElapsed(0);
	setLiveSegments([]);
	setSavedRecordingId(null);
	setSavedRecordingMimeType('');
}

/** Hang een nep-getUserMedia in de testomgeving. */
function stubGetUserMedia(impl: () => Promise<MediaStream>): ReturnType<typeof vi.fn> {
	const getUserMedia = vi.fn(impl);
	Object.defineProperty(navigator, 'mediaDevices', {
		value: { getUserMedia },
		configurable: true
	});
	return getUserMedia;
}

function fakeStream(): { stream: MediaStream; stopTrack: ReturnType<typeof vi.fn> } {
	const stopTrack = vi.fn();
	const stream = {
		getTracks: () => [{ stop: stopTrack }]
	} as unknown as MediaStream;
	return { stream, stopTrack };
}

beforeEach(() => {
	resetStore();
	vi.mocked(sendAudio).mockClear();
	vi.mocked(saveRecording).mockClear().mockResolvedValue('rec-1');
	vi.mocked(getSupportedMimeType).mockReturnValue('audio/webm');
});

afterEach(() => {
	vi.useRealTimers();
});

describe('processRecording', () => {
	function makeArgs(overrides: Partial<Parameters<typeof processRecording>[0]> = {}) {
		const { refs, callbacks, clearSaved } = makeRefsAndCallbacks();
		return {
			args: {
				chunks: [new Blob(['audio'], { type: 'audio/webm' })],
				mimeType: 'audio/webm',
				useRealtimeStream: false,
				transcriptionRefs: refs,
				transcriptionCallbacks: callbacks,
				onClearSavedRecording: clearSaved,
				...overrides
			},
			clearSaved
		};
	}

	it('weigert een opname zonder audio-chunks', async () => {
		const { args } = makeArgs({ chunks: [] });
		setElapsed(10);

		await processRecording(args);

		expect(s.error).toBe('Geen audio opgenomen. Probeer langer op te nemen.');
		expect(s.status).toBe('idle');
		expect(vi.mocked(sendAudio)).not.toHaveBeenCalled();
	});

	it('weigert een te korte opname', async () => {
		const { args } = makeArgs();
		setElapsed(1);

		await processRecording(args);

		expect(s.error).toContain('Opname te kort (1s)');
		expect(s.status).toBe('idle');
		expect(vi.mocked(sendAudio)).not.toHaveBeenCalled();
	});

	it('slaat de opname op en stuurt de audio door', async () => {
		const { args } = makeArgs();
		setElapsed(5);

		await processRecording(args);

		expect(s.recordingDuration).toBe(5);
		expect(vi.mocked(saveRecording)).toHaveBeenCalledTimes(1);
		expect(s.savedRecordingId).toBe('rec-1');
		expect(s.savedRecordingMimeType).toBe('audio/webm');
		expect(vi.mocked(sendAudio)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(sendAudio).mock.calls[0][1]).toBe('recording.webm');
		expect(s.partialText).toBe('');
	});

	it('kiest de bestandsextensie op basis van het mime-type', async () => {
		setElapsed(5);

		const ogg = makeArgs({ mimeType: 'audio/ogg' });
		await processRecording(ogg.args);
		expect(vi.mocked(sendAudio).mock.calls[0][1]).toBe('recording.ogg');

		const mp4 = makeArgs({ mimeType: 'audio/mp4' });
		await processRecording(mp4.args);
		expect(vi.mocked(sendAudio).mock.calls[1][1]).toBe('recording.mp4');
	});

	it('gaat door als opslaan in de browser-database mislukt', async () => {
		const { args } = makeArgs();
		setElapsed(5);
		vi.mocked(saveRecording).mockRejectedValue(new Error('IndexedDB weg'));

		await processRecording(args);

		expect(s.savedRecordingId).toBeNull();
		expect(vi.mocked(sendAudio)).toHaveBeenCalledTimes(1);
		expect(s.error).toBe('');
	});

	it('gebruikt live-segmenten in plaats van opnieuw transcriberen bij realtime streaming', async () => {
		const { args, clearSaved } = makeArgs({ useRealtimeStream: true });
		setElapsed(5);
		setLiveSegments(['Eerste deel.', 'Tweede deel.']);

		await processRecording(args);

		expect(s.raw).toBe('Eerste deel. Tweede deel.');
		expect(vi.mocked(sendAudio)).not.toHaveBeenCalled();
		expect(clearSaved).toHaveBeenCalled();
		expect(s.status).toBe('idle');
	});

	it('valt terug op gewone transcriptie als realtime streaming geen segmenten opleverde', async () => {
		const { args } = makeArgs({ useRealtimeStream: true });
		setElapsed(5);
		setLiveSegments([]);

		await processRecording(args);

		expect(vi.mocked(sendAudio)).toHaveBeenCalledTimes(1);
	});
});

describe('handleFileUpload', () => {
	function makeUploadEvent(file: File | null): { event: Event; input: HTMLInputElement } {
		const input = document.createElement('input');
		input.type = 'file';
		Object.defineProperty(input, 'files', {
			value: file ? [file] : [],
			configurable: true
		});
		return { event: { target: input } as unknown as Event, input };
	}

	it('doet niets zonder gekozen bestand', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		const { event } = makeUploadEvent(null);

		await handleFileUpload(event, refs, callbacks);

		expect(vi.mocked(sendAudio)).not.toHaveBeenCalled();
	});

	it('stuurt het gekozen bestand door en leegt het invoerveld', async () => {
		const { refs, callbacks } = makeRefsAndCallbacks();
		const file = new File(['audio'], 'vergadering.mp3', { type: 'audio/mpeg' });
		const { event, input } = makeUploadEvent(file);

		await handleFileUpload(event, refs, callbacks);

		expect(vi.mocked(sendAudio)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(sendAudio).mock.calls[0][1]).toBe('vergadering.mp3');
		expect(input.value).toBe('');
	});
});

describe('requestMicPermission', () => {
	it('wist de foutmelding en stopt de tijdelijke stream bij toestemming', async () => {
		const { stream, stopTrack } = fakeStream();
		stubGetUserMedia(() => Promise.resolve(stream));
		setError('oude fout');
		setErrorType('mic_denied');

		await requestMicPermission();

		expect(s.error).toBe('');
		expect(s.errorType).toBe('');
		expect(stopTrack).toHaveBeenCalled();
	});

	it('legt uit hoe je de blokkade opheft als toestemming geweigerd blijft', async () => {
		stubGetUserMedia(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));

		await requestMicPermission();

		expect(s.error).toContain('browserinstellingen');
	});
});

describe('acquireMicrophone', () => {
	it('meldt het als de browser geen audio-opname ondersteunt', async () => {
		vi.mocked(getSupportedMimeType).mockReturnValue('');

		const result = await acquireMicrophone();

		expect(result).toBeNull();
		expect(s.error).toBe('Je browser ondersteunt geen audio-opname.');
	});

	it('telt af van 3 naar 1 en geeft dan de microfoon terug', async () => {
		vi.useFakeTimers();
		const { stream } = fakeStream();
		stubGetUserMedia(() => Promise.resolve(stream));

		const promise = acquireMicrophone();
		await vi.advanceTimersByTimeAsync(0);
		expect(s.status).toBe('preparing');
		expect(s.countdown).toBe(3);

		await vi.advanceTimersByTimeAsync(1000);
		expect(s.countdown).toBe(2);

		await vi.advanceTimersByTimeAsync(2000);
		const result = await promise;

		expect(s.countdown).toBe(0);
		expect(result).toEqual({ stream, mimeType: 'audio/webm' });
	});

	it('stopt als de gebruiker tijdens de countdown annuleert', async () => {
		vi.useFakeTimers();
		const getUserMedia = stubGetUserMedia(() => Promise.resolve(fakeStream().stream));

		const promise = acquireMicrophone();
		await vi.advanceTimersByTimeAsync(0);
		setStatus('idle'); // gebruiker annuleert

		await vi.advanceTimersByTimeAsync(1000);
		const result = await promise;

		expect(result).toBeNull();
		expect(getUserMedia).not.toHaveBeenCalled();
	});

	it('zet mic_denied als microfoontoegang is geweigerd', async () => {
		vi.useFakeTimers();
		stubGetUserMedia(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));

		const promise = acquireMicrophone();
		await vi.advanceTimersByTimeAsync(3000);
		const result = await promise;

		expect(result).toBeNull();
		expect(s.errorType).toBe('mic_denied');
		expect(s.error).toContain('Microfoontoegang is geweigerd');
		expect(s.status).toBe('idle');
	});

	it('meldt het als er geen microfoon is gevonden', async () => {
		vi.useFakeTimers();
		stubGetUserMedia(() => Promise.reject(new DOMException('none', 'NotFoundError')));

		const promise = acquireMicrophone();
		await vi.advanceTimersByTimeAsync(3000);
		const result = await promise;

		expect(result).toBeNull();
		expect(s.error).toBe('Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.');
	});

	it('toont een algemene melding bij een onbekende microfoonfout', async () => {
		vi.useFakeTimers();
		stubGetUserMedia(() => Promise.reject(new Error('iets anders')));

		const promise = acquireMicrophone();
		await vi.advanceTimersByTimeAsync(3000);
		const result = await promise;

		expect(result).toBeNull();
		expect(s.error).toBe('Microfoon niet beschikbaar. Controleer je browserpermissies.');
	});
});
