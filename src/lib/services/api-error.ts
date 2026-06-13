/**
 * Gedeelde helpers voor het afhandelen van API-responses.
 * Side-effects (store-mutatie) horen in services, niet in utils — daarom staat dit hier.
 */

import { getUserMessage } from '$lib/utils/error-classifier';
import type { ErrorType } from '$lib/utils/error-types';
import { setError, setErrorType, setStatus, setApiStatus } from '$lib/stores/transcribe.svelte';

/** Maximale body-grootte voor Vercel serverless functions (4 MB). */
export const MAX_VERCEL_BODY_BYTES = 4 * 1024 * 1024;

/** Parseert een response als JSON; geeft undefined bij ongeldige JSON. */
export async function tryParseJson(resp: Response): Promise<{ error?: string } | undefined> {
	try {
		return await resp.json();
	} catch {
		return undefined;
	}
}

/**
 * Leest een gestructureerde API-fout (error_type) uit de response en zet de
 * bijbehorende foutstatus in de store. Geeft true als er een fout is afgehandeld.
 */
export async function tryHandleApiError(resp: Response): Promise<boolean> {
	let body: { error?: string; error_type?: string } | undefined;
	try {
		body = await resp.json();
	} catch {
		return false;
	}
	if (body?.error_type) {
		const detail = body.error ? ` (${body.error})` : '';
		setErrorType(body.error_type as ErrorType);
		setError(getUserMessage(body.error_type as ErrorType) + detail);
		setApiStatus('');
		setStatus('idle');
		return true;
	}
	return false;
}
