import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanupMediaResources, cleanupNetworkResources, cleanupTimers } from './cleanup';

describe('cleanupMediaResources', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('stops MediaRecorder when state is "recording"', () => {
		const mockRecorder = {
			state: 'recording',
			stop: vi.fn()
		} as unknown as MediaRecorder;

		cleanupMediaResources({
			mediaRecorder: mockRecorder,
			stream: undefined,
			audioContext: undefined,
			analyser: { current: undefined },
			animationFrameId: { current: undefined }
		});

		expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
	});

	it('does NOT stop MediaRecorder when state is "inactive"', () => {
		const mockRecorder = {
			state: 'inactive',
			stop: vi.fn()
		} as unknown as MediaRecorder;

		cleanupMediaResources({
			mediaRecorder: mockRecorder,
			stream: undefined,
			audioContext: undefined,
			analyser: { current: undefined },
			animationFrameId: { current: undefined }
		});

		expect(mockRecorder.stop).not.toHaveBeenCalled();
	});

	it('stops all MediaStream tracks', () => {
		const track1 = { stop: vi.fn() };
		const track2 = { stop: vi.fn() };
		const mockStream = {
			getTracks: vi.fn(() => [track1, track2])
		} as unknown as MediaStream;

		cleanupMediaResources({
			mediaRecorder: undefined,
			stream: mockStream,
			audioContext: undefined,
			analyser: { current: undefined },
			animationFrameId: { current: undefined }
		});

		expect(track1.stop).toHaveBeenCalledTimes(1);
		expect(track2.stop).toHaveBeenCalledTimes(1);
	});

	it('closes AudioContext when state is not "closed"', () => {
		const mockContext = {
			state: 'running',
			close: vi.fn()
		} as unknown as AudioContext;

		cleanupMediaResources({
			mediaRecorder: undefined,
			stream: undefined,
			audioContext: mockContext,
			analyser: { current: undefined },
			animationFrameId: { current: undefined }
		});

		expect(mockContext.close).toHaveBeenCalledTimes(1);
	});

	it('does NOT close AudioContext when already "closed"', () => {
		const mockContext = {
			state: 'closed',
			close: vi.fn()
		} as unknown as AudioContext;

		cleanupMediaResources({
			mediaRecorder: undefined,
			stream: undefined,
			audioContext: mockContext,
			analyser: { current: undefined },
			animationFrameId: { current: undefined }
		});

		expect(mockContext.close).not.toHaveBeenCalled();
	});

	it('cancels animation frame and clears reference', () => {
		const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
		const analyserRef = { current: undefined as AnalyserNode | undefined };
		const animationFrameRef = { current: 123 as number | undefined };

		cleanupMediaResources({
			mediaRecorder: undefined,
			stream: undefined,
			audioContext: undefined,
			analyser: analyserRef,
			animationFrameId: animationFrameRef
		});

		expect(cancelSpy).toHaveBeenCalledWith(123);
		expect(animationFrameRef.current).toBeUndefined();
		expect(analyserRef.current).toBeUndefined();
	});

	it('handles all undefined refs without throwing', () => {
		expect(() => {
			cleanupMediaResources({
				mediaRecorder: undefined,
				stream: undefined,
				audioContext: undefined,
				analyser: { current: undefined },
				animationFrameId: { current: undefined }
			});
		}).not.toThrow();
	});
});

describe('cleanupNetworkResources', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('aborts all active AbortControllers', () => {
		const controller1 = new AbortController();
		const controller2 = new AbortController();
		const controller3 = new AbortController();
		const controller4 = new AbortController();

		const abort1 = vi.spyOn(controller1, 'abort');
		const abort2 = vi.spyOn(controller2, 'abort');
		const abort3 = vi.spyOn(controller3, 'abort');
		const abort4 = vi.spyOn(controller4, 'abort');

		cleanupNetworkResources({
			transcribeController: controller1,
			correctionController: controller2,
			liveChunkController: controller3,
			apiPollController: controller4,
			streamSocket: undefined
		});

		expect(abort1).toHaveBeenCalledTimes(1);
		expect(abort2).toHaveBeenCalledTimes(1);
		expect(abort3).toHaveBeenCalledTimes(1);
		expect(abort4).toHaveBeenCalledTimes(1);
	});

	it('closes WebSocket', () => {
		const mockSocket = {
			close: vi.fn()
		};

		cleanupNetworkResources({
			transcribeController: undefined,
			correctionController: undefined,
			liveChunkController: undefined,
			apiPollController: undefined,
			streamSocket: mockSocket
		});

		expect(mockSocket.close).toHaveBeenCalledTimes(1);
	});

	it('handles all undefined refs without throwing', () => {
		expect(() => {
			cleanupNetworkResources({
				transcribeController: undefined,
				correctionController: undefined,
				liveChunkController: undefined,
				apiPollController: undefined,
				streamSocket: undefined
			});
		}).not.toThrow();
	});
});

describe('cleanupTimers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('clears all interval and timeout timers', () => {
		const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

		const interval1 = 101 as ReturnType<typeof setInterval>;
		const interval2 = 102 as ReturnType<typeof setInterval>;
		const interval3 = 103 as ReturnType<typeof setInterval>;
		const interval4 = 104 as ReturnType<typeof setInterval>;
		const timeout1 = 201 as ReturnType<typeof setTimeout>;

		cleanupTimers({
			timerInterval: interval1,
			processingTimerInterval: interval2,
			liveInterval: interval3,
			countdownInterval: interval4,
			streamStallTimer: timeout1
		});

		expect(clearIntervalSpy).toHaveBeenCalledWith(interval1);
		expect(clearIntervalSpy).toHaveBeenCalledWith(interval2);
		expect(clearIntervalSpy).toHaveBeenCalledWith(interval3);
		expect(clearIntervalSpy).toHaveBeenCalledWith(interval4);
		expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout1);
	});

	it('handles all undefined timers without throwing', () => {
		expect(() => {
			cleanupTimers({
				timerInterval: undefined,
				processingTimerInterval: undefined,
				liveInterval: undefined,
				countdownInterval: undefined,
				streamStallTimer: undefined
			});
		}).not.toThrow();
	});
});
