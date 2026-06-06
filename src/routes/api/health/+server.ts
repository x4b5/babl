import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	let mistralTest = 'not_tested';
	if (env.MISTRAL_API_KEY) {
		try {
			const resp = await fetch('https://api.mistral.ai/v1/models', {
				headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}` }
			});
			mistralTest = resp.ok ? 'ok' : `error_${resp.status}`;
		} catch (e) {
			mistralTest = `fetch_error: ${e instanceof Error ? e.message : String(e)}`;
		}
	}
	return json({
		status: 'ok',
		mistral_available: !!env.MISTRAL_API_KEY,
		mistral_test: mistralTest,
		assemblyai_available: !!env.ASSEMBLYAI_API_KEY
	});
};
