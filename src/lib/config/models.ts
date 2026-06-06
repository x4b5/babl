/**
 * Model configuration — single source of truth for model names in the frontend.
 *
 * The backend (Python) maintains its own copy in backend/main.py.
 * The /health endpoint exposes the backend's config as model_config,
 * which the setup-wizard uses at runtime.
 *
 * This file is used by the SvelteKit API route (runs on Vercel)
 * where the local backend is not available.
 */

export const MISTRAL_MODELS: Record<string, string> = {
	light: 'mistral-small-latest',
	medium: 'mistral-small-latest',
	heavy: 'mistral-large-latest'
};
