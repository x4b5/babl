declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;

interface ImportMetaEnv {
	/** Volledige Vercel-URL voor API-routes in de desktop-build. Leeg/undefined op web. */
	readonly VITE_API_BASE_URL?: string;
	/** Build-doel: 'desktop' (Tauri) of anders 'web' (Vercel). */
	readonly VITE_BUILD_TARGET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
