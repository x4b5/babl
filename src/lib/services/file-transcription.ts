/**
 * Segmented file upload for large audio — splits WebM/WAV and uploads
 * each segment separately to AssemblyAI via the SvelteKit API route.
 */

import { encodeWav } from '$lib/utils/audio';
import { apiFetch } from '$lib/config';
import { isAbortError, handleCaughtError } from '$lib/utils/error-classifier';
import {
	setRaw,
	setLanguage,
	setError,
	setApiStatus,
	setStatus,
	setConfidenceWords,
	setLowConfidenceCount,
	getTranscribeState
} from '$lib/stores/transcribe.svelte';
import type { TranscriptionCallbacks } from './transcription';
import { MAX_VERCEL_BODY_BYTES, tryParseJson, tryHandleApiError } from './api-error';

/** Check if a blob is WebM — covers audio/webm, video/webm, and empty type with .webm name. */
function isWebm(blob: Blob): boolean {
	if (blob.type.includes('webm')) return true;
	if (blob instanceof File && blob.name.endsWith('.webm')) return true;
	return false;
}

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
	if (!isWebm(blob)) return [blob];

	const data = new Uint8Array(await blob.arrayBuffer());

	// Find WebM Cluster element boundaries (EBML ID: 0x1F43B675)
	const clusterOffsets: number[] = [];
	for (let i = 0; i < data.length - 3; i++) {
		if (data[i] === 0x1f && data[i + 1] === 0x43 && data[i + 2] === 0xb6 && data[i + 3] === 0x75) {
			clusterOffsets.push(i);
		}
	}

	if (clusterOffsets.length < 2) return [blob];

	const initEnd = clusterOffsets[0];
	const initData = data.slice(0, initEnd);
	const segments: Blob[] = [];
	let groupStart = 0;

	for (let i = 0; i < clusterOffsets.length; i++) {
		const nextOffset = i + 1 < clusterOffsets.length ? clusterOffsets[i + 1] : data.length;
		const startOffset = clusterOffsets[groupStart];
		const segSize = initData.length + (nextOffset - startOffset);

		if (segSize > maxSize && i > groupStart) {
			const cutOffset = clusterOffsets[i];
			segments.push(
				new Blob([initData, data.slice(clusterOffsets[groupStart], cutOffset)], {
					type: blob.type
				})
			);
			groupStart = i;
		}
	}

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
	const POLL_INTERVAL = 5000;
	const MAX_POLL_TIME = 30 * 60 * 1000;
	const startTime = Date.now();

	while (true) {
		if (Date.now() - startTime > MAX_POLL_TIME) {
			throw new Error(`Deel ${segNum} duurde te lang.`);
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL));

		const pollResp = await apiFetch(`/api/transcribe-api/${transcriptId}`, {
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
export async function sendAudioApiSegmented(
	file: Blob,
	callbacks: TranscriptionCallbacks,
	finalizeRaw: () => void
): Promise<void> {
	const s = getTranscribeState();

	setApiStatus('Audio voorbereiden...');

	const segments = isWebm(file)
		? await splitAudioBlob(file, MAX_SEGMENT_BYTES)
		: await splitAsWavChunks(file, MAX_SEGMENT_BYTES);

	if (segments.length <= 1) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		const isNonWebm = !isWebm(file);
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

			const submitResp = await apiFetch('/api/transcribe-api', {
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

			setRaw(fullText);
			if (detectedLanguage) setLanguage(detectedLanguage);
			setConfidenceWords([...allWords]);
			setLowConfidenceCount(totalLowConf);
		}

		finalizeRaw();
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
