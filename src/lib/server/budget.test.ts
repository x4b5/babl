import { describe, it, expect } from 'vitest';
import { checkBudget, recordUsage } from './budget';

// De budget-teller is module-state zonder reset. Tests werken daarom met
// deltas en relatieve limieten, niet met absolute aantallen.
const BIG = { maxTranscriptions: 1_000_000, maxPolishing: 1_000_000 };

function currentTranscriptions(): number {
	return BIG.maxTranscriptions - checkBudget('transcription', BIG).remaining;
}
function currentPolishing(): number {
	return BIG.maxPolishing - checkBudget('polishing', BIG).remaining;
}

describe('checkBudget', () => {
	it('allows requests when under the limit', () => {
		expect(checkBudget('transcription', BIG).allowed).toBe(true);
		expect(checkBudget('polishing', BIG).allowed).toBe(true);
	});

	it('blocks and reports 0 remaining when exactly at the limit', () => {
		const used = currentTranscriptions();
		const result = checkBudget('transcription', {
			maxTranscriptions: used,
			maxPolishing: BIG.maxPolishing
		});
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it('never returns negative remaining', () => {
		const used = currentPolishing();
		const result = checkBudget('polishing', {
			maxTranscriptions: BIG.maxTranscriptions,
			maxPolishing: Math.max(0, used - 5)
		});
		expect(result.remaining).toBe(0);
	});
});

describe('recordUsage', () => {
	it('increments the transcription counter by one', () => {
		const before = currentTranscriptions();
		recordUsage('transcription');
		expect(currentTranscriptions()).toBe(before + 1);
	});

	it('tracks transcription and polishing independently', () => {
		const polishBefore = currentPolishing();
		recordUsage('transcription');
		expect(currentPolishing()).toBe(polishBefore);
	});
});
