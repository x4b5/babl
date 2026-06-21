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
