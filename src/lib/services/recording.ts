/**
 * Recording processing service — handles post-recording audio processing,
 * file uploads, and microphone permissions.
 */

import { downsampleToWav } from '$lib/utils/audio';
import { saveRecording } from '$lib/utils/recording-db';
import { sendAudio } from '$lib/services/transcription';
import type { TranscriptionRefs, TranscriptionCallbacks } from '$lib/services/transcription';
import {
	LOCAL_BACKEND_URL,
	OVERLAP_CHUNKS,
	setRaw,
	setLanguage,
	setError,
	setErrorType,
	setStatus,
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

	if (s.transcribeMode === 'local') {
		if (s.partialText) {
			if (s.lastSentChunkIndex < chunks.length) {
				setStatus('processing');
				try {
					const sendFrom = Math.max(0, s.lastSentChunkIndex - OVERLAP_CHUNKS);
					const remainingBlob = new Blob(chunks.slice(sendFrom), { type: mimeType });
					const wav = await downsampleToWav(remainingBlob);
					const formData = new FormData();
					formData.append('file', wav, 'final.wav');
					formData.append('lang', s.lang);
					formData.append('offset', String(s.liveAudioDuration));
					const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
						method: 'POST',
						body: formData
					});
					if (resp.ok) {
						const data = await resp.json();
						if (data.language) setLanguage(data.language);
						const segments = data.segments || [];
						if (segments.length > 0) {
							const newText = segments.map((seg: { text: string }) => seg.text).join(' ');
							setPartialText(`${s.partialText} ${newText}`);
						}
					}
				} catch {
					// Use what we have
				}
			}
			setRaw(s.partialText);
			setPartialText('');
			await onClearSavedRecording();
			setStatus('idle');
			return;
		}

		setStatus('processing');
		try {
			const wav = await downsampleToWav(blob);
			const formData = new FormData();
			formData.append('file', wav, 'final.wav');
			formData.append('lang', s.lang);
			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
				method: 'POST',
				body: formData
			});
			if (resp.ok) {
				const data = await resp.json();
				if (data.text) {
					setRaw(data.text);
					if (data.language) setLanguage(data.language);
					setPartialText('');
					await onClearSavedRecording();
					setStatus('idle');
					return;
				}
			}
		} catch {
			// Fall through to SSE transcription
		}
	}

	// Fallback: full SSE transcription via service
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
