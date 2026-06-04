import { describe, it, expect } from 'vitest';
import { encodeWav } from './audio';

describe('encodeWav', () => {
	it('produces a valid WAV header for empty samples', () => {
		const samples = new Float32Array(0);
		const buffer = encodeWav(samples, 16000);
		const view = new DataView(buffer);

		// Total size: 44 byte header + 0 data bytes
		expect(buffer.byteLength).toBe(44);

		// RIFF header
		expect(
			String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
		).toBe('RIFF');
		expect(view.getUint32(4, true)).toBe(36); // 36 + 0 data bytes

		// WAVE format
		expect(
			String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
		).toBe('WAVE');

		// fmt chunk
		expect(view.getUint16(20, true)).toBe(1); // PCM
		expect(view.getUint16(22, true)).toBe(1); // mono
		expect(view.getUint32(24, true)).toBe(16000); // sample rate
		expect(view.getUint16(34, true)).toBe(16); // bits per sample

		// data chunk size
		expect(view.getUint32(40, true)).toBe(0);
	});

	it('encodes samples as 16-bit PCM', () => {
		const samples = new Float32Array([0, 1, -1, 0.5, -0.5]);
		const buffer = encodeWav(samples, 44100);
		const view = new DataView(buffer);

		// Total size: 44 header + 5 samples * 2 bytes
		expect(buffer.byteLength).toBe(44 + 10);

		// Check sample values
		expect(view.getInt16(44, true)).toBe(0); // 0.0 -> 0
		expect(view.getInt16(46, true)).toBe(0x7fff); // 1.0 -> max positive
		expect(view.getInt16(48, true)).toBe(-0x8000); // -1.0 -> max negative
	});

	it('clamps values outside [-1, 1]', () => {
		const samples = new Float32Array([2.0, -3.0]);
		const buffer = encodeWav(samples, 16000);
		const view = new DataView(buffer);

		// Clamped to 1.0 and -1.0
		expect(view.getInt16(44, true)).toBe(0x7fff);
		expect(view.getInt16(46, true)).toBe(-0x8000);
	});

	it('sets correct sample rate in header', () => {
		const samples = new Float32Array([0]);
		const buffer = encodeWav(samples, 48000);
		const view = new DataView(buffer);

		expect(view.getUint32(24, true)).toBe(48000);
		expect(view.getUint32(28, true)).toBe(96000); // byte rate = sampleRate * 2
	});
});
