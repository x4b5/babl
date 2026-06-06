import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['/about', '/privacy', '/cookies', '/voorwaarden', '/verwerkingsovereenkomst']
		}
	}
};

export default config;
