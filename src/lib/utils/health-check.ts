import {
	LOCAL_BACKEND_URL,
	setMistralAvailable,
	setAssemblyAvailable,
	setLocalAvailable
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
		.then(() => setLocalAvailable(true))
		.catch(() => setLocalAvailable(false));
}
