import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createToken } from '../../../hooks.server';

/**
 * Login voor de desktop-app (Tauri): valideert het wachtwoord en geeft een
 * token terug (i.p.v. een cookie te zetten). De app stuurt dat token daarna
 * mee als `X-Babl-Token`-header bij API-verzoeken. CORS wordt afgehandeld in
 * hooks.server.ts; dit pad staat in PUBLIC_PATHS zodat het zonder token werkt.
 */
export const POST: RequestHandler = async ({ request }) => {
	const password = env.ACCESS_PASSWORD;
	if (!password) {
		return json({ error: 'Login niet geconfigureerd.', error_type: 'auth' }, { status: 500 });
	}

	const body = await request.json().catch(() => null);
	const input = body?.password;

	if (!input || typeof input !== 'string' || input !== password) {
		return json({ error: 'Onjuist wachtwoord.', error_type: 'auth' }, { status: 401 });
	}

	return json({ token: createToken(password) });
};
