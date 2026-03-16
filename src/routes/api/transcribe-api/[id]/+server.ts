import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const config = {
	maxDuration: 30
};

export const GET: RequestHandler = async ({ params }) => {
	const apiKey = env.ASSEMBLYAI_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'AssemblyAI API key not configured' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { AssemblyAI } = await import('assemblyai');
		const client = new AssemblyAI({ apiKey });

		const transcript = await client.transcripts.get(params.id);

		if (transcript.status === 'error') {
			return new Response(
				JSON.stringify({
					status: 'error',
					error: transcript.error || 'Transcription failed'
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (transcript.status === 'completed') {
			const utterances = transcript.utterances;
			let text = '';

			if (utterances && utterances.length > 0) {
				const segments: string[] = [];
				for (const utterance of utterances) {
					const t = utterance.text.trim();
					if (t) {
						segments.push(`Spreker ${utterance.speaker}: ${t}`);
					}
				}
				text = segments.join('\n');
			} else {
				text = (transcript.text || '').trim();
			}

			return new Response(
				JSON.stringify({
					status: 'completed',
					text,
					language: transcript.language_code || 'nl'
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		}

		// queued or processing
		return new Response(JSON.stringify({ status: transcript.status }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
