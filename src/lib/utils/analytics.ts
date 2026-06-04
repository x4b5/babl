import posthog from 'posthog-js';
import type { Status } from '../stores/transcribe.svelte';

let initialized = false;

export function initAnalytics(): void {
	try {
		const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
		if (!key) return;

		const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';

		posthog.init(key, {
			api_host: host,
			person_profiles: 'never',
			capture_pageview: false,
			ip: false
		});
		initialized = true;
	} catch (e) {
		// Silent fail — analytics should never break the app
	}
}

function capture(event: string, properties?: Record<string, unknown>): void {
	if (!initialized) return;
	try {
		posthog.capture(event, properties);
	} catch {
		// Silent fail
	}
}

// --- Add your tracking functions below ---

export function trackPageViewed(page: string): void {
	capture('page_viewed', { page });
}

export function setupAbandonmentTracking(getStateFn: () => { status: Status }): void {
	if (typeof document === 'undefined') return;

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState !== 'hidden') return;
		try {
			const state = getStateFn();
			capture('session_abandoned', { status: state.status });
		} catch {
			// Silent fail
		}
	});
}
