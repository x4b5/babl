import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Frankfurt: API-routes verwerken audio/transcripten en moeten binnen de EU draaien
		adapter: adapter({ regions: ['fra1'] }),
		prerender: {
			entries: ['/about', '/privacy', '/cookies', '/voorwaarden', '/verwerkingsovereenkomst']
		}
	}
};

export default config;
