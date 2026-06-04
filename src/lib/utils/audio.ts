/**
 * Pure audio utility functions for recording and processing.
 * Extracted from +page.svelte for testability and reuse.
 */

/** Return the first supported audio MIME type for MediaRecorder, or empty string. */
export function getSupportedMimeType(): string {
	for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']) {
		if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return '';
}

/** Encode Float32 PCM samples into a WAV ArrayBuffer (16-bit mono). */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
	const len = samples.length;
	const buffer = new ArrayBuffer(44 + len * 2);
	const view = new DataView(buffer);

	function writeString(offset: number, str: string) {
		for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
	}

	writeString(0, 'RIFF');
	view.setUint32(4, 36 + len * 2, true);
	writeString(8, 'WAVE');
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // byte rate
	view.setUint16(32, 2, true); // block align
	view.setUint16(34, 16, true); // bits per sample
	writeString(36, 'data');
	view.setUint32(40, len * 2, true);

	for (let i = 0; i < len; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
	}
	return buffer;
}

/** Downsample audio blob to 16kHz mono WAV — Whisper doesn't need more. */
export async function downsampleToWav(blob: Blob): Promise<Blob> {
	const TARGET_RATE = 16000;
	const ctx = new OfflineAudioContext(1, 1, TARGET_RATE);
	const arrayBuffer = await blob.arrayBuffer();
	const decoded = await ctx.decodeAudioData(arrayBuffer);

	// Render to 16kHz mono
	const offline = new OfflineAudioContext(
		1,
		Math.ceil(decoded.duration * TARGET_RATE),
		TARGET_RATE
	);
	const source = offline.createBufferSource();
	source.buffer = decoded;
	source.connect(offline.destination);
	source.start();
	const rendered = await offline.startRendering();

	// Encode as WAV
	const pcm = rendered.getChannelData(0);
	const wavBuffer = encodeWav(pcm, TARGET_RATE);
	return new Blob([wavBuffer], { type: 'audio/wav' });
}

/** Convert audio blob to raw 16kHz mono PCM Int16 LE bytes for AssemblyAI streaming. */
export async function toPcmInt16(blob: Blob): Promise<ArrayBuffer> {
	const TARGET_RATE = 16000;
	const arrayBuffer = await blob.arrayBuffer();
	const ctx = new OfflineAudioContext(1, 1, TARGET_RATE);
	const decoded = await ctx.decodeAudioData(arrayBuffer);

	const offline = new OfflineAudioContext(
		1,
		Math.ceil(decoded.duration * TARGET_RATE),
		TARGET_RATE
	);
	const source = offline.createBufferSource();
	source.buffer = decoded;
	source.connect(offline.destination);
	source.start();
	const rendered = await offline.startRendering();

	const samples = rendered.getChannelData(0);
	const pcmBuffer = new ArrayBuffer(samples.length * 2);
	const view = new DataView(pcmBuffer);
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
	}
	return pcmBuffer;
}
