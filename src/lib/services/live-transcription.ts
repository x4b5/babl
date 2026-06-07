/**
 * Live transcription service — sends incremental audio chunks to local Whisper
 * during recording for real-time partial transcription.
 */

import { downsampleToWav } from '$lib/utils/audio';
import {
	LOCAL_BACKEND_URL,
	OVERLAP_CHUNKS,
	CHUNK_INTERVAL_MS,
	setLanguage,
	setPartialText,
	setLiveWorking,
	setLastSentChunkIndex,
	appendPartialText,
	getTranscribeState
} from '$lib/stores/transcribe.svelte';

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

		// Calculate overlap in seconds based on actual chunk indices
		// (not accumulated Whisper timestamps which are chunk-relative)
		const overlapChunks = s.lastSentChunkIndex - sendFrom;
		const overlapSeconds = overlapChunks * (CHUNK_INTERVAL_MS / 1000);

		const formData = new FormData();
		formData.append('file', wav, 'live.wav');
		formData.append('lang', s.lang);
		formData.append('region', s.region);
		formData.append('offset', String(overlapSeconds));
		const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
			method: 'POST',
			body: formData,
			signal: controller.signal
		});
		if (resp.ok) {
			const data = await resp.json();
			if (data.language) setLanguage(data.language);
			const segments: { text: string }[] = data.segments || [];
			if (segments.length > 0) {
				const newText = segments.map((seg) => seg.text).join(' ');
				appendPartialText(newText);
				setLiveWorking(true);
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
