import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		mistral_available: !!env.MISTRAL_API_KEY,
		assemblyai_available: !!env.ASSEMBLYAI_API_KEY
	});
};
