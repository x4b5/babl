/**
 * Transcription service — sends audio to local Whisper or AssemblyAI API.
 * Handles SSE stream parsing, stall detection, and error classification.
 */

import { readSSEStream } from '$lib/utils/sse-reader';
import { encodeWav } from '$lib/utils/audio';
import { getUserMessage, isAbortError, handleCaughtError } from '$lib/utils/error-classifier';
import type { ErrorType } from '$lib/utils/error-types';
import {
	LOCAL_BACKEND_URL,
	SSE_STALL_TIMEOUT_MS,
	setRaw,
	setLanguage,
	setError,
	setErrorType,
	setStatus,
	setApiStatus,
	setConfidenceWords,
	setLowConfidenceCount,
	getTranscribeState,
	resetForTranscription
} from '$lib/stores/transcribe.svelte';

const MAX_VERCEL_BODY_BYTES = 4 * 1024 * 1024;

export interface TranscriptionRefs {
	transcribeController: AbortController | undefined;
	apiPollController: AbortController | undefined;
}

export interface TranscriptionCallbacks {
	setTranscribeController: (v: AbortController | undefined) => void;
	setApiPollController: (v: AbortController | undefined) => void;
	onClearSavedRecording: () => Promise<void>;
	onHandleErrorEvent: (event: {
		error_type?: string;
		retry_after?: number;
		message?: string;
	}) => void;
}

/** Send audio to the appropriate backend (local or API). */
export async function sendAudio(
	blob: Blob,
	filename: string,
	refs: TranscriptionRefs,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	resetForTranscription();
	if (blob.size === 0) {
		setError('Audio-bestand is leeg. Probeer opnieuw.');
		setStatus('idle');
		return;
	}
	setStatus('processing');
	const formData = new FormData();
	formData.append('file', blob, filename);
	formData.append('lang', s.lang);
	if (s.transcribeMode === 'api') {
		await sendAudioApi(formData, refs, callbacks);
	} else {
		await sendAudioLocal(formData, refs, callbacks);
	}
}

/** Send audio via local Whisper backend (SSE stream). */
async function sendAudioLocal(
	formData: FormData,
	refs: TranscriptionRefs,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	const controller = new AbortController();
	callbacks.setTranscribeController(controller);

	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		if (!resp.ok) {
			handleHttpError(resp);
			return;
		}
		await readSSEStream(resp, {
			controller,
			stallTimeoutMs: SSE_STALL_TIMEOUT_MS,
			onEvent: (event) => handleTranscriptionEvent(event, s, callbacks)
		});
		await callbacks.onClearSavedRecording();
		setStatus('idle');
	} catch (e) {
		if (isAbortError(e)) return;
		handleCaughtError(e);
	} finally {
		callbacks.setTranscribeController(undefined);
	}
}

/** Send audio via AssemblyAI API (submit + poll or local proxy SSE). */
async function sendAudioApi(
	formData: FormData,
	refs: TranscriptionRefs,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	const file = formData.get('file') as Blob | null;
	const useLocalProxy = file && file.size > MAX_VERCEL_BODY_BYTES && s.localAvailable;

	if (useLocalProxy) {
		await sendAudioApiViaLocal(formData, refs, callbacks);
		return;
	}

	if (file && file.size > MAX_VERCEL_BODY_BYTES && !s.localAvailable) {
		await sendAudioApiSegmented(file, refs, callbacks);
		return;
	}

	const controller = new AbortController();
	callbacks.setApiPollController(controller);

	try {
		setApiStatus('Uploaden...');
		const submitResp = await fetch('/api/transcribe-api', {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});

		if (submitResp.redirected || submitResp.url.includes('/login')) {
			setError('Sessie verlopen — log opnieuw in.');
			setApiStatus('');
			setStatus('idle');
			return;
		}
		if (!submitResp.ok) {
			const handled = await tryHandleApiError(submitResp);
			if (handled) return;
			const body = await tryParseJson(submitResp);
			throw new Error(body?.error || `Server error ${submitResp.status}`);
		}

		let submitJson: { transcriptId?: string; error?: string };
		try {
			submitJson = await submitResp.json();
		} catch {
			throw new Error('Onverwacht antwoord van server (geen JSON)');
		}
		if (submitJson.error) throw new Error(submitJson.error);

		await pollTranscription(submitJson.transcriptId!, controller, callbacks);
	} catch (e) {
		if (isAbortError(e)) {
			callbacks.setApiPollController(undefined);
			return;
		}
		handleCaughtError(e);
		setApiStatus('');
	} finally {
		callbacks.setApiPollController(undefined);
	}
}

/** Poll AssemblyAI for transcription result. */
async function pollTranscription(
	transcriptId: string,
	controller: AbortController,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	setApiStatus('Wachtrij...');
	const POLL_INTERVAL = 3000;
	const MAX_POLL_TIME = 60 * 60 * 1000;
	const startTime = Date.now();
	const WARN_AT_MIN = 45;

	while (true) {
		if (Date.now() - startTime > MAX_POLL_TIME) {
			throw new Error('Transcriptie duurde te lang (>60 min).');
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL));
		const pollResp = await fetch(`/api/transcribe-api/${transcriptId}`, {
			signal: controller.signal
		});

		if (pollResp.redirected || pollResp.url.includes('/login')) {
			setError('Sessie verlopen — log opnieuw in.');
			setApiStatus('');
			setStatus('idle');
			return;
		}
		if (!pollResp.ok) {
			const handled = await tryHandleApiError(pollResp);
			if (handled) return;
			const body = await tryParseJson(pollResp);
			throw new Error(body?.error || `Poll error ${pollResp.status}`);
		}

		const result = await pollResp.json();
		const elapsedMs = Date.now() - startTime;
		const elapsedMin = Math.floor(elapsedMs / 60000);

		if (result.status === 'queued') {
			setApiStatus(
				elapsedMin >= WARN_AT_MIN
					? `Wachtrij... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
					: 'Wachtrij...'
			);
		} else if (result.status === 'processing') {
			setApiStatus(
				elapsedMin >= WARN_AT_MIN
					? `Verwerken... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
					: 'Verwerken...'
			);
		} else if (result.status === 'completed') {
			setRaw(result.text || '');
			setLanguage(result.language || '');
			if (result.words && Array.isArray(result.words)) {
				setConfidenceWords(result.words);
				setLowConfidenceCount(result.low_confidence_count || 0);
			} else {
				setConfidenceWords([]);
				setLowConfidenceCount(0);
			}
			setApiStatus('');
			await callbacks.onClearSavedRecording();
			setStatus('idle');
			return;
		} else if (result.status === 'error') {
			throw new Error(result.error || 'Transcriptie mislukt');
		}
	}
}

/** Send large audio via local backend proxy to AssemblyAI (SSE stream). */
async function sendAudioApiViaLocal(
	formData: FormData,
	refs: TranscriptionRefs,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	const controller = new AbortController();
	callbacks.setTranscribeController(controller);

	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-api`, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		if (!resp.ok) {
			handleHttpError(resp);
			return;
		}
		await readSSEStream(resp, {
			controller,
			stallTimeoutMs: SSE_STALL_TIMEOUT_MS,
			onEvent: (event) => handleTranscriptionEvent(event, s, callbacks)
		});
		setApiStatus('');
		await callbacks.onClearSavedRecording();
		setStatus('idle');
	} catch (e) {
		if (isAbortError(e)) {
			callbacks.setTranscribeController(undefined);
			return;
		}
		handleCaughtError(e);
		setApiStatus('');
	} finally {
		callbacks.setTranscribeController(undefined);
	}
}

// ── Segmented upload for large files ─────────────────────────

/** Max segment size: leave room for FormData overhead. */
const MAX_SEGMENT_BYTES = MAX_VERCEL_BODY_BYTES - 512 * 1024;

/** Max source file size for WAV conversion (non-WebM). Beyond this, memory usage is too high. */
const MAX_WAV_CONVERT_BYTES = 20 * 1024 * 1024;

/**
 * Split a WebM blob at Cluster element boundaries so each segment
 * is a valid WebM file (init header + clusters) under maxSize bytes.
 * Returns [blob] unchanged if the blob is small enough or not WebM.
 */
async function splitAudioBlob(blob: Blob, maxSize: number): Promise<Blob[]> {
	if (blob.size <= maxSize) return [blob];
	if (!blob.type.includes('webm')) return [blob];

	const data = new Uint8Array(await blob.arrayBuffer());

	// Find WebM Cluster element boundaries (EBML ID: 0x1F43B675)
	const clusterOffsets: number[] = [];
	for (let i = 0; i < data.length - 3; i++) {
		if (data[i] === 0x1f && data[i + 1] === 0x43 && data[i + 2] === 0xb6 && data[i + 3] === 0x75) {
			clusterOffsets.push(i);
		}
	}

	if (clusterOffsets.length < 2) return [blob];

	const initEnd = clusterOffsets[0]; // Everything before first Cluster is init
	const initData = data.slice(0, initEnd);
	const segments: Blob[] = [];
	let groupStart = 0; // Index into clusterOffsets

	for (let i = 0; i < clusterOffsets.length; i++) {
		const nextOffset = i + 1 < clusterOffsets.length ? clusterOffsets[i + 1] : data.length;
		const startOffset = clusterOffsets[groupStart];
		const segSize = initData.length + (nextOffset - startOffset);

		if (segSize > maxSize && i > groupStart) {
			// Cut before this cluster
			const cutOffset = clusterOffsets[i];
			segments.push(
				new Blob([initData, data.slice(clusterOffsets[groupStart], cutOffset)], {
					type: blob.type
				})
			);
			groupStart = i;
		}
	}

	// Final segment
	segments.push(
		new Blob([initData, data.slice(clusterOffsets[groupStart])], {
			type: blob.type
		})
	);

	return segments;
}

/**
 * Convert non-WebM audio to 16kHz WAV and split into chunks.
 * Each chunk is a valid WAV file with its own header.
 * Returns [blob] unchanged if conversion fails or file is too large.
 */
async function splitAsWavChunks(blob: Blob, maxSize: number): Promise<Blob[]> {
	if (blob.size > MAX_WAV_CONVERT_BYTES) return [blob];

	try {
		const TARGET_RATE = 16000;
		const arrayBuffer = await blob.arrayBuffer();
		const tempCtx = new OfflineAudioContext(1, 1, TARGET_RATE);
		const decoded = await tempCtx.decodeAudioData(arrayBuffer);

		const totalSamples = Math.ceil(decoded.duration * TARGET_RATE);
		const offline = new OfflineAudioContext(1, totalSamples, TARGET_RATE);
		const source = offline.createBufferSource();
		source.buffer = decoded;
		source.connect(offline.destination);
		source.start();
		const rendered = await offline.startRendering();

		const pcm = rendered.getChannelData(0);

		// WAV header = 44 bytes, each sample = 2 bytes (16-bit mono)
		const maxPcmBytes = maxSize - 44 - 1024;
		const samplesPerChunk = Math.floor(maxPcmBytes / 2);

		if (pcm.length <= samplesPerChunk) {
			return [new Blob([encodeWav(pcm, TARGET_RATE)], { type: 'audio/wav' })];
		}

		const chunks: Blob[] = [];
		for (let i = 0; i < pcm.length; i += samplesPerChunk) {
			const chunkSamples = pcm.subarray(i, Math.min(i + samplesPerChunk, pcm.length));
			chunks.push(new Blob([encodeWav(chunkSamples, TARGET_RATE)], { type: 'audio/wav' }));
		}

		return chunks;
	} catch {
		return [blob];
	}
}

/** Upload a single segment and poll until transcription completes. */
async function pollSegment(
	transcriptId: string,
	controller: AbortController,
	segNum: number,
	totalSegs: number
): Promise<{
	text: string;
	language: string;
	words?: { text: string; confidence: number; speaker?: string }[];
	lowConfidenceCount: number;
}> {
	const POLL_INTERVAL = 3000;
	const MAX_POLL_TIME = 30 * 60 * 1000;
	const startTime = Date.now();

	while (true) {
		if (Date.now() - startTime > MAX_POLL_TIME) {
			throw new Error(`Deel ${segNum} duurde te lang.`);
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL));

		const pollResp = await fetch(`/api/transcribe-api/${transcriptId}`, {
			signal: controller.signal
		});

		if (pollResp.redirected || pollResp.url.includes('/login')) {
			throw new Error('Sessie verlopen — log opnieuw in.');
		}
		if (!pollResp.ok) {
			const body = await tryParseJson(pollResp);
			throw new Error(body?.error || `Poll error ${pollResp.status}`);
		}

		const result = await pollResp.json();

		if (result.status === 'queued') {
			setApiStatus(`Deel ${segNum}/${totalSegs}: wachtrij...`);
		} else if (result.status === 'processing') {
			setApiStatus(`Deel ${segNum}/${totalSegs}: verwerken...`);
		} else if (result.status === 'completed') {
			return {
				text: result.text || '',
				language: result.language || '',
				words: result.words,
				lowConfidenceCount: result.low_confidence_count || 0
			};
		} else if (result.status === 'error') {
			throw new Error(result.error || `Deel ${segNum} mislukt`);
		}
	}
}

/** Transcribe a large audio file by splitting into segments. */
async function sendAudioApiSegmented(
	file: Blob,
	refs: TranscriptionRefs,
	callbacks: TranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();

	setApiStatus('Audio voorbereiden...');

	const segments = file.type.includes('webm')
		? await splitAudioBlob(file, MAX_SEGMENT_BYTES)
		: await splitAsWavChunks(file, MAX_SEGMENT_BYTES);

	if (segments.length <= 1) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		const isNonWebm = !file.type.includes('webm');
		setError(
			isNonWebm
				? `Bestand te groot (${sizeMB} MB) voor conversie in deze browser. ` +
						'Gebruik Chrome/Firefox of start de lokale backend.'
				: `Bestand te groot (${sizeMB} MB) voor cloud-upload. ` +
						'Start de lokale backend voor grote bestanden.'
		);
		setApiStatus('');
		setStatus('idle');
		return;
	}

	const controller = new AbortController();
	callbacks.setApiPollController(controller);

	try {
		let fullText = '';
		let detectedLanguage = '';
		const allWords: { text: string; confidence: number; speaker?: string }[] = [];
		let totalLowConf = 0;

		for (let i = 0; i < segments.length; i++) {
			setApiStatus(`Deel ${i + 1}/${segments.length}: uploaden...`);

			const segFormData = new FormData();
			const ext = segments[i].type.includes('wav') ? 'wav' : 'webm';
			segFormData.append('file', segments[i], `segment-${i}.${ext}`);
			segFormData.append('lang', s.lang);

			const submitResp = await fetch('/api/transcribe-api', {
				method: 'POST',
				body: segFormData,
				signal: controller.signal
			});

			if (submitResp.redirected || submitResp.url.includes('/login')) {
				setError('Sessie verlopen — log opnieuw in.');
				setApiStatus('');
				setStatus('idle');
				return;
			}
			if (!submitResp.ok) {
				const handled = await tryHandleApiError(submitResp);
				if (handled) return;
				const body = await tryParseJson(submitResp);
				throw new Error(body?.error || `Server error ${submitResp.status}`);
			}

			let submitJson: { transcriptId?: string; error?: string };
			try {
				submitJson = await submitResp.json();
			} catch {
				throw new Error('Onverwacht antwoord van server (geen JSON)');
			}
			if (submitJson.error) throw new Error(submitJson.error);

			const result = await pollSegment(
				submitJson.transcriptId!,
				controller,
				i + 1,
				segments.length
			);

			if (result.text) {
				fullText += (fullText ? ' ' : '') + result.text;
			}
			if (result.language) detectedLanguage = result.language;
			if (result.words && Array.isArray(result.words)) {
				allWords.push(...result.words);
			}
			totalLowConf += result.lowConfidenceCount;

			// Show partial results after each segment
			setRaw(fullText);
			if (detectedLanguage) setLanguage(detectedLanguage);
			setConfidenceWords([...allWords]);
			setLowConfidenceCount(totalLowConf);
		}

		setApiStatus('');
		await callbacks.onClearSavedRecording();
		setStatus('idle');
	} catch (e) {
		if (isAbortError(e)) {
			callbacks.setApiPollController(undefined);
			return;
		}
		handleCaughtError(e);
		setApiStatus('');
	} finally {
		callbacks.setApiPollController(undefined);
	}
}

// ── Shared helpers ────────────────────────────────────────────

function handleTranscriptionEvent(
	event: { type: string; [key: string]: unknown },
	s: ReturnType<typeof getTranscribeState>,
	callbacks: TranscriptionCallbacks
): void | 'stop' {
	if (event.type === 'info') {
		setLanguage((event.language as string) || '');
	} else if (event.type === 'segment') {
		let segmentText = event.text as string;
		if (event.speaker) segmentText = `Spreker ${event.speaker}: ${event.text}`;
		setRaw(s.raw ? `${s.raw}\n${segmentText}` : segmentText);
	} else if (event.type === 'error') {
		if (event.error_type) {
			callbacks.onHandleErrorEvent({
				error_type: event.error_type as string,
				retry_after: event.retry_after as number | undefined,
				message: event.message as string | undefined
			});
			setStatus('idle');
			return 'stop';
		}
		throw new Error(event.message as string);
	}
}

async function handleHttpError(resp: Response): Promise<void> {
	let body: { error?: string; error_type?: string } | undefined;
	try {
		body = await resp.json();
	} catch {
		/* not JSON */
	}
	if (body?.error_type) {
		setErrorType(body.error_type as ErrorType);
		setError(getUserMessage(body.error_type as ErrorType));
		setStatus('idle');
		return;
	}
	throw new Error(body?.error || `Server error ${resp.status}`);
}

async function tryHandleApiError(resp: Response): Promise<boolean> {
	let body: { error?: string; error_type?: string } | undefined;
	try {
		body = await resp.json();
	} catch {
		return false;
	}
	if (body?.error_type) {
		const detail = body.error ? ` (${body.error})` : '';
		setErrorType(body.error_type as ErrorType);
		setError(getUserMessage(body.error_type as ErrorType) + detail);
		setApiStatus('');
		setStatus('idle');
		return true;
	}
	return false;
}

async function tryParseJson(resp: Response): Promise<{ error?: string } | undefined> {
	try {
		return await resp.json();
	} catch {
		return undefined;
	}
}
