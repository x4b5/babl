import {
	LOCAL_BACKEND_URL,
	setMistralAvailable,
	setAssemblyAvailable,
	setLocalAvailable,
	setOllamaAvailable
} from '$lib/stores/transcribe.svelte';
import { apiFetch } from '$lib/config';
import { isMobile } from './device';

/**
 * Desktop start de lokale backend zelf mee (Tauri sidecar); die heeft een paar
 * seconden nodig om op te warmen. Daarom de lokale check een aantal keer herhalen
 * tot de backend antwoordt — anders ziet de gebruiker bij het openen onterecht
 * "lokaal niet beschikbaar".
 */
const LOCAL_HEALTH_RETRIES = 15;
const LOCAL_HEALTH_RETRY_MS = 2000;

/** Ollama-status apart ophalen — mag falen zonder de lokale beschikbaarheid te raken. */
function checkOllama(): void {
	fetch(`${LOCAL_BACKEND_URL}/health/setup`)
		.then((r) => r.json())
		.then((data) => {
			const models = data.ollama_models ?? {};
			const hasModel = Object.values(models).some((v) => v === true);
			setOllamaAvailable(data.ollama_running && hasModel);
		})
		.catch(() => setOllamaAvailable(false));
}

/** Lokale backend pollen tot hij antwoordt (of de pogingen op zijn). */
function checkLocalBackend(attempt = 0): void {
	fetch(`${LOCAL_BACKEND_URL}/health`)
		.then((r) => r.json())
		.then(() => {
			setLocalAvailable(true);
			checkOllama();
		})
		.catch(() => {
			setLocalAvailable(false);
			setOllamaAvailable(false);
			if (attempt < LOCAL_HEALTH_RETRIES) {
				setTimeout(() => checkLocalBackend(attempt + 1), LOCAL_HEALTH_RETRY_MS);
			}
		});
}

/**
 * Check availability of API and local backends.
 * Called once on page mount — not a reactive effect.
 * On mobile: skips localhost check (unreachable anyway).
 */
export function checkBackendHealth(): void {
	apiFetch('/api/health')
		.then((r) => r.json())
		.then((data) => {
			setMistralAvailable(data.mistral_available ?? false);
			setAssemblyAvailable(data.assemblyai_available ?? false);
		})
		.catch(() => {
			setMistralAvailable(false);
			setAssemblyAvailable(false);
		});

	if (isMobile()) {
		setLocalAvailable(false);
		setOllamaAvailable(false);
		return;
	}

	checkLocalBackend();
}
