import { describe, it, expect } from 'vitest';
import { deduplicateSegments, DEDUP_TOLERANCE } from './dedup';
import type { TranscriptionSegment } from './dedup';

describe('deduplicateSegments', () => {
	describe('basic behavior', () => {
		it('returns all segments when lastSegmentEnd is 0 (first batch)', () => {
			const segments: TranscriptionSegment[] = [
				{ text: 'hello', start: 0.0, end: 1.5 },
				{ text: 'world', start: 1.5, end: 3.0 }
			];
			const result = deduplicateSegments(segments, 0);
			expect(result.unique).toHaveLength(2);
			expect(result.newLastSegmentEnd).toBe(3.0);
		});

		it('returns empty array for empty input', () => {
			const result = deduplicateSegments([], 10.0);
			expect(result.unique).toHaveLength(0);
			expect(result.newLastSegmentEnd).toBe(10.0);
		});

		it('keeps segments fully after lastSegmentEnd', () => {
			const segments: TranscriptionSegment[] = [{ text: 'new text', start: 10.0, end: 12.0 }];
			const result = deduplicateSegments(segments, 5.0);
			expect(result.unique).toHaveLength(1);
			expect(result.unique[0].text).toBe('new text');
		});
	});

	describe('overlap detection (OF-03)', () => {
		it('filters out segment that overlaps with previous (within tolerance)', () => {
			const segments: TranscriptionSegment[] = [
				{ text: 'duplicate', start: 29.8, end: 30.5 },
				{ text: 'new', start: 31.0, end: 32.0 }
			];
			// lastSegmentEnd=30.0, tolerance=0.5
			// segment at 29.8: 29.8 < 30.0 + 0.5 = 30.5 -> filtered
			// segment at 31.0: 31.0 < 30.0 + 0.5 = 30.5 -> NOT filtered (31.0 >= 30.5)
			const result = deduplicateSegments(segments, 30.0);
			expect(result.unique).toHaveLength(1);
			expect(result.unique[0].text).toBe('new');
		});

		it('filters out segment starting exactly at lastSegmentEnd', () => {
			const segments: TranscriptionSegment[] = [{ text: 'overlap', start: 30.0, end: 31.0 }];
			// 30.0 < 30.0 + 0.5 = 30.5 -> filtered
			const result = deduplicateSegments(segments, 30.0);
			expect(result.unique).toHaveLength(0);
		});

		it('keeps segment starting just outside tolerance window', () => {
			const segments: TranscriptionSegment[] = [{ text: 'not overlap', start: 30.6, end: 31.5 }];
			// 30.6 < 30.0 + 0.5 = 30.5 -> False, NOT filtered (30.6 >= 30.5)
			const result = deduplicateSegments(segments, 30.0);
			expect(result.unique).toHaveLength(1);
		});

		it('handles multiple overlapping segments in one batch', () => {
			const segments: TranscriptionSegment[] = [
				{ text: 'old1', start: 29.0, end: 29.5 },
				{ text: 'old2', start: 29.5, end: 30.0 },
				{ text: 'old3', start: 30.0, end: 30.3 },
				{ text: 'new1', start: 30.8, end: 31.5 },
				{ text: 'new2', start: 31.5, end: 32.0 }
			];
			const result = deduplicateSegments(segments, 30.0);
			// old1: 29.0 < 30.5 -> filtered
			// old2: 29.5 < 30.5 -> filtered
			// old3: 30.0 < 30.5 -> filtered
			// new1: 30.8 >= 30.5 -> kept
			// new2: 31.5 >= 30.5 -> kept
			expect(result.unique).toHaveLength(2);
			expect(result.unique[0].text).toBe('new1');
			expect(result.unique[1].text).toBe('new2');
			expect(result.newLastSegmentEnd).toBe(32.0);
		});
	});

	describe('custom tolerance', () => {
		it('respects custom tolerance value', () => {
			const segments: TranscriptionSegment[] = [{ text: 'edge', start: 30.2, end: 31.0 }];
			// With tolerance=0.1: 30.2 < 30.0 + 0.1 = 30.1 -> False, kept
			const result = deduplicateSegments(segments, 30.0, 0.1);
			expect(result.unique).toHaveLength(1);
		});

		it('zero tolerance only filters exact overlaps', () => {
			const segments: TranscriptionSegment[] = [
				{ text: 'at boundary', start: 30.0, end: 31.0 },
				{ text: 'just after', start: 30.1, end: 31.5 }
			];
			// With tolerance=0: 30.0 < 30.0 + 0 = 30.0 -> False (not strictly less), kept
			// With tolerance=0: 30.1 < 30.0 + 0 = 30.0 -> False, kept
			const result = deduplicateSegments(segments, 30.0, 0);
			expect(result.unique).toHaveLength(2);
		});
	});

	describe('lastSegmentEnd tracking', () => {
		it('updates lastSegmentEnd to last unique segment end', () => {
			const segments: TranscriptionSegment[] = [
				{ text: 'a', start: 10.0, end: 12.0 },
				{ text: 'b', start: 12.0, end: 15.0 }
			];
			const result = deduplicateSegments(segments, 5.0);
			expect(result.newLastSegmentEnd).toBe(15.0);
		});

		it('preserves lastSegmentEnd when all segments filtered', () => {
			const segments: TranscriptionSegment[] = [{ text: 'old', start: 29.5, end: 30.0 }];
			const result = deduplicateSegments(segments, 30.0);
			expect(result.unique).toHaveLength(0);
			expect(result.newLastSegmentEnd).toBe(30.0);
		});
	});

	describe('default tolerance constant', () => {
		it('DEDUP_TOLERANCE is 0.5 seconds per D-06', () => {
			expect(DEDUP_TOLERANCE).toBe(0.5);
		});
	});
});
