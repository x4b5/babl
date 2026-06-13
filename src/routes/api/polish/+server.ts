import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { MISTRAL_MODELS } from '$lib/config/models';
import {
	SYSTEM_PROMPTS,
	JSON_INSTRUCTION,
	getSystemPrompt,
	buildSpeakerContext
} from '$lib/config/prompts';
import { formatGlossary, formatFewShotExamples } from '$lib/config/glossary';
import { classifyError, polishChunkMistralStream } from '$lib/utils/mistral-stream';
import { checkBudget, recordUsage } from '$lib/server/budget';
import { parsePolishingOutput, splitIntoChunks } from '$lib/server/polish-parsing';

export const config = {
	maxDuration: 300
};

export const POST: RequestHandler = async ({ request }) => {
	const maxTranscriptions = parseInt(env.DAILY_BUDGET_MAX_TRANSCRIPTIONS || '50', 10);
	const maxPolishing = parseInt(env.DAILY_BUDGET_MAX_POLISHING || '100', 10);
	const budget = checkBudget('polishing', { maxTranscriptions, maxPolishing });

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

	const apiKey = env.MISTRAL_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'Mistral API key not configured' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const {
		text,
		language = 'nl',
		quality = 'light',
		temperature = 0.5,
		report_length = 'samenvatting',
		region = 'limburgs',
		speaker_labels,
		subject
	} = body as {
		text?: string;
		language?: string;
		quality?: string;
		temperature?: number;
		report_length?: string;
		region?: string;
		speaker_labels?: Record<string, string>;
		subject?: string;
	};

	if (!text || typeof text !== 'string' || text.trim().length === 0) {
		return new Response(JSON.stringify({ polished: '' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const MAX_TEXT_LENGTH = 50_000;
	if (text.length > MAX_TEXT_LENGTH) {
		return new Response(
			JSON.stringify({
				error: `Tekst te lang (${text.length} tekens, max ${MAX_TEXT_LENGTH})`,
				error_type: 'server_error'
			}),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	let systemPrompt = getSystemPrompt(report_length, speaker_labels, subject);
	let jsonInstr = '';
	if (language === 'li') {
		const glossaryText = formatGlossary(region);
		if (glossaryText) {
			systemPrompt += '\n\n' + glossaryText;
		}
		const examplesText = formatFewShotExamples(region);
		if (examplesText) {
			systemPrompt += '\n\n' + examplesText;
		}
		jsonInstr = JSON_INSTRUCTION;
		systemPrompt += '\n\n' + jsonInstr;
	}
	const useJson = Boolean(jsonInstr);
	const mistralModel = MISTRAL_MODELS['heavy'];
	const chunks = splitIntoChunks(text, 400);
	const fullContext = chunks.length > 1 && chunks.length <= 5 ? text : null;

	recordUsage('polishing');

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const send = (data: Record<string, unknown>) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			try {
				for (const chunk of chunks) {
					if (useJson) {
						let accumulated = '';
						for await (const token of polishChunkMistralStream(
							apiKey,
							chunk,
							language,
							mistralModel,
							fullContext,
							temperature,
							systemPrompt
						)) {
							accumulated += token;
						}
						const polished = parsePolishingOutput(accumulated);
						send({ type: 'token', text: polished });
					} else {
						for await (const token of polishChunkMistralStream(
							apiKey,
							chunk,
							language,
							mistralModel,
							fullContext,
							temperature,
							systemPrompt
						)) {
							send({ type: 'token', text: token });
						}
					}
				}
				send({
					type: 'done',
					ai_metadata: {
						generated_by_ai: true,
						provider: 'mistral',
						model: mistralModel,
						prompt_version: 'v1.0'
					}
				});
			} catch (e) {
				const errMsg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
				console.error('[polish] Mistral error:', errMsg);
				const classified = classifyError(e);
				send({
					type: 'error',
					error_type: classified.errorType,
					message: 'Polijsten mislukt.',
					...(classified.retryAfter !== undefined && { retry_after: classified.retryAfter })
				});
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
