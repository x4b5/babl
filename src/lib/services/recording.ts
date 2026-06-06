/**
 * Recording processing service — handles post-recording audio processing,
 * file uploads, and microphone permissions.
 */

import { downsampleToWav } from '$lib/utils/audio';
import { saveRecording } from '$lib/utils/recording-db';
import { sendAudio } from '$lib/services/transcription';
import type { TranscriptionRefs, TranscriptionCallbacks } from '$lib/services/transcription';
import { getSupportedMimeType } from '$lib/utils/audio';
import {
	setRaw,
	setError,
	setErrorType,
	setStatus,
	setCountdown,
	setPartialText,
	setRecordingDuration,
	setSavedRecordingId,
	setSavedRecordingMimeType,
	getTranscribeState
} from '$lib/stores/transcribe.svelte';

const MAX_DOWNSAMPLE_BYTES = 50 * 1024 * 1024;

export { type TranscriptionRefs, type TranscriptionCallbacks };

interface ProcessRecordingArgs {
	chunks: Blob[];
	mimeType: string;
	useRealtimeStream: boolean;
	transcriptionRefs: TranscriptionRefs;
	transcriptionCallbacks: TranscriptionCallbacks;
	onClearSavedRecording: () => Promise<void>;
}

/** Process recorded audio after MediaRecorder stops. */
export async function processRecording(args: ProcessRecordingArgs): Promise<void> {
	const {
		chunks,
		mimeType,
		useRealtimeStream,
		transcriptionRefs,
		transcriptionCallbacks,
		onClearSavedRecording
	} = args;
	const s = getTranscribeState();

	setRecordingDuration(s.elapsed);

	if (chunks.length === 0) {
		setError('Geen audio opgenomen. Probeer langer op te nemen.');
		setStatus('idle');
		return;
	}
	const blob = new Blob(chunks, { type: mimeType });

	try {
		const recId = await saveRecording(blob, mimeType);
		setSavedRecordingId(recId);
		setSavedRecordingMimeType(mimeType);
	} catch {
		// IndexedDB unavailable — continue without saving
	}

	// Real-time API streaming: use accumulated segments
	if (useRealtimeStream && s.liveSegments.length > 0) {
		setRaw(s.liveSegments.join(' '));
		setPartialText('');
		await onClearSavedRecording();
		setStatus('idle');
		return;
	}

	// Send full audio for transcription via SSE streaming (30s chunks with progress events)
	if (s.transcribeMode === 'api') {
		const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
		await sendAudio(blob, `recording.${ext}`, transcriptionRefs, transcriptionCallbacks);
	} else {
		try {
			const wav = await downsampleToWav(blob);
			await sendAudio(wav, 'recording.wav', transcriptionRefs, transcriptionCallbacks);
		} catch {
			const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
			await sendAudio(blob, `recording.${ext}`, transcriptionRefs, transcriptionCallbacks);
		}
	}
	setPartialText('');
}

/** Handle file upload — downsample if needed, then send for transcription. */
export async function handleFileUpload(
	e: Event,
	transcriptionRefs: TranscriptionRefs,
	transcriptionCallbacks: TranscriptionCallbacks
): Promise<void> {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	setError('');
	setStatus('processing');

	const s = getTranscribeState();
	if (s.transcribeMode === 'api') {
		await sendAudio(file, file.name, transcriptionRefs, transcriptionCallbacks);
	} else if (file.size > MAX_DOWNSAMPLE_BYTES) {
		await sendAudio(file, file.name, transcriptionRefs, transcriptionCallbacks);
	} else {
		try {
			const wav = await downsampleToWav(file);
			await sendAudio(wav, 'upload.wav', transcriptionRefs, transcriptionCallbacks);
		} catch {
			await sendAudio(file, file.name, transcriptionRefs, transcriptionCallbacks);
		}
	}
	input.value = '';
}

/** Request microphone permission from user. */
export async function requestMicPermission(): Promise<void> {
	try {
		const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		tempStream.getTracks().forEach((t) => t.stop());
		setError('');
		setErrorType('');
	} catch {
		setError(
			'Toestemming nog steeds geblokkeerd. Open je browserinstellingen (klik op het slotje links in de adresbalk) en zet "Microfoon" op "Toestaan". Herlaad daarna de pagina.'
		);
	}
}

/**
 * Run the pre-recording countdown and acquire microphone access.
 * Returns the MediaStream and supported MIME type, or null if cancelled/failed.
 */
export async function acquireMicrophone(): Promise<{
	stream: MediaStream;
	mimeType: string;
} | null> {
	setError('');
	setErrorType('');

	const mimeType = getSupportedMimeType();
	if (!mimeType) {
		setError('Je browser ondersteunt geen audio-opname.');
		return null;
	}

	// Countdown 3 → 2 → 1 (each step exactly 1 second)
	setStatus('preparing');
	for (let i = 3; i >= 1; i--) {
		setCountdown(i);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const s = getTranscribeState();
		if (s.status !== 'preparing') return null; // User cancelled
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		return { stream, mimeType };
	} catch (e) {
		setStatus('idle');
		const err = e instanceof DOMException ? e : null;
		if (err?.name === 'NotAllowedError') {
			setErrorType('mic_denied');
			setError(
				'Microfoontoegang is geweigerd. Klik op het slotje (of site-instellingen) in je adresbalk en zet "Microfoon" op "Toestaan".'
			);
		} else if (err?.name === 'NotFoundError') {
			setError('Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.');
		} else {
			setError('Microfoon niet beschikbaar. Controleer je browserpermissies.');
		}
		return null;
	}
}
