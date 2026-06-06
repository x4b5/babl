import {
	LOCAL_BACKEND_URL,
	setMistralAvailable,
	setAssemblyAvailable,
	setLocalAvailable,
	setOllamaAvailable
} from '$lib/stores/transcribe.svelte';

/**
 * Check availability of API and local backends.
 * Called once on page mount — not a reactive effect.
 */
export function checkBackendHealth(): void {
	fetch('/api/health')
		.then((r) => r.json())
		.then((data) => {
			setMistralAvailable(data.mistral_available ?? false);
			setAssemblyAvailable(data.assemblyai_available ?? false);
		})
		.catch(() => {
			setMistralAvailable(false);
			setAssemblyAvailable(false);
		});

	fetch(`${LOCAL_BACKEND_URL}/health`)
		.then((r) => r.json())
		.then(() => {
			setLocalAvailable(true);
			// Backend runs — check Ollama status via /health/setup
			return fetch(`${LOCAL_BACKEND_URL}/health/setup`);
		})
		.then((r) => r.json())
		.then((data) => {
			const models = data.ollama_models ?? {};
			const hasModel = Object.values(models).some((v) => v === true);
			setOllamaAvailable(data.ollama_running && hasModel);
		})
		.catch(() => {
			setLocalAvailable(false);
			setOllamaAvailable(false);
		});
}
