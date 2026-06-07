/**
 * Polishing service — sends transcribed text to Ollama (local) or Mistral (API)
 * for Limburgse dialect polishing. Handles SSE token streaming and rate limiting.
 */

import { readSSEStream } from '$lib/utils/sse-reader';
import {
	getUserMessage,
	isRetryable,
	isAbortError,
	handleCaughtError
} from '$lib/utils/error-classifier';
import type { ErrorType } from '$lib/utils/error-types';
import { rateLimitMessage, RATE_LIMIT_EXHAUSTED } from '$lib/utils/error-types';
import {
	LOCAL_BACKEND_URL,
	SSE_STALL_TIMEOUT_MS,
	MAX_AUTO_RETRIES,
	getTranscribeState,
	setError,
	setErrorType,
	setPolished,
	setStatus,
	setCountdownSeconds,
	setRetryCount,
	appendPolished,
	resetForPolishing
} from '$lib/stores/transcribe.svelte';

/** Build disclaimer with current date/time stamp. */
function buildPolishingDisclaimer(): string {
	const now = new Date();
	const stamp = now.toLocaleString('nl-NL', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
	return (
		`\n\n---\nDit verslag is automatisch gegenereerd op ${stamp} op basis van een ` +
		'audiotranscriptie met behulp van AI-spraakherkenning en -verwerking. De nauwkeurigheid ' +
		'is niet gegarandeerd; de tekst kan onnauwkeurigheden of omissies bevatten ten opzichte ' +
		'van het gesproken woord. Controleer de inhoud alvorens deze voor officiële of juridische ' +
		'doeleinden te gebruiken.'
	);
}

export interface PolishingRefs {
	polishingController: AbortController | undefined;
	countdownInterval: ReturnType<typeof setInterval> | undefined;
}

export interface PolishingCallbacks {
	setPolishingController: (v: AbortController | undefined) => void;
	setCountdownInterval: (v: ReturnType<typeof setInterval> | undefined) => void;
}

/** Handle a typed error event from SSE stream (shared between transcription and polishing). */
export function handleErrorEvent(
	event: { error_type?: string; retry_after?: number; message?: string },
	refs: PolishingRefs,
	callbacks: PolishingCallbacks
): void {
	const eventErrorType = (event.error_type || 'server_error') as ErrorType;
	setErrorType(eventErrorType);
	if (isRetryable(eventErrorType) && event.retry_after) {
		startCountdown(event.retry_after, refs, callbacks);
	} else {
		setError(event.message || getUserMessage(eventErrorType));
	}
}

/** Start a rate-limit countdown with auto-retry. */
function startCountdown(seconds: number, refs: PolishingRefs, callbacks: PolishingCallbacks): void {
	if (refs.countdownInterval) clearInterval(refs.countdownInterval);
	setCountdownSeconds(seconds);
	setError(rateLimitMessage(seconds));

	const s = getTranscribeState();
	const interval = setInterval(() => {
		const next = s.countdownSeconds - 1;
		setCountdownSeconds(next);
		if (next > 0) {
			setError(rateLimitMessage(next));
		} else {
			clearInterval(interval);
			callbacks.setCountdownInterval(undefined);
			setError('');
			setErrorType('');
			setRetryCount(s.retryCount + 1);
			if (s.retryCount + 1 <= MAX_AUTO_RETRIES) {
				fetchPolishing(s.raw, s.lang, s.quality, refs, callbacks);
			} else {
				setError(RATE_LIMIT_EXHAUSTED);
				setErrorType('rate_limit');
				setRetryCount(0);
			}
		}
	}, 1000);
	callbacks.setCountdownInterval(interval);
}

/** Start polishing flow. */
export function startPolishing(refs: PolishingRefs, callbacks: PolishingCallbacks): void {
	const s = getTranscribeState();
	if (!s.raw) return;
	resetForPolishing();
	if (refs.countdownInterval) {
		clearInterval(refs.countdownInterval);
		callbacks.setCountdownInterval(undefined);
	}
	fetchPolishing(s.raw, s.lang, s.quality, refs, callbacks);
}

/** Fetch polishing via SSE streaming from local Ollama or Mistral API. */
async function fetchPolishing(
	text: string,
	corrLang: string,
	qual: string,
	refs: PolishingRefs,
	callbacks: PolishingCallbacks
): Promise<void> {
	const s = getTranscribeState();
	const body = {
		text,
		language: corrLang,
		quality: qual,
		mode: s.mode,
		temperature: s.temperature,
		report_length: s.reportLength,
		keep_dialect: s.keepDialect,
		model_family: s.modelFamily
	};
	const polishUrl = body.mode === 'api' ? '/api/polish' : `${LOCAL_BACKEND_URL}/polish`;
	const controller = new AbortController();
	callbacks.setPolishingController(controller);

	try {
		const resp = await fetch(polishUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal
		});

		if (resp.redirected || resp.url.includes('/login')) {
			setError('Sessie verlopen — log opnieuw in.');
			setPolished('');
			setStatus('idle');
			return;
		}
		if (!resp.ok) {
			if (resp.status === 429) {
				setErrorType('rate_limit');
				const retryAfter = parseInt(resp.headers.get('Retry-After') || '3', 10);
				startCountdown(Math.max(1, retryAfter), refs, callbacks);
			} else {
				handleCaughtError(new Error(`HTTP ${resp.status}`));
			}
			setPolished('');
			return;
		}

		let streamError = false;
		await readSSEStream(resp, {
			controller,
			stallTimeoutMs: SSE_STALL_TIMEOUT_MS,
			onEvent: (event) => {
				if (event.type === 'token') {
					appendPolished(event.text as string);
				} else if (event.type === 'error') {
					streamError = true;
					handleErrorEvent(
						event as { error_type?: string; retry_after?: number; message?: string },
						refs,
						callbacks
					);
					return 'stop';
				}
				// 'done' event — no action needed
			}
		});

		if (!s.polished) setPolished(text);
		if (s.polished && !streamError) {
			appendPolished(buildPolishingDisclaimer());
		}
	} catch (e) {
		if (isAbortError(e)) {
			callbacks.setPolishingController(undefined);
			return;
		}
		handleCaughtError(e);
		setPolished('');
	} finally {
		callbacks.setPolishingController(undefined);
		setStatus('idle');
	}
}
