import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { checkBudget, recordUsage } from '$lib/server/budget';

export const config = {
	maxDuration: 60
};

export const POST: RequestHandler = async ({ request }) => {
	const maxTranscriptions = parseInt(env.DAILY_BUDGET_MAX_TRANSCRIPTIONS || '50', 10);
	const maxPolishing = parseInt(env.DAILY_BUDGET_MAX_POLISHING || '100', 10);
	const budget = checkBudget('transcription', { maxTranscriptions, maxPolishing });

	if (!budget.allowed) {
		return new Response(
			JSON.stringify({
				error: 'Dagelijks limiet bereikt. Probeer het morgen opnieuw.',
				error_type: 'rate_limit',
				remaining: 0
			}),
			{ status: 429, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const apiKey = env.ASSEMBLYAI_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'AssemblyAI API key not configured' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const lang = (formData.get('lang') as string) || 'auto';

	if (!file || file.size === 0) {
		return new Response(JSON.stringify({ error: 'Empty audio file' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { AssemblyAI } = await import('assemblyai');
		const client = new AssemblyAI({ apiKey });

		const buffer = Buffer.from(await file.arrayBuffer());

		const langMap: Record<string, string> = { nl: 'nl', li: 'nl', en: 'en' };
		const transcript = await client.transcripts.submit({
			audio: buffer,
			speech_models: ['universal-3-pro', 'universal-2'],
			speaker_labels: true,
			language_detection: lang === 'auto',
			...(lang !== 'auto' && { language_code: langMap[lang] || 'nl' })
		});

		recordUsage('transcription');
		return new Response(JSON.stringify({ transcriptId: transcript.id }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		let errorType = 'server_error';
		if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) errorType = 'rate_limit';
		else if (msg.includes('502') || msg.includes('503')) errorType = 'upstream_disconnect';
		else if (msg.toLowerCase().includes('timeout')) errorType = 'timeout';

		return new Response(JSON.stringify({ error: msg, error_type: errorType }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
