/**
 * Transcription service — sends audio to local Whisper or AssemblyAI API.
 * Handles SSE stream parsing, stall detection, and error classification.
 */

import { readSSEStream } from '$lib/utils/sse-reader';
import { getUserMessage, isAbortError, handleCaughtError } from '$lib/utils/error-classifier';
import type { ErrorType } from '$lib/utils/error-types';
import {
	LOCAL_BACKEND_URL,
	SSE_STALL_TIMEOUT_MS,
	LOCAL_SSE_STALL_TIMEOUT_MS,
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
import { sendAudioApiSegmented } from './file-transcription';

const MAX_VERCEL_BODY_BYTES = 4 * 1024 * 1024;

/** Build disclaimer with current date/time stamp. */
function buildDisclaimer(type: 'transcript' | 'verslag'): string {
	const now = new Date();
	const stamp = now.toLocaleString('nl-NL', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
	const label = type === 'transcript' ? 'transcript' : 'verslag';
	return (
		`\n\n---\nDit ${label} is automatisch gegenereerd op ${stamp} met behulp van ` +
		'AI-spraakherkenning en -verwerking. De nauwkeurigheid is niet gegarandeerd; de tekst kan ' +
		'onnauwkeurigheden of omissies bevatten ten opzichte van het gesproken woord. ' +
		'Controleer de inhoud alvorens deze voor officiële of juridische doeleinden te gebruiken.'
	);
}

/** Append disclaimer to raw text if there is content. */
function finalizeRaw(): void {
	const s = getTranscribeState();
	if (s.raw) setRaw(s.raw + buildDisclaimer('transcript'));
}

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
	console.log('[BABL DEBUG] sendAudio', {
		filename,
		blobSize: blob.size,
		blobType: blob.type,
		transcribeMode: s.transcribeMode,
		lang: s.lang
	});
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
		console.log('[BABL DEBUG] sendAudioLocal: fetching', LOCAL_BACKEND_URL + '/transcribe');
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		console.log('[BABL DEBUG] sendAudioLocal: response', resp.status, resp.ok);
		if (!resp.ok) {
			handleHttpError(resp);
			return;
		}
		await readSSEStream(resp, {
			controller,
			stallTimeoutMs: LOCAL_SSE_STALL_TIMEOUT_MS,
			onEvent: (event) => {
				console.log('[BABL DEBUG] SSE event:', event.type, event);
				return handleTranscriptionEvent(event, s, callbacks);
			}
		});
		console.log('[BABL DEBUG] SSE stream complete, raw:', s.raw?.substring(0, 100));
		finalizeRaw();
		await callbacks.onClearSavedRecording();
		setStatus('idle');
	} catch (e) {
		console.error('[BABL DEBUG] sendAudioLocal error:', e);
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
		await sendAudioApiSegmented(file, callbacks, finalizeRaw);
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
	const POLL_INTERVAL = 5000;
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
			finalizeRaw();
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
		finalizeRaw();
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
