import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startWaveform, pauseWaveform, resumeWaveform, stopWaveform } from './waveform';
import type { WaveformRefs } from './waveform';
import { getTranscribeState } from '$lib/stores/transcribe.svelte';

const s = getTranscribeState();

// ── Browser-API stubs ─────────────────────────────────────────

let nextFrameId: number;
let pendingFrame: FrameRequestCallback | undefined;
let rafMock: ReturnType<typeof vi.fn>;
let cafMock: ReturnType<typeof vi.fn>;

/** Laat de eerstvolgende geplande animatieframe afgaan. */
function fireFrame(): void {
	const cb = pendingFrame;
	pendingFrame = undefined;
	cb?.(0);
}

const closeMock = vi.fn();
const fakeAnalyser = {
	fftSize: 0,
	frequencyBinCount: 128,
	// Vul met maximaal volume zodat de balken op vol uitslaan
	getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(255))
} as unknown as AnalyserNode;

class FakeAudioContext {
	createAnalyser() {
		return fakeAnalyser;
	}
	createMediaStreamSource() {
		return { connect: vi.fn() };
	}
	close = closeMock;
}

function freshRefs(): WaveformRefs {
	return { audioContext: undefined, analyser: undefined, animationFrameId: { current: undefined } };
}

beforeEach(() => {
	nextFrameId = 1;
	pendingFrame = undefined;
	rafMock = vi.fn((cb: FrameRequestCallback) => {
		pendingFrame = cb;
		return nextFrameId++;
	});
	cafMock = vi.fn();
	vi.stubGlobal('requestAnimationFrame', rafMock);
	vi.stubGlobal('cancelAnimationFrame', cafMock);
	vi.stubGlobal('AudioContext', FakeAudioContext);
	closeMock.mockClear();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('startWaveform', () => {
	it('vult de balken op basis van audiodata bij elke frame', () => {
		const refs = startWaveform({} as MediaStream, freshRefs());

		fireFrame();

		expect(s.waveformBars).toHaveLength(40);
		expect(s.waveformBars.every((b) => b === 48)).toBe(true); // vol volume = max hoogte
		expect(refs.animationFrameId.current).toBeDefined();
	});
});

describe('stopWaveform', () => {
	it('annuleert het meest recente frame-id, niet het eerste', () => {
		const refs = startWaveform({} as MediaStream, freshRefs());

		// Drie frames laten lopen: het actuele id schuift op naar 4
		fireFrame();
		fireFrame();
		fireFrame();
		expect(refs.animationFrameId.current).toBe(4);

		const stopped = stopWaveform(refs);

		expect(cafMock).toHaveBeenCalledWith(4);
		expect(closeMock).toHaveBeenCalled();
		expect(stopped.animationFrameId.current).toBeUndefined();
		expect(s.waveformBars.every((b) => b === 3)).toBe(true); // terug naar minimum
	});
});

describe('pauseWaveform en resumeWaveform', () => {
	it('pauzeren annuleert de animatie en zet de balken op minimum', () => {
		const refs = startWaveform({} as MediaStream, freshRefs());
		fireFrame();

		const paused = pauseWaveform(refs);

		expect(cafMock).toHaveBeenCalledWith(2);
		expect(paused.animationFrameId.current).toBeUndefined();
		expect(s.waveformBars.every((b) => b === 3)).toBe(true);
	});

	it('hervatten start de animatie opnieuw met dezelfde analyser', () => {
		const refs = pauseWaveform(startWaveform({} as MediaStream, freshRefs()));
		rafMock.mockClear();

		const resumed = resumeWaveform(refs);
		fireFrame();

		expect(rafMock).toHaveBeenCalled();
		expect(resumed.animationFrameId.current).toBeDefined();
		expect(s.waveformBars.every((b) => b === 48)).toBe(true);
	});

	it('hervatten doet niets zonder analyser', () => {
		const refs = resumeWaveform(freshRefs());

		expect(rafMock).not.toHaveBeenCalled();
		expect(refs.animationFrameId.current).toBeUndefined();
	});
});
