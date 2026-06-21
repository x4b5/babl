import adapterVercel from '@sveltejs/adapter-vercel';
import adapterStatic from '@sveltejs/adapter-static';

// Eén codebase, twee builds. BUILD_TARGET=desktop → statische bestanden voor
// de Tauri-app (heeft geen server). Anders → Vercel (web, met API-routes).
const isDesktop = process.env.BUILD_TARGET === 'desktop';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Desktop: SPA-fallback (alles client-side, geen server).
		// Web: Frankfurt — API-routes verwerken audio/transcripten binnen de EU.
		adapter: isDesktop
			? adapterStatic({ fallback: 'index.html' })
			: adapterVercel({ regions: ['fra1'] }),
		prerender: {
			entries: ['/about', '/privacy', '/cookies', '/voorwaarden', '/verwerkingsovereenkomst']
		}
	}
};

export default config;
