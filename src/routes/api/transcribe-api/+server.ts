import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const config = {
	maxDuration: 300
};

export const POST: RequestHandler = async ({ request }) => {
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

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const send = (data: Record<string, unknown>) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			try {
				const { AssemblyAI } = await import('assemblyai');
				const client = new AssemblyAI({ apiKey });

				// Upload the file
				const buffer = Buffer.from(await file.arrayBuffer());

				const langMap: Record<string, string> = { nl: 'nl', li: 'nl', en: 'en' };
				const transcript = await client.transcripts.transcribe({
					audio: buffer,
					speaker_labels: true,
					language_detection: lang === 'auto',
					...(lang !== 'auto' && { language_code: langMap[lang] || 'nl' })
				});

				if (transcript.status === 'error') {
					send({ type: 'error', message: transcript.error || 'Transcription failed' });
					controller.close();
					return;
				}

				const detectedLang = transcript.language_code || 'nl';
				send({ type: 'info', language: detectedLang });

				const utterances = transcript.utterances;
				if (utterances && utterances.length > 0) {
					for (const utterance of utterances) {
						const text = utterance.text.trim();
						if (text) {
							send({ type: 'segment', text, speaker: utterance.speaker });
						}
					}
				} else {
					const text = (transcript.text || '').trim();
					if (text) {
						send({ type: 'segment', text });
					}
				}

				send({ type: 'done' });
			} catch (e) {
				send({ type: 'error', message: e instanceof Error ? e.message : String(e) });
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'X-Accel-Buffering': 'no'
		}
	});
};
