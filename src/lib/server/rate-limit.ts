/**
 * Simple sliding-window rate limiter per IP address.
 *
 * In-memory — resets on cold start. Sufficient for burst protection.
 *
 * Env vars:
 *   RATE_LIMIT_PER_MINUTE (default: 20)
 */

interface WindowEntry {
	timestamps: number[];
}

const windows = new Map<string, WindowEntry>();
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;

	const cutoff = now - 60_000;
	for (const [ip, entry] of windows) {
		entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
		if (entry.timestamps.length === 0) {
			windows.delete(ip);
		}
	}
}

export function isRateLimited(ip: string, maxPerMinute: number): boolean {
	cleanup();

	const now = Date.now();
	const cutoff = now - 60_000;
	const entry = windows.get(ip) || { timestamps: [] };

	entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

	if (entry.timestamps.length >= maxPerMinute) {
		return true;
	}

	entry.timestamps.push(now);
	windows.set(ip, entry);
	return false;
}
