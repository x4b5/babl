import { json } from '@sveltejs/kit';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createToken } from '../../../hooks.server';
import { isRateLimited } from '$lib/server/rate-limit';

/** Constant-time wachtwoordvergelijking (geen lengte-lek dankzij sha256). */
function passwordMatches(input: string, password: string): boolean {
	const a = createHash('sha256').update(input).digest();
	const b = createHash('sha256').update(password).digest();
	return timingSafeEqual(a, b);
}

/**
 * Login voor de desktop-app (Tauri): valideert het wachtwoord en geeft een
 * token terug (i.p.v. een cookie te zetten). De app stuurt dat token daarna
 * mee als `X-Babl-Token`-header bij API-verzoeken. CORS wordt afgehandeld in
 * hooks.server.ts; dit pad staat in PUBLIC_PATHS zodat het zonder token werkt.
 *
 * Dit endpoint is publiek bereikbaar, dus eigen (strenge) rate limiting tegen
 * brute-force — los van de algemene API-limiet.
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (isRateLimited(ip, 5)) {
		return json(
			{ error: 'Te veel pogingen. Wacht even.', error_type: 'rate_limit' },
			{ status: 429 }
		);
	}

	const password = env.ACCESS_PASSWORD;
	if (!password) {
		return json({ error: 'Login niet geconfigureerd.', error_type: 'auth' }, { status: 500 });
	}

	const body = await request.json().catch(() => null);
	const input = body?.password;

	if (!input || typeof input !== 'string' || !passwordMatches(input, password)) {
		return json({ error: 'Onjuist wachtwoord.', error_type: 'auth' }, { status: 401 });
	}

	return json({ token: createToken(password) });
};
