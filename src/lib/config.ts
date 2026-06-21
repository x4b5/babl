/**
 * Build-time configuration for endpoints.
 *
 * Eén codebase levert twee builds:
 * - Web (Vercel): `API_BASE_URL` is leeg, dus `/api/*` blijft een relatief verzoek
 *   naar dezelfde Vercel-origin. Gedrag verandert niet t.o.v. voorheen.
 * - Desktop (Tauri): de desktop-app heeft geen eigen server en moet de gedeployde
 *   API-routes over internet bereiken. Dan staat `API_BASE_URL` op de volledige
 *   Vercel-URL, ingesteld via de build-variabele `VITE_API_BASE_URL`.
 */

/** Lokale FastAPI backend (Whisper + Ollama). Zelfde op web (localhost) en desktop. */
export const LOCAL_BACKEND_URL = 'http://localhost:8000';

/**
 * Basisadres voor de gedeployde SvelteKit API-routes (AssemblyAI + Mistral).
 * Lege string → same-origin relatieve verzoeken (web/tests).
 * Volledige URL via `VITE_API_BASE_URL` → desktop-build.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

/** Welke build draait er: 'web' (Vercel) of 'desktop' (Tauri). */
export const BUILD_TARGET: 'web' | 'desktop' =
	import.meta.env.VITE_BUILD_TARGET === 'desktop' ? 'desktop' : 'web';

/** Snelle check: draaien we in de desktop-app? */
export const IS_DESKTOP = BUILD_TARGET === 'desktop';

/**
 * Bouw de volledige URL voor een gedeployde API-route, met respect voor `API_BASE_URL`.
 * Op web/tests is dit een no-op (geeft het pad ongewijzigd terug).
 */
export function apiUrl(path: string): string {
	return `${API_BASE_URL}${path}`;
}

// ── Desktop-API-authenticatie ─────────────────────────────────
// De web-versie zit achter een login-poort. De desktop-app logt in via
// /api/desktop-login en bewaart het token, dat het daarna als header meestuurt.

const API_TOKEN_KEY = 'babl_api_token';

/** Het opgeslagen API-token (alleen relevant in de desktop-app). */
export function getApiToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(API_TOKEN_KEY);
}

export function setApiToken(token: string): void {
	if (typeof localStorage !== 'undefined') localStorage.setItem(API_TOKEN_KEY, token);
}

export function clearApiToken(): void {
	if (typeof localStorage !== 'undefined') localStorage.removeItem(API_TOKEN_KEY);
}

/** Heeft de desktop-app een API-token? Op web altijd false (niet nodig). */
export function hasApiAuth(): boolean {
	return IS_DESKTOP && getApiToken() !== null;
}

/**
 * `fetch` voor gedeployde API-routes. Voegt op desktop het auth-token toe als
 * `X-Babl-Token`-header en zet het volledige adres via `apiUrl()`. Op web
 * gedraagt het zich als een gewone same-origin fetch.
 */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	const token = getApiToken();
	if (IS_DESKTOP && token) headers.set('X-Babl-Token', token);
	return fetch(apiUrl(path), { ...init, headers });
}

/**
 * Log in op de gedeployde API met het wachtwoord en bewaar het token.
 * Gooit een Error met een leesbare melding bij mislukking.
 */
export async function desktopLogin(password: string): Promise<void> {
	const resp = await fetch(apiUrl('/api/desktop-login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password })
	});
	if (!resp.ok) {
		const body = await resp.json().catch(() => null);
		throw new Error(body?.error ?? `Inloggen mislukt (${resp.status}).`);
	}
	const { token } = await resp.json();
	if (!token) throw new Error('Geen token ontvangen.');
	setApiToken(token);
}
