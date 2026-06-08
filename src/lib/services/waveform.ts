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
	animationFrameId: number | undefined;
}

/** Start waveform visualization from a media stream. Returns updated refs. */
export function startWaveform(mediaStream: MediaStream, refs: WaveformRefs): WaveformRefs {
	const audioContext = new AudioContext();
	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 128;
	const source = audioContext.createMediaStreamSource(mediaStream);
	source.connect(analyser);
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	let animationFrameId: number | undefined;

	function updateBars() {
		analyser.getByteFrequencyData(dataArray);
		const step = Math.floor(bufferLength / BAR_COUNT);
		const bars: number[] = [];
		for (let i = 0; i < BAR_COUNT; i++) {
			const value = dataArray[i * step] || 0;
			bars.push(Math.max(MIN_BAR_HEIGHT, (value / 255) * MAX_BAR_HEIGHT));
		}
		setWaveformBars(bars);
		animationFrameId = requestAnimationFrame(updateBars);
	}
	animationFrameId = requestAnimationFrame(updateBars);

	return { audioContext, analyser, animationFrameId };
}

/** Pause waveform animation but keep AudioContext/analyser alive for resume. */
export function pauseWaveform(refs: WaveformRefs): WaveformRefs {
	if (refs.animationFrameId !== undefined) {
		cancelAnimationFrame(refs.animationFrameId);
	}
	setWaveformBars(new Array(BAR_COUNT).fill(MIN_BAR_HEIGHT));
	return { ...refs, animationFrameId: undefined };
}

/** Resume waveform animation using the existing analyser. */
export function resumeWaveform(refs: WaveformRefs): WaveformRefs {
	if (!refs.analyser) return refs;
	const analyser = refs.analyser;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);
	let animationFrameId: number | undefined;

	function updateBars() {
		analyser.getByteFrequencyData(dataArray);
		const step = Math.floor(bufferLength / BAR_COUNT);
		const bars: number[] = [];
		for (let i = 0; i < BAR_COUNT; i++) {
			const value = dataArray[i * step] || 0;
			bars.push(Math.max(MIN_BAR_HEIGHT, (value / 255) * MAX_BAR_HEIGHT));
		}
		setWaveformBars(bars);
		animationFrameId = requestAnimationFrame(updateBars);
	}
	animationFrameId = requestAnimationFrame(updateBars);

	return { ...refs, animationFrameId };
}

/** Stop waveform visualization and clean up resources. */
export function stopWaveform(refs: WaveformRefs): WaveformRefs {
	if (refs.animationFrameId !== undefined) {
		cancelAnimationFrame(refs.animationFrameId);
	}
	if (refs.audioContext) {
		refs.audioContext.close();
	}
	setWaveformBars(new Array(BAR_COUNT).fill(MIN_BAR_HEIGHT));
	return { audioContext: undefined, analyser: undefined, animationFrameId: undefined };
}
