/**
 * API Consent store — manages consent for API data processing (AVG art. 6/7).
 * Follows the getter-object pattern from consent.svelte.ts.
 *
 * When API mode is used, audio goes to AssemblyAI (Dublin) and text to Mistral (EU).
 * This store ensures explicit consent before any API call.
 *
 * State is persisted to localStorage under 'babl_api_consent'.
 */

// ── Types ────────────────────────────────────────────────────

export type ApiConsentStatus = 'pending' | 'granted' | 'denied';

const STORAGE_KEY = 'babl_api_consent';
const TIMESTAMP_KEY = 'babl_api_consent_ts';

// ── Reactive state ───────────────────────────────────────────

let status = $state<ApiConsentStatus>('pending');
let consentTimestamp = $state<string | null>(null);

// ── Getter object ────────────────────────────────────────────

export function getApiConsentState() {
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
		},
		get consentTimestamp() {
			return consentTimestamp;
		}
	};
}

// ── Actions ──────────────────────────────────────────────────

/** Load saved API consent from localStorage. Call once on mount. */
export function loadApiConsent(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'granted' || saved === 'denied') {
			status = saved;
		}
		const savedTs = localStorage.getItem(TIMESTAMP_KEY);
		if (savedTs) {
			consentTimestamp = savedTs;
		}
	} catch {
		// localStorage may be unavailable (private browsing, etc.)
	}
}

/** User grants API consent (accepts data processing via EU servers). */
export function grantApiConsent(): void {
	status = 'granted';
	consentTimestamp = new Date().toISOString();
	persist();
}

/** User denies API consent (rejects data processing via API). */
export function denyApiConsent(): void {
	status = 'denied';
	consentTimestamp = null;
	persist();
}

/** Revoke API consent (re-show modal on next API usage). */
export function revokeApiConsent(): void {
	status = 'pending';
	consentTimestamp = null;
	try {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(TIMESTAMP_KEY);
	} catch {
		// silent fail
	}
}

// ── Internal ─────────────────────────────────────────────────

function persist(): void {
	try {
		localStorage.setItem(STORAGE_KEY, status);
		if (consentTimestamp) {
			localStorage.setItem(TIMESTAMP_KEY, consentTimestamp);
		} else {
			localStorage.removeItem(TIMESTAMP_KEY);
		}
	} catch {
		// silent fail
	}
}
