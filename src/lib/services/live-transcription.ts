/**
 * Live transcription service — sends incremental audio chunks to local Whisper
 * during recording for real-time partial transcription.
 */

import { downsampleToWav } from '$lib/utils/audio';
import { deduplicateSegments } from '$lib/utils/dedup';
import type { TranscriptionSegment } from '$lib/utils/dedup';
import {
	LOCAL_BACKEND_URL,
	OVERLAP_CHUNKS,
	setLanguage,
	setPartialText,
	setLiveWorking,
	setLastSegmentEnd,
	setLastSentChunkIndex,
	setLiveAudioDuration,
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
