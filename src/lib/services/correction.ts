/**
 * Correction service — sends transcribed text to Ollama (local) or Mistral (API)
 * for Limburgse dialect correction. Handles SSE token streaming and rate limiting.
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
	setCorrected,
	setStatus,
	setCountdownSeconds,
	setRetryCount,
	appendCorrected,
	resetForCorrection
} from '$lib/stores/transcribe.svelte';

/** Build disclaimer with current date/time stamp. */
function buildCorrectionDisclaimer(): string {
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

interface CorrectionRefs {
	correctionController: AbortController | undefined;
	countdownInterval: ReturnType<typeof setInterval> | undefined;
}

interface CorrectionCallbacks {
	setCorrectionController: (v: AbortController | undefined) => void;
	setCountdownInterval: (v: ReturnType<typeof setInterval> | undefined) => void;
}

/** Handle a typed error event from SSE stream (shared between transcription and correction). */
export function handleErrorEvent(
	event: { error_type?: string; retry_after?: number; message?: string },
	refs: CorrectionRefs,
	callbacks: CorrectionCallbacks
): void {
	const eventErrorType = (event.error_type || 'server_error') as ErrorType;
	setErrorType(eventErrorType);
	if (isRetryable(eventErrorType) && event.retry_after) {
		startCountdown(event.retry_after, refs, callbacks);
	} else {
		const detail = event.message ? ` (${event.message})` : '';
		setError(getUserMessage(eventErrorType) + detail);
	}
}

/** Start a rate-limit countdown with auto-retry. */
function startCountdown(
	seconds: number,
	refs: CorrectionRefs,
	callbacks: CorrectionCallbacks
): void {
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
				fetchCorrection(s.raw, s.lang, s.quality, refs, callbacks);
			} else {
				setError(RATE_LIMIT_EXHAUSTED);
				setErrorType('rate_limit');
				setRetryCount(0);
			}
		}
	}, 1000);
	callbacks.setCountdownInterval(interval);
}

/** Start correction flow. */
export function startCorrection(refs: CorrectionRefs, callbacks: CorrectionCallbacks): void {
	const s = getTranscribeState();
	if (!s.raw) return;
	resetForCorrection();
	if (refs.countdownInterval) {
		clearInterval(refs.countdownInterval);
		callbacks.setCountdownInterval(undefined);
	}
	fetchCorrection(s.raw, s.lang, s.quality, refs, callbacks);
}

/** Fetch correction via SSE streaming from local Ollama or Mistral API. */
async function fetchCorrection(
	text: string,
	corrLang: string,
	qual: string,
	refs: CorrectionRefs,
	callbacks: CorrectionCallbacks
): Promise<void> {
	const s = getTranscribeState();
	const body = {
		text,
		language: corrLang,
		quality: qual,
		mode: s.mode,
		temperature: s.temperature,
		report_length: s.reportLength,
		keep_dialect: s.keepDialect
	};
	const correctUrl = body.mode === 'api' ? '/api/correct' : `${LOCAL_BACKEND_URL}/correct`;
	const controller = new AbortController();
	callbacks.setCorrectionController(controller);

	try {
		const resp = await fetch(correctUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal
		});

		if (resp.redirected || resp.url.includes('/login')) {
			setError('Sessie verlopen — log opnieuw in.');
			setCorrected('');
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
			setCorrected('');
			return;
		}

		let streamError = false;
		await readSSEStream(resp, {
			controller,
			stallTimeoutMs: SSE_STALL_TIMEOUT_MS,
			onEvent: (event) => {
				if (event.type === 'token') {
					appendCorrected(event.text as string);
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

		if (!s.corrected) setCorrected(text);
		if (s.corrected && !streamError) {
			appendCorrected(buildCorrectionDisclaimer());
		}
	} catch (e) {
		if (isAbortError(e)) {
			callbacks.setCorrectionController(undefined);
			return;
		}
		handleCaughtError(e);
		setCorrected('');
	} finally {
		callbacks.setCorrectionController(undefined);
		setStatus('idle');
	}
}
