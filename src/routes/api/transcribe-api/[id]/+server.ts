import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { ASSEMBLYAI_EU_BASE_URL } from '$lib/server/assemblyai';

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

	// AssemblyAI transcript-IDs zijn alfanumeriek (met streepjes) — weiger al het andere
	if (!/^[a-z0-9-]+$/i.test(params.id)) {
		return new Response(JSON.stringify({ error: 'Ongeldig transcript-ID' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { AssemblyAI } = await import('assemblyai');
		const client = new AssemblyAI({ apiKey, baseUrl: ASSEMBLYAI_EU_BASE_URL });

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

			// Extract word-level confidence for EVAL-02
			const words = (
				((transcript as Record<string, unknown>).words as Array<{
					text: string;
					start: number;
					end: number;
					confidence: number;
					speaker?: string;
				}>) || []
			).map((w) => ({
				text: w.text,
				confidence: w.confidence,
				speaker: w.speaker || undefined
			}));
			const lowConfidenceCount = words.filter((w) => w.confidence < 0.7).length;

			return new Response(
				JSON.stringify({
					status: 'completed',
					text,
					language: transcript.language_code || 'nl',
					words,
					low_confidence_count: lowConfidenceCount
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
		}

		// queued or processing
		return new Response(JSON.stringify({ status: transcript.status }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		let errorType = 'server_error';
		if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) errorType = 'rate_limit';
		else if (msg.includes('502') || msg.includes('503')) errorType = 'upstream_disconnect';
		else if (msg.toLowerCase().includes('timeout')) errorType = 'timeout';

		// Log detail server-side; stuur alleen een generieke melding naar de client
		console.error('[transcribe-api/[id]] error:', msg);
		return new Response(
			JSON.stringify({ error: 'Ophalen transcriptie mislukt.', error_type: errorType }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
