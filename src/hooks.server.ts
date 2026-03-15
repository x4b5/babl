import { redirect, type Handle } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { ACCESS_PASSWORD } from '$env/static/private';

const COOKIE_NAME = 'babl_session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const PUBLIC_PATHS = ['/login'];

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

	console.log(`[Hooks] ${event.request.method} ${path}`);

	// Allow public paths
	if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
		console.log(`[Hooks] Public path: ${path}`);
		return resolve(event);
	}

	// Check session cookie
	const token = event.cookies.get(COOKIE_NAME);
	if (token) {
		const isValid = verifyToken(token, password);
		console.log(`[Hooks] Token found, valid: ${isValid}`);
		if (isValid) {
			return resolve(event);
		}
	} else {
		console.log(`[Hooks] No token found`);
	}

	// Redirect to login
	console.log(`[Hooks] Redirecting to /login from ${path}`);
	throw redirect(303, '/login');
};
