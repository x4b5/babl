/**
 * Consent store — manages cookie/analytics consent state.
 * Follows the getter-object pattern from transcribe.svelte.ts.
 *
 * State is persisted to localStorage under 'babl_consent'.
 */

// ── Types ────────────────────────────────────────────────────

export type ConsentStatus = 'pending' | 'granted' | 'denied';

const STORAGE_KEY = 'babl_consent';

// ── Reactive state ───────────────────────────────────────────

let status = $state<ConsentStatus>('pending');

// ── Getter object ────────────────────────────────────────────

export function getConsentState() {
	return {
		get status() {
			return status;
		},
		get isGranted() {
			return status === 'granted';
		},
		get isDenied() {
			return status === 'denied';
		},
		get isPending() {
			return status === 'pending';
		}
	};
}

// ── Actions ──────────────────────────────────────────────────

/** Load saved consent from localStorage. Call once on mount. */
export function loadConsent(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'granted' || saved === 'denied') {
			status = saved;
		}
	} catch {
		// localStorage may be unavailable (private browsing, etc.)
	}
}

/** User grants consent (accepts cookies/analytics). */
export function grantConsent(): void {
	status = 'granted';
	persist();
}

/** User denies consent (rejects cookies/analytics). */
export function denyConsent(): void {
	status = 'denied';
	persist();
}

/** Reset consent back to pending (re-show banner). */
export function resetConsent(): void {
	status = 'pending';
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// silent fail
	}
}

// ── Internal ─────────────────────────────────────────────────

function persist(): void {
	try {
		localStorage.setItem(STORAGE_KEY, status);
	} catch {
		// silent fail
	}
}
