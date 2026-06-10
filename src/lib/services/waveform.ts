/**
 * Waveform visualization service — manages AudioContext + AnalyserNode
 * for real-time audio level bars during recording.
 */

import { setWaveformBars } from '$lib/stores/transcribe.svelte';

const BAR_COUNT = 40;
const MIN_BAR_HEIGHT = 3;
const MAX_BAR_HEIGHT = 48;

export interface WaveformRefs {
	audioContext: AudioContext | undefined;
	analyser: AnalyserNode | undefined;
	// Box ({ current }) zodat het ID actueel blijft: de animatielus krijgt
	// elke frame een nieuw ID — een los nummer zou meteen verouderen.
	animationFrameId: { current: number | undefined };
}

/** Run the bar animation loop, keeping the latest frame ID in the box. */
function startBarAnimation(analyser: AnalyserNode, frameId: { current: number | undefined }): void {
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	function updateBars() {
		analyser.getByteFrequencyData(dataArray);
		const step = Math.floor(bufferLength / BAR_COUNT);
		const bars: number[] = [];
		for (let i = 0; i < BAR_COUNT; i++) {
			const value = dataArray[i * step] || 0;
			bars.push(Math.max(MIN_BAR_HEIGHT, (value / 255) * MAX_BAR_HEIGHT));
		}
		setWaveformBars(bars);
		frameId.current = requestAnimationFrame(updateBars);
	}
	frameId.current = requestAnimationFrame(updateBars);
}

function cancelBarAnimation(frameId: { current: number | undefined }): void {
	if (frameId.current !== undefined) {
		cancelAnimationFrame(frameId.current);
		frameId.current = undefined;
	}
}

/** Start waveform visualization from a media stream. Returns updated refs. */
export function startWaveform(mediaStream: MediaStream, refs: WaveformRefs): WaveformRefs {
	const audioContext = new AudioContext();
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 128;
	const source = audioContext.createMediaStreamSource(mediaStream);
	source.connect(analyser);
	const animationFrameId: { current: number | undefined } = { current: undefined };
	startBarAnimation(analyser, animationFrameId);

	return { audioContext, analyser, animationFrameId };
}

/** Pause waveform animation but keep AudioContext/analyser alive for resume. */
export function pauseWaveform(refs: WaveformRefs): WaveformRefs {
	cancelBarAnimation(refs.animationFrameId);
	setWaveformBars(new Array(BAR_COUNT).fill(MIN_BAR_HEIGHT));
	return refs;
}

/** Resume waveform animation using the existing analyser. */
export function resumeWaveform(refs: WaveformRefs): WaveformRefs {
	if (!refs.analyser) return refs;
	startBarAnimation(refs.analyser, refs.animationFrameId);
	return refs;
}

/** Stop waveform visualization and clean up resources. */
export function stopWaveform(refs: WaveformRefs): WaveformRefs {
	cancelBarAnimation(refs.animationFrameId);
	if (refs.audioContext) {
		refs.audioContext.close();
	}
	setWaveformBars(new Array(BAR_COUNT).fill(MIN_BAR_HEIGHT));
	return { audioContext: undefined, analyser: undefined, animationFrameId: { current: undefined } };
}
