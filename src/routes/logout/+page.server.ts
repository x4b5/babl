import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Delete the session cookie
	cookies.delete('babl_session', { path: '/' });

	// Redirect to login page
	throw redirect(303, '/login');
};
