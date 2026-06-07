import { redirect, type Handle } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { ACCESS_PASSWORD } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { isRateLimited } from '$lib/server/rate-limit';
import * as Sentry from '@sentry/sveltekit';

if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.VERCEL_ENV || 'development',
		tracesSampleRate: 0.1
	});
}

export const handleError = Sentry.handleErrorWithSentry();

const COOKIE_NAME = 'babl_session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const PUBLIC_PATHS = [
	'/login',
	'/privacy',
	'/cookies',
	'/voorwaarden',
	'/verwerkingsovereenkomst',
	'/about'
];

export function createToken(password: string): string {
	const timestamp = Date.now().toString();
	const hmac = createHmac('sha256', password).update(timestamp).digest('hex');
	return `${timestamp}.${hmac}`;
}

export function verifyToken(token: string, password: string): boolean {
	const parts = token.split('.');
	if (parts.length !== 2) return false;
	const [timestamp, signature] = parts;
	const expected = createHmac('sha256', password).update(timestamp).digest('hex');
	return signature === expected;
}

export const handle: Handle = async ({ event, resolve }) => {
	const password = ACCESS_PASSWORD;
	const path = event.url.pathname;

	// Allow public paths
	if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
		return resolve(event);
	}

	// Check session cookie
	const token = event.cookies.get(COOKIE_NAME);
	if (token) {
		const isValid = verifyToken(token, password);
		if (isValid) {
			// Rate limit API routes
			if (path.startsWith('/api/') && path !== '/api/health') {
				const maxPerMinute = parseInt(env.RATE_LIMIT_PER_MINUTE || '20', 10);
				const ip = event.getClientAddress();
				if (isRateLimited(ip, maxPerMinute)) {
					return new Response(
						JSON.stringify({
							error: 'Te veel verzoeken. Wacht even.',
							error_type: 'rate_limit'
						}),
						{
							status: 429,
							headers: {
								'Content-Type': 'application/json',
								'Retry-After': '60'
							}
						}
					);
				}
			}
			return resolve(event);
		}
		console.warn(`[Auth] Invalid token for ${path}`);
	}

	// Redirect to login
	throw redirect(303, '/login');
};
