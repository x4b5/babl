/**
 * Daily budget enforcement for API requests.
 *
 * Tracks request counts per day in-memory. On Vercel serverless this resets
 * on cold start — acceptable for burst protection. For absolute guarantees,
 * back with Redis/Upstash later.
 *
 * Env vars:
 *   DAILY_BUDGET_MAX_TRANSCRIPTIONS (default: 50)
 *   DAILY_BUDGET_MAX_POLISHING      (default: 100)
 */

interface DailyCounter {
	date: string;
	transcriptions: number;
	polishing: number;
}

let counter: DailyCounter = { date: today(), transcriptions: 0, polishing: 0 };

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function ensureCurrentDay(): void {
	const t = today();
	if (counter.date !== t) {
		counter = { date: t, transcriptions: 0, polishing: 0 };
	}
}

export function checkBudget(
	type: 'transcription' | 'polishing',
	limits: { maxTranscriptions: number; maxPolishing: number }
): { allowed: boolean; remaining: number } {
	ensureCurrentDay();

	if (type === 'transcription') {
		const remaining = limits.maxTranscriptions - counter.transcriptions;
		return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
	}

	const remaining = limits.maxPolishing - counter.polishing;
	return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function recordUsage(type: 'transcription' | 'polishing'): void {
	ensureCurrentDay();
	if (type === 'transcription') {
		counter.transcriptions += 1;
	} else {
		counter.polishing += 1;
	}
}
