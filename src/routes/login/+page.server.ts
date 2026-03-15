import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';
import { createToken } from '../../hooks.server';

const COOKIE_NAME = 'babl_session';
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const password = env.ACCESS_PASSWORD;
		if (!password) {
			throw redirect(303, '/');
		}

		const data = await request.formData();
		const input = data.get('password');

		if (!input || typeof input !== 'string' || input !== password) {
			return fail(400, { incorrect: true });
		}

		const token = createToken(password);
		cookies.set(COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: MAX_AGE
		});

		throw redirect(303, '/');
	}
};
