import { redirect, type Handle } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ACCESS_PASSWORD } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { isRateLimited } from '$lib/server/rate-limit';
import * as Sentry from '@sentry/sveltekit';

if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.VERCEL_ENV || 'development',
		tracesSampleRate: 0.1,
		// Privacy: strip request bodies/cookies — kunnen transcriptie-inhoud bevatten
		beforeSend(event) {
			if (event.request) {
				delete event.request.data;
				delete event.request.cookies;
				if (event.request.headers) {
					delete event.request.headers['cookie'];
					delete event.request.headers['authorization'];
				}
			}
			return event;
		}
	});
}

export const handleError = Sentry.handleErrorWithSentry();

const COOKIE_NAME = 'babl_session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const MAX_AGE_MS = MAX_AGE * 1000;
const PUBLIC_PATHS = [
	'/login',
	'/api/desktop-login',
	'/privacy',
	'/cookies',
	'/voorwaarden',
	'/verwerkingsovereenkomst',
	'/about'
];

// De desktop-app (Tauri) draait onder een eigen origin en authenticeert met een
// header-token i.p.v. een cookie. Deze origins mogen /api cross-origin aanroepen.
const DESKTOP_ORIGINS = ['tauri://localhost', 'http://tauri.localhost'];

function corsHeaders(origin: string): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, X-Babl-Token',
		'Access-Control-Max-Age': '86400'
	};
}

export function createToken(password: string): string {
	const timestamp = Date.now().toString();
	const hmac = createHmac('sha256', password).update(timestamp).digest('hex');
	return `${timestamp}.${hmac}`;
}

export function verifyToken(token: string, password: string): boolean {
	const parts = token.split('.');
	if (parts.length !== 2) return false;
	const [timestamp, signature] = parts;

	// Weiger verlopen tokens (ouder dan MAX_AGE)
	const issuedAt = Number.parseInt(timestamp, 10);
	if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) return false;

	const expected = createHmac('sha256', password).update(timestamp).digest('hex');
	const sigBuf = Buffer.from(signature, 'hex');
	const expBuf = Buffer.from(expected, 'hex');
	// Lengtecheck vóór timingSafeEqual (gooit anders bij ongelijke lengte)
	if (sigBuf.length !== expBuf.length) return false;
	return timingSafeEqual(sigBuf, expBuf);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Desktop-build (Tauri) heeft geen server en geen publieke origin:
	// de login-poort is daar zinloos. Doorlaten zodat de statische
	// fallback-pagina gebouwd kan worden (anders 303 → /login).
	if (process.env.BUILD_TARGET === 'desktop') {
		return resolve(event);
	}

	const password = ACCESS_PASSWORD;
	const path = event.url.pathname;
	const origin = event.request.headers.get('origin') ?? '';
	const isApi = path.startsWith('/api/');
	const fromDesktop = DESKTOP_ORIGINS.includes(origin);

	// CORS preflight (OPTIONS) van de desktop-app op /api: direct beantwoorden.
	if (isApi && fromDesktop && event.request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders(origin) });
	}

	// Basale beveiligingsheaders op elke respons; CORS erbij voor de desktop-app.
	event.setHeaders({
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'microphone=(self), camera=(), geolocation=()',
		...(isApi && fromDesktop ? corsHeaders(origin) : {})
	});

	// Allow public paths
	if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
		return resolve(event);
	}

	// Auth via session-cookie (web) of via header-token (desktop-app).
	const cookieToken = event.cookies.get(COOKIE_NAME);
	const headerToken = event.request.headers.get('x-babl-token') ?? undefined;
	const validToken =
		(!!cookieToken && verifyToken(cookieToken, password)) ||
		(!!headerToken && verifyToken(headerToken, password));

	if (validToken) {
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
	if (cookieToken || headerToken) {
		console.warn(`[Auth] Invalid token for ${path}`);
	}

	// Desktop-app verwacht JSON (geen redirect naar het HTML-loginscherm).
	if (isApi && fromDesktop) {
		return new Response(JSON.stringify({ error: 'Niet ingelogd.', error_type: 'auth' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
		});
	}

	// Redirect to login
	throw redirect(303, '/login');
};
