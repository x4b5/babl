/**
 * Transcription service — sends audio to local Whisper or AssemblyAI API.
 * Handles SSE stream parsing, stall detection, and error classification.
 */

import { readSSEStream } from '$lib/utils/sse-reader';
import { classifyFrontendError, getUserMessage } from '$lib/utils/error-classifier';
import type { ErrorType } from '$lib/utils/error-types';
import { deduplicateSegments } from '$lib/utils/dedup';
import type { TranscriptionSegment } from '$lib/utils/dedup';
import { downsampleToWav } from '$lib/utils/audio';
import {
	LOCAL_BACKEND_URL,
	OVERLAP_CHUNKS,
	SSE_STALL_TIMEOUT_MS,
	setRaw,
	setLanguage,
	setError,
	setErrorType,
	setStatus,
	setApiStatus,
	setConfidenceWords,
	setLowConfidenceCount,
	setPartialText,
	setLiveWorking,
	setLastSegmentEnd,
	setLastSentChunkIndex,
	setLiveAudioDuration,
	appendPartialText,
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
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		setError(
			`Bestand te groot (${sizeMB} MB) voor cloud-upload (max 4 MB). ` +
				'Neem een kortere opname of start de lokale backend.'
		);
		setApiStatus('');
		setStatus('idle');
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

// ── Live transcription (local Whisper, incremental) ──────────

export interface LiveTranscriptionRefs {
	readonly chunks: Blob[];
	readonly mediaRecorder: MediaRecorder | undefined;
}

interface LiveTranscriptionCallbacks {
	setLiveChunkController: (v: AbortController | undefined) => void;
}

let liveBusy = false;
let liveRunning = false;

async function sendLiveChunk(
	refs: LiveTranscriptionRefs,
	callbacks: LiveTranscriptionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	if (liveBusy || refs.chunks.length === 0 || !refs.mediaRecorder) return;
	if (refs.chunks.length <= s.lastSentChunkIndex) return;
	liveBusy = true;
	const controller = new AbortController();
	callbacks.setLiveChunkController(controller);
	try {
		const mimeType = refs.mediaRecorder.mimeType;
		const sendFrom = Math.max(0, s.lastSentChunkIndex - OVERLAP_CHUNKS);
		const blob = new Blob(refs.chunks.slice(sendFrom), { type: mimeType });
		const wav = await downsampleToWav(blob);
		const formData = new FormData();
		formData.append('file', wav, 'live.wav');
		formData.append('lang', s.lang);
		formData.append('offset', String(s.liveAudioDuration));
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		if (resp.ok) {
			const data = await resp.json();
			if (data.language) setLanguage(data.language);
			const segments: TranscriptionSegment[] = data.segments || [];
			if (segments.length > 0) {
				const { unique, newLastSegmentEnd } = deduplicateSegments(segments, s.lastSegmentEnd);
				if (unique.length > 0) {
					const newText = unique.map((seg) => seg.text).join(' ');
					appendPartialText(newText);
					setLiveWorking(true);
					setLastSegmentEnd(newLastSegmentEnd);
					setLiveAudioDuration(unique[unique.length - 1].end);
				}
			}
			setLastSentChunkIndex(refs.chunks.length);
		}
	} catch (e) {
		if (e instanceof Error && e.name === 'AbortError') return;
	} finally {
		callbacks.setLiveChunkController(undefined);
		liveBusy = false;
	}
}

export function startLiveTranscription(
	refs: LiveTranscriptionRefs,
	callbacks: LiveTranscriptionCallbacks
): void {
	setPartialText('');
	setLiveWorking(false);
	liveBusy = false;
	liveRunning = true;
	setLastSentChunkIndex(0);
	setLiveAudioDuration(0);
	setLastSegmentEnd(0);
	liveLoop(refs, callbacks);
}

async function liveLoop(
	refs: LiveTranscriptionRefs,
	callbacks: LiveTranscriptionCallbacks
): Promise<void> {
	while (liveRunning) {
		await new Promise((r) => setTimeout(r, 5000));
		if (!liveRunning) break;
		await sendLiveChunk(refs, callbacks);
	}
}

export function stopLiveTranscription(): void {
	liveRunning = false;
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

function handleCaughtError(e: unknown): void {
	const classified = classifyFrontendError(e);
	setErrorType(classified);
	setError(getUserMessage(classified));
	setStatus('idle');
}

function isAbortError(e: unknown): boolean {
	return e instanceof Error && e.name === 'AbortError';
}
