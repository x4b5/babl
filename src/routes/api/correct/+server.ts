import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { ErrorType } from '$lib/utils/error-types';

export const config = {
	maxDuration: 300
};

function classifyError(e: unknown): { errorType: ErrorType; retryAfter?: number } {
	if (e && typeof e === 'object') {
		// Check for HTTP status code on response object
		const statusCode =
			(e as Record<string, unknown>).statusCode ??
			(e as Record<string, unknown>).status ??
			((e as Record<string, unknown>).response as Record<string, unknown> | undefined)?.status;

		if (statusCode === 429) {
			// Try to extract Retry-After from response headers
			const headers = (
				(e as Record<string, unknown>).response as Record<string, unknown> | undefined
			)?.headers;
			const retryAfter = parseRetryAfter(headers);
			return { errorType: 'rate_limit', retryAfter };
		}
		if (statusCode === 502 || statusCode === 503) {
			return { errorType: 'upstream_disconnect' };
		}
	}

	const msg = e instanceof Error ? e.message : String(e);

	if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
		return { errorType: 'rate_limit', retryAfter: 3 };
	}
	if (msg.includes('502') || msg.includes('503') || msg.includes('ECONNREFUSED')) {
		return { errorType: 'upstream_disconnect' };
	}
	if (e instanceof DOMException && e.name === 'AbortError') {
		return { errorType: 'timeout' };
	}
	if (msg.toLowerCase().includes('timeout')) {
		return { errorType: 'timeout' };
	}
	if (
		msg.includes('Failed to fetch') ||
		msg.includes('NetworkError') ||
		msg.includes('ENOTFOUND')
	) {
		return { errorType: 'server_error' };
	}

	return { errorType: 'server_error' };
}

function parseRetryAfter(headers: unknown): number {
	if (!headers || typeof headers !== 'object') return 3;
	const h = headers as Record<string, string>;
	const val = h['retry-after'] || h['Retry-After'] || '';
	if (!val) return 3;

	const asInt = parseInt(val, 10);
	if (!isNaN(asInt)) return Math.max(1, asInt);

	try {
		const retryDate = new Date(val);
		const delta = Math.ceil((retryDate.getTime() - Date.now()) / 1000);
		return Math.max(1, delta);
	} catch {
		return 3;
	}
}

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

// Dialect glossaries (synced from backend/dialects.py REGIONAL_PROFILES.glossary)
// Per D-09: manual sync acceptable — prompts change rarely
const DIALECT_GLOSSARIES: Record<string, Record<string, string>> = {
	limburgs: {
		neet: 'niet',
		sjoon: 'mooi',
		sjoen: 'mooi',
		sjool: 'school',
		maat: 'markt',
		kirk: 'kerk',
		hoes: 'huis',
		nao: 'naar',
		hub: 'heb',
		höbbe: 'hebben',
		vendaog: 'vandaag',
		hiej: 'hier',
		hae: 'hij',
		dae: 'die',
		gaon: 'gaan',
		kómme: 'komen',
		veur: 'voor',
		woor: 'was',
		oet: 'uit',
		efkes: 'even',
		ich: 'ik',
		mich: 'mij',
		dich: 'jou',
		veer: 'wij',
		wae: 'wij',
		geer: 'jullie',
		dao: 'daar',
		heem: 'hem',
		kump: 'komt',
		doon: 'doen',
		kóm: 'kom',
		gekalld: 'gepraat',
		geproat: 'gepraat',
		versjtaon: 'verstaan',
		gegange: 'gegaan',
		sjaol: 'sjaal',
		mert: 'maart',
		han: 'heb',
		höb: 'heb',
		hant: 'hebben',
		hät: 'heeft',
		mäkt: 'maakt',
		boe: 'hoe',
		mie: 'mij',
		die: 'jou',
		us: 'ons',
		groeët: 'groot',
		good: 'goed',
		sjtil: 'stil',
		flot: 'vlot',
		sjtad: 'stad',
		sjtroat: 'straat',
		kènk: 'kind',
		wèrk: 'werk',
		aovend: 'avond',
		mörge: 'morgen',
		zeen: 'zijn',
		wete: 'weten',
		loupe: 'lopen',
		kalle: 'praten',
		kinjer: 'kinderen',
		richtig: 'juist',
		zusamme: 'samen',
		loat: 'laat',
		sjpele: 'spelen',
		gesjpeelt: 'gespeeld'
	},
	mestreechs: {
		iech: 'ik',
		iéch: 'ik',
		miéch: 'mij',
		diéch: 'jou',
		uuch: 'jullie',
		heur: 'haar',
		ziech: 'zich',
		vaan: 'van',
		nao: 'naar',
		sjoen: 'mooi',
		sjun: 'mooi',
		kalle: 'praten',
		loupe: 'lopen',
		höbbe: 'hebben',
		waere: 'zijn',
		kinne: 'kunnen',
		maoge: 'mogen',
		moote: 'moeten',
		sjtroat: 'straat',
		kling: 'klein',
		dök: 'vaak',
		dankewaal: 'dankjewel',
		sjampetter: 'champignons',
		bin: 'ben',
		mörge: 'morgen',
		hub: 'heb',
		dao: 'daar',
		mien: 'mijn',
		vrundin: 'vriendin',
		getroffe: 'getroffen',
		mót: 'moet',
		dees: 'deze',
		sjnel: 'snel',
		oppe: 'op het',
		pakke: 'pakken',
		vuur: 'voordat',
		geit: 'gaat',
		et: 'het',
		zeen: 'zijn',
		vinje: 'vinden',
		gisteraovend: 'gisteravond',
		mit: 'met',
		geloupe: 'gelopen',
		hoes: 'huis',
		sjat: 'schat',
		groeët: 'groot',
		good: 'goed',
		sjtil: 'stil',
		flot: 'vlot',
		hiej: 'hier',
		oet: 'uit',
		mèt: 'met',
		zónger: 'zonder',
		naor: 'naar',
		ieëder: 'ieder',
		aafies: 'misschien',
		dink: 'ding',
		nörges: 'nergens',
		hiel: 'heel',
		aon: 'aan',
		sjriëve: 'schrijven',
		leze: 'lezen',
		waore: 'waren',
		sjpele: 'spelen',
		sjlaon: 'slaan',
		vroge: 'vragen',
		vraoge: 'vragen',
		antjwaorde: 'antwoorden',
		ajuu: 'adieu',
		adiees: 'adieu',
		asjeblieft: 'alsjeblieft',
		gaon: 'gaan',
		kómme: 'komen',
		meziek: 'muziek',
		ènne: 'een',
		Mestreech: 'Maastricht',
		Sjlaansen: 'Schlaensen'
	},
	zittesj: {
		ich: 'ik',
		mich: 'mij',
		dich: 'jou',
		ós: 'ons',
		uur: 'jullie',
		richtig: 'juist',
		zusamme: 'samen',
		sjpraoke: 'spreken',
		kump: 'komt',
		geit: 'gaat',
		hant: 'hebben',
		wees: 'wist',
		zoot: 'zat',
		sjtraot: 'straat',
		kinjer: 'kinderen',
		neet: 'niet',
		hiej: 'hier',
		nao: 'naar',
		höb: 'heb',
		bitte: 'alsjeblieft',
		wirklich: 'werkelijk',
		han: 'heb',
		gedoon: 'gedaan',
		plötzlich: 'plotseling',
		geseen: 'gezien',
		woor: 'was',
		good: 'goed',
		vaan: 'van',
		Zitterd: 'Sittard',
		altied: 'altijd',
		mit: 'met',
		heur: 'haar',
		inne: 'in het',
		kirchof: 'kerkhof',
		hub: 'heb',
		gaon: 'gaan',
		kómme: 'komen',
		höbbe: 'hebben',
		zeen: 'zijn',
		sjtad: 'stad',
		hoes: 'huis',
		kirk: 'kerk',
		sjool: 'school',
		maat: 'markt',
		sjtroat: 'straat',
		kènk: 'kind',
		aovend: 'avond',
		groeët: 'groot',
		kling: 'klein',
		sjtil: 'stil',
		flot: 'vlot',
		veur: 'voor',
		oet: 'uit',
		efkes: 'even',
		dao: 'daar',
		heem: 'hem',
		mörge: 'morgen',
		mie: 'mij',
		die: 'jou',
		us: 'ons',
		dees: 'deze',
		boe: 'hoe',
		waas: 'was',
		waat: 'wat',
		woe: 'waar',
		wuruum: 'waarom',
		sjoen: 'mooi',
		dök: 'vaak',
		nöit: 'nooit',
		altiëd: 'altijd',
		oppe: 'op het',
		sjun: 'mooi',
		gekalld: 'gepraat'
	},
	venloos: {
		mich: 'mij',
		dich: 'jou',
		waas: 'was',
		mótte: 'moeten',
		ouch: 'ook',
		gans: 'heel',
		höbbe: 'hebben',
		kómme: 'komen',
		neet: 'niet',
		hoes: 'huis',
		kirk: 'kerk',
		nao: 'naar',
		hiej: 'hier',
		hub: 'heb',
		gaon: 'gaan',
		sjtroat: 'straat',
		loupe: 'lopen',
		veur: 'voor',
		sjoen: 'mooi',
		gister: 'gisteren',
		inne: 'in de',
		sjtad: 'stad',
		geloupe: 'gelopen',
		dao: 'daar',
		drök: 'druk',
		kènk: 'kinderen',
		zeen: 'zijn',
		sjpele: 'spelen',
		woor: 'was',
		oet: 'uit',
		efkes: 'even',
		sjool: 'school',
		maat: 'markt',
		aovend: 'avond',
		mörge: 'morgen',
		good: 'goed',
		groeët: 'groot',
		kling: 'klein',
		sjtil: 'stil',
		flot: 'vlot',
		heem: 'hem',
		mie: 'mij',
		die: 'jou',
		us: 'ons',
		dees: 'deze',
		boe: 'hoe',
		waat: 'wat',
		woe: 'waar',
		wuruum: 'waarom',
		dök: 'vaak',
		nöit: 'nooit',
		altiëd: 'altijd',
		oppe: 'op het',
		mèt: 'met',
		zónger: 'zonder',
		höb: 'heb',
		sjun: 'mooi',
		vaan: 'van',
		gegange: 'gegaan',
		versjtaon: 'verstaan',
		kalle: 'praten'
	},
	kirchroeadsj: {
		iech: 'ik',
		miéch: 'mij',
		diéch: 'jou',
		"d'r": 'de',
		hant: 'hebben',
		han: 'heb',
		junt: 'gaan',
		koame: 'komen',
		zage: 'zeggen',
		wisse: 'weten',
		mure: 'morgen',
		uvver: 'over',
		wasser: 'water',
		tsimmer: 'kamer',
		sjtraos: 'straat',
		jonge: 'jongen',
		meëdsje: 'meisje',
		hoeëg: 'hoog',
		ós: 'ons',
		sjpas: 'pret',
		neet: 'niet',
		plat: 'dialect',
		gegosse: 'gegoten',
		woor: 'was',
		gesjpeelt: 'gespeeld',
		mit: 'met',
		nao: 'naar',
		Kirchröa: 'Kerkrade',
		wier: 'weer',
		trök: 'terug',
		inne: 'in de',
		kirchof: 'kerkhof',
		deep: 'diep',
		hiej: 'hier',
		höb: 'heb',
		hub: 'heb',
		gaon: 'gaan',
		kómme: 'komen',
		höbbe: 'hebben',
		zeen: 'zijn',
		sjtad: 'stad',
		hoes: 'huis',
		kirk: 'kerk',
		sjool: 'school',
		maat: 'markt',
		sjtroat: 'straat',
		kènk: 'kind',
		aovend: 'avond',
		good: 'goed',
		groeët: 'groot',
		kling: 'klein',
		sjtil: 'stil',
		flot: 'vlot',
		veur: 'voor',
		oet: 'uit',
		efkes: 'even',
		dao: 'daar',
		heem: 'hem',
		mörge: 'morgen',
		mie: 'mij',
		die: 'jou',
		us: 'ons',
		dees: 'deze',
		boe: 'hoe',
		waas: 'was',
		waat: 'wat',
		woe: 'waar',
		wuruum: 'waarom',
		sjoen: 'mooi',
		dök: 'vaak',
		nöit: 'nooit',
		altiëd: 'altijd',
		hät: 'heeft',
		vaan: 'van',
		gegange: 'gegaan',
		versjtaon: 'verstaan',
		kalle: 'praten',
		loupe: 'lopen',
		sjpele: 'spelen'
	}
};

// Few-shot examples per region (synced from backend/dialects.py)
interface FewShotExample {
	input: string;
	output: { original: string; corrected: string; applied_rules?: string[] };
}

const FEW_SHOT_EXAMPLES: Record<string, FewShotExample[]> = {
	limburgs: [
		{
			input: 'Ich hub gister nao de maat gegange en dao woor het sjoen weer.',
			output: {
				original: 'Ich hub gister nao de maat gegange en dao woor het sjoen weer.',
				corrected: 'Ik heb gisteren naar de markt gegaan en daar was het mooi weer.',
				applied_rules: [
					'ich=ik',
					'hub=heb',
					'nao=naar',
					'gegange=gegaan',
					'dao=daar',
					'woor=was',
					'sjoen=mooi'
				]
			}
		},
		{
			input: 'De kinjer höbbe vanoavend efkes oet de sjtroat gesjpeelt.',
			output: {
				original: 'De kinjer höbbe vanoavend efkes oet de sjtroat gesjpeelt.',
				corrected: 'De kinderen hebben vanavond even uit de straat gespeeld.'
			}
		},
		{
			input: 'Wae mótte nao hoes gaon want het is al loat en veer zeen moe.',
			output: {
				original: 'Wae mótte nao hoes gaon want het is al loat en veer zeen moe.',
				corrected: 'Wij moeten naar huis gaan want het is al laat en wij zijn moe.'
			}
		}
	],
	mestreechs: [
		{
			input: 'Iech bin vaan de mörge nao de Vrijthof gegange en hub dao mien vrundin getroffe.',
			output: {
				original:
					'Iech bin vaan de mörge nao de Vrijthof gegange en hub dao mien vrundin getroffe.',
				corrected: 'Ik ben vanmorgen naar de Vrijthof gegaan en heb daar mijn vriendin getroffen.'
			}
		},
		{
			input: 'Uuch mót dees sjampetter sjnel oppe trottoir pakke vuur et kapot geit.',
			output: {
				original: 'Uuch mót dees sjampetter sjnel oppe trottoir pakke vuur et kapot geit.',
				corrected:
					'Jullie moeten deze champignons snel op het trottoir pakken voordat het kapot gaat.',
				applied_rules: [
					'uuch=jullie',
					'mót=moet',
					'dees=deze',
					'sjampetter=champignons',
					'oppe=op het',
					'vuur=voordat',
					'geit=gaat'
				]
			}
		},
		{
			input: 'Mien heur kalle good Mestreechs en ziech waere dök aan de Maas te vinje.',
			output: {
				original: 'Mien heur kalle good Mestreechs en ziech waere dök aan de Maas te vinje.',
				corrected: 'Mijn haar spreekt goed Maastrichts en zij zijn vaak aan de Maas te vinden.'
			}
		},
		{
			input: 'Iech höbbe gisteraovend mit de paraplu geloupe vaan Sjlaansen nao hoes toe.',
			output: {
				original: 'Iech höbbe gisteraovend mit de paraplu geloupe vaan Sjlaansen nao hoes toe.',
				corrected: 'Ik heb gisteravond met de paraplu gelopen van Schlaensen naar huis toe.'
			}
		}
	],
	zittesj: [
		{
			input: 'Ich han dat richtig zusamme mit de kinjer gedoon bitte.',
			output: {
				original: 'Ich han dat richtig zusamme mit de kinjer gedoon bitte.',
				corrected: 'Ik heb dat goed samen met de kinderen gedaan alsjeblieft.',
				applied_rules: [
					'ich=ik',
					'han=heb',
					'richtig=goed/juist',
					'zusamme=samen',
					'kinjer=kinderen',
					'gedoon=gedaan',
					'bitte=alsjeblieft'
				]
			}
		},
		{
			input: 'Ós uur höb plötzlich geseen dat wirklich neet good woor.',
			output: {
				original: 'Ós uur höb plötzlich geseen dat wirklich neet good woor.',
				corrected: 'Onze jullie hebben plotseling gezien dat werkelijk niet goed was.'
			}
		},
		{
			input: 'De vrouw kump vaan Zitterd en sjpraoke altied Zittesj mit heur kinjer inne kirchof.',
			output: {
				original:
					'De vrouw kump vaan Zitterd en sjpraoke altied Zittesj mit heur kinjer inne kirchof.',
				corrected:
					'De vrouw komt van Sittard en spreekt altijd Sittards met haar kinderen in het kerkhof.'
			}
		}
	],
	venloos: [
		{
			input: 'Ik mótte gans gauw nao Venlo toe want de Maas is ouch sjoen vandaag.',
			output: {
				original: 'Ik mótte gans gauw nao Venlo toe want de Maas is ouch sjoen vandaag.',
				corrected: 'Ik moet heel gauw naar Venlo toe want de Maas is ook mooi vandaag.'
			}
		},
		{
			input: 'Mich en dich höbbe gister inne sjtad geloupe en dao waas het drök.',
			output: {
				original: 'Mich en dich höbbe gister inne sjtad geloupe en dao waas het drök.',
				corrected: 'Mij en jou hebben gisteren in de stad gelopen en daar was het druk.',
				applied_rules: [
					'mich=mij',
					'dich=jou',
					'höbbe=hebben',
					'inne=in de',
					'sjtad=stad',
					'geloupe=gelopen',
					'dao=daar',
					'waas=was'
				]
			}
		},
		{
			input: 'De kènk zeen hiej veur de kirk en sjpele ouch aan de sjtroat.',
			output: {
				original: 'De kènk zeen hiej veur de kirk en sjpele ouch aan de sjtroat.',
				corrected: 'De kinderen zijn hier voor de kerk en spelen ook aan de straat.'
			}
		}
	],
	kirchroeadsj: [
		{
			input: "Iech han mure d'r wasser uvver inne tsimmer gegosse want het woor zo hoeëg.",
			output: {
				original: "Iech han mure d'r wasser uvver inne tsimmer gegosse want het woor zo hoeëg.",
				corrected: 'Ik heb morgen het water over in de kamer gegoten want het was zo hoog.',
				applied_rules: [
					'iech=ik',
					'han=heb',
					'mure=morgen',
					"d'r=het",
					'wasser=water',
					'uvver=over',
					'inne=in de',
					'tsimmer=kamer',
					'gegosse=gegoten',
					'woor=was',
					'hoeëg=hoog'
				]
			}
		},
		{
			input: "De jonge en d'r meëdsje hant inne kirchof gesjpeelt mit plat sjpas.",
			output: {
				original: "De jonge en d'r meëdsje hant inne kirchof gesjpeelt mit plat sjpas.",
				corrected: 'De jongen en het meisje hebben in het kerkhof gespeeld met dialect pret.'
			}
		},
		{
			input: 'Ós junt mure nao Kirchröa toe en koame dan wier trök.',
			output: {
				original: 'Ós junt mure nao Kirchröa toe en koame dan wier trök.',
				corrected: 'Ons gaan morgen naar Kerkrade toe en komen dan weer terug.'
			}
		},
		{
			input: "D'r wisse neet wat iech zage uvver de deep sjtraos van Kirchröa.",
			output: {
				original: "D'r wisse neet wat iech zage uvver de deep sjtraos van Kirchröa.",
				corrected: 'Hij wist niet wat ik zeg over de diepe straat van Kerkrade.'
			}
		}
	]
};

const JSON_INSTRUCTION =
	'OUTPUT FORMAT:\n' +
	'Geef je antwoord terug als een JSON object met deze structuur:\n' +
	'{\n' +
	'  "original": "<originele tekst>",\n' +
	'  "corrected": "<gecorrigeerde tekst in standaard Nederlands>"\n' +
	'}\n\n' +
	'Geef ALLEEN het JSON object terug, geen andere tekst.';

function formatGlossary(region: string): string {
	const glossary = DIALECT_GLOSSARIES[region] || DIALECT_GLOSSARIES['limburgs'] || {};
	const keys = Object.keys(glossary);
	if (keys.length === 0) return '';
	const lines = Object.entries(glossary).map(([k, v]) => `${k}=${v}`);
	return 'Dialect vertaalsleutel:\n' + lines.join('\n');
}

function formatFewShotExamples(region: string): string {
	const examples = FEW_SHOT_EXAMPLES[region] || FEW_SHOT_EXAMPLES['limburgs'] || [];
	if (examples.length === 0) return '';
	let formatted = 'VOORBEELDEN (volg dit formaat exact):\n\n';
	examples.forEach((ex, i) => {
		formatted += `Voorbeeld ${i + 1}:\n`;
		formatted += `Input: ${ex.input}\n`;
		formatted += `Output:\n${JSON.stringify(ex.output, null, 2)}\n\n`;
	});
	return formatted;
}

function parseCorrectionOutput(rawText: string): string {
	// Attempt 1: Direct JSON parse
	try {
		const parsed = JSON.parse(rawText);
		if (parsed.corrected) return parsed.corrected;
	} catch {
		// continue to attempt 2
	}

	// Attempt 2: Extract JSON from surrounding text
	const match = rawText.match(/\{[^{}]*\}/s);
	if (match) {
		try {
			const parsed = JSON.parse(match[0]);
			if (parsed.corrected) return parsed.corrected;
		} catch {
			// continue to fallback
		}
	}

	// Attempt 3: Fallback to raw text
	return rawText.trim();
}

function splitIntoChunks(text: string, maxWords = 400, overlapWords = 75): string[] {
	const sentences = text.trim().split(/(?<=[.!?…])\s+/);
	const sentData: { text: string; words: number }[] = [];
	for (const s of sentences) {
		const trimmed = s.trim();
		if (trimmed) sentData.push({ text: trimmed, words: trimmed.split(/\s+/).length });
	}
	if (sentData.length === 0) return [text];

	const chunks: string[] = [];
	let current: { text: string; words: number }[] = [];
	let currentLen = 0;

	for (const sent of sentData) {
		if (current.length > 0 && currentLen + sent.words > maxWords) {
			chunks.push(current.map((s) => s.text).join(' '));
			// Carry overlap sentences
			if (overlapWords > 0) {
				const overlap: { text: string; words: number }[] = [];
				let overlapLen = 0;
				for (let i = current.length - 1; i >= 0; i--) {
					if (overlapLen + current[i].words > overlapWords) break;
					overlap.unshift(current[i]);
					overlapLen += current[i].words;
				}
				current = [...overlap];
				currentLen = overlapLen;
			} else {
				current = [];
				currentLen = 0;
			}
			current.push(sent);
			currentLen += sent.words;
		} else {
			current.push(sent);
			currentLen += sent.words;
		}
	}

	if (current.length > 0) chunks.push(current.map((s) => s.text).join(' '));
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

	const maxAttempts = 5;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
			const classified = classifyError(e);
			const isRetryable =
				classified.errorType === 'rate_limit' || classified.errorType === 'upstream_disconnect';

			if (isRetryable && attempt < maxAttempts - 1) {
				const backoff = Math.min(30, Math.pow(2, attempt)) + Math.random() * 2;
				const wait = classified.retryAfter ? Math.max(backoff, classified.retryAfter) : backoff;
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
		report_length = 'middellang',
		region = 'limburgs'
	} = body;

	if (!text) {
		return new Response(JSON.stringify({ corrected: '' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	let systemPrompt = SYSTEM_PROMPTS[report_length] || SYSTEM_PROMPTS['middellang'];
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
					if (useJson) {
						// JSON mode: accumulate all tokens, parse, emit corrected text
						let accumulated = '';
						for await (const token of correctChunkMistralStream(
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
						const corrected = parseCorrectionOutput(accumulated);
						send({ type: 'token', text: corrected });
					} else {
						// Standard mode: stream tokens directly
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
				}
				send({ type: 'done' });
			} catch (e) {
				console.error('[correct] Mistral error:', e instanceof Error ? e.message : e);
				const classified = classifyError(e);
				send({
					type: 'error',
					error_type: classified.errorType,
					message: e instanceof Error ? e.message : String(e),
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
