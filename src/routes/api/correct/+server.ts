import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const config = {
	maxDuration: 300
};

const MISTRAL_MODELS: Record<string, string> = {
	light: 'mistral-small-latest',
	medium: 'mistral-large-latest'
};

const SYSTEM_PROMPTS: Record<string, string> = {
	kort:
		'Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n' +
		'JE TAAK:\n' +
		'Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een OPSOMMING van in bulletpoints.\n\n' +
		'1. Lees de volledige tekst om de context en bedoeling te begrijpen.\n' +
		'2. Vertaal dialectwoorden naar standaard Nederlands.\n' +
		'3. Destilleer de kernpunten en presenteer ze als een korte bulletpoint-lijst.\n' +
		'4. Elk bulletpoint is één kernpunt — maximaal één zin.\n' +
		"5. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n\n" +
		'VOORBEELD:\n' +
		"Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en " +
		'toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja ' +
		"doe mós dat eigenlijk neet doon zag hae'\n" +
		'Output:\n' +
		'- Gisteren naar het plein gegaan, mooi weer\n' +
		'- Met Jan gesproken: hij zei dat het niet goed was\n' +
		'- Advies van Jan: dat moet je eigenlijk niet doen\n\n' +
		'REGELS:\n' +
		'- Geef ALLEEN de bulletpoint-lijst terug, geen uitleg of commentaar.\n' +
		"- Gebruik '- ' als bulletpoint-prefix.\n" +
		'- Voeg geen informatie toe die niet in de brontekst staat.\n' +
		'- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n' +
		'- Focus op resultaten en besluiten, niet op procesbeschrijving.',
	middellang:
		'Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n' +
		'JE TAAK:\n' +
		'Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een KORT VERSLAG van.\n' +
		'Focus op resultaten, besluiten en conclusies — niet op het proces.\n\n' +
		'1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n' +
		'2. Schrijf een beknopt, goed leesbaar Nederlands verslag.\n' +
		'3. Focus op WAT er besloten/geconcludeerd is, niet op HOE het gesprek verliep.\n' +
		"4. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n" +
		'5. Maak er lopende, correcte Nederlandse zinnen van.\n' +
		'6. Behoud de toon van de spreker (informeel blijft informeel).\n\n' +
		'VOORBEELD:\n' +
		"Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en " +
		'toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja ' +
		"doe mós dat eigenlijk neet doon zag hae'\n" +
		"Output: 'Gisteren was het mooi weer op het plein. Jan gaf aan dat het niet goed was " +
		"en adviseerde om het niet te doen.'\n\n" +
		'REGELS:\n' +
		'- Geef ALLEEN het verslag terug, geen uitleg of commentaar.\n' +
		'- Voeg geen informatie toe die niet in de brontekst staat.\n' +
		'- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n' +
		'- Kort en bondig. Geen onnodige procesbeschrijving.',
	lang:
		'Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n' +
		'JE TAAK:\n' +
		'Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een UITGEBREIDE VERSLAGLEGGING van.\n\n' +
		'1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n' +
		'2. Schrijf een uitgebreid, goed gestructureerd Nederlands verslag.\n' +
		"3. Gebruik alinea's en indien passend kopjes om het verslag te structureren.\n" +
		'4. Geef alle details weer — ook nuances, context, bijzaken en procesbeschrijving.\n' +
		'5. Beschrijf wie wat zei, welke argumenten er waren, en hoe tot conclusies is gekomen.\n' +
		'6. Vertaal dialectwoorden naar standaard Nederlands.\n' +
		"7. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n" +
		'8. Behoud de toon en stijl van de spreker.\n\n' +
		'VOORBEELD:\n' +
		"Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en " +
		'toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja ' +
		"doe mós dat eigenlijk neet doon zag hae'\n" +
		"Output: 'Gisteren ben ik naar het plein gegaan. Het was mooi weer.\n\n" +
		'Tijdens het bezoek heb ik met Jan gesproken. Hij gaf aan dat de situatie niet goed ' +
		'was en adviseerde nadrukkelijk om het niet te doen. Zijn standpunt was duidelijk: ' +
		"het is eigenlijk geen goede keuze.'\n\n" +
		'REGELS:\n' +
		'- Geef ALLEEN het uitgebreide verslag terug, geen uitleg of commentaar.\n' +
		'- Voeg geen informatie toe die niet in de brontekst staat.\n' +
		'- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n' +
		"- Structureer met alinea's. Gebruik kopjes als de tekst meerdere onderwerpen bevat.\n" +
		'- Wees volledig: beschrijf het proces, de argumenten en de conclusies.'
};

function splitIntoChunks(text: string, maxWords = 400): string[] {
	const sentences = text.trim().split(/(?<=[.!?…])\s+/);
	const chunks: string[] = [];
	let current: string[] = [];
	let currentLen = 0;

	for (const sentence of sentences) {
		const trimmed = sentence.trim();
		if (!trimmed) continue;
		const words = trimmed.split(/\s+/).length;
		if (current.length > 0 && currentLen + words > maxWords) {
			chunks.push(current.join(' '));
			current = [trimmed];
			currentLen = words;
		} else {
			current.push(trimmed);
			currentLen += words;
		}
	}

	if (current.length > 0) chunks.push(current.join(' '));
	return chunks.length > 0 ? chunks : [text];
}

function buildMistralPrompt(
	chunk: string,
	detectedLang: string,
	fullContext: string | null
): string {
	if (fullContext && fullContext !== chunk) {
		return (
			`[Taal: ${detectedLang}]\n\n` +
			`VOLLEDIGE CONTEXT (alleen ter referentie):\n${fullContext}\n\n` +
			`CORRIGEER DIT FRAGMENT:\n${chunk}`
		);
	}
	return `[Taal: ${detectedLang}]\n\n${chunk}`;
}

async function* correctChunkMistralStream(
	apiKey: string,
	chunk: string,
	detectedLang: string,
	mistralModel: string,
	fullContext: string | null,
	temperature: number,
	systemPrompt: string
): AsyncGenerator<string> {
	const { Mistral } = await import('@mistralai/mistralai');
	const client = new Mistral({ apiKey });
	const userPrompt = buildMistralPrompt(chunk, detectedLang, fullContext);
	const wordCount = chunk.split(/\s+/).length;
	const maxTokens = Math.max(512, wordCount * 2);

	const maxRetries = 8;
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const stream = await client.chat.stream({
				model: mistralModel,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				temperature,
				maxTokens
			});

			for await (const event of stream) {
				const token = event.data.choices[0]?.delta?.content;
				if (token && typeof token === 'string') {
					yield token;
				}
			}
			return; // Success
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('429') && attempt < maxRetries - 1) {
				const wait = 3 * Math.pow(2, attempt);
				await new Promise((r) => setTimeout(r, wait * 1000));
			} else {
				throw e;
			}
		}
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.MISTRAL_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'Mistral API key not configured' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const body = await request.json();
	const {
		text,
		language = 'nl',
		quality = 'light',
		temperature = 0.5,
		report_length = 'middellang'
	} = body;

	if (!text) {
		return new Response(JSON.stringify({ corrected: '' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const systemPrompt = SYSTEM_PROMPTS[report_length] || SYSTEM_PROMPTS['middellang'];
	const mistralModel = MISTRAL_MODELS[quality] || MISTRAL_MODELS['light'];
	const chunks = splitIntoChunks(text, 400);
	const fullContext = chunks.length > 1 && chunks.length <= 5 ? text : null;

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const send = (data: Record<string, unknown>) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			try {
				for (const chunk of chunks) {
					for await (const token of correctChunkMistralStream(
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
