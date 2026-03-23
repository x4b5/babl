/**
 * Timestamp-based segment deduplication (OF-03).
 *
 * Filters out segments that overlap with previously processed segments,
 * using a time-based tolerance window. This prevents duplicate text
 * when consecutive audio chunks return overlapping transcription segments.
 *
 * @param segments - New segments from transcription response
 * @param lastSegmentEnd - End timestamp of the last confirmed segment
 * @param tolerance - Overlap tolerance in seconds (default 0.5s per D-06)
 * @returns Object with unique segments and updated lastSegmentEnd
 */

export interface TranscriptionSegment {
	text: string;
	start: number;
	end: number;
}

export const DEDUP_TOLERANCE = 0.5; // seconds (D-06)

export function deduplicateSegments(
	segments: TranscriptionSegment[],
	lastSegmentEnd: number,
	tolerance: number = DEDUP_TOLERANCE
): { unique: TranscriptionSegment[]; newLastSegmentEnd: number } {
	const unique = segments.filter((s) => {
		if (lastSegmentEnd > 0 && s.start < lastSegmentEnd + tolerance) {
			return false;
		}
		return true;
	});

	const newLastSegmentEnd = unique.length > 0 ? unique[unique.length - 1].end : lastSegmentEnd;

	return { unique, newLastSegmentEnd };
}
