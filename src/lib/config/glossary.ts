/**
 * Dialect glossaries and few-shot examples for Limburg region variants.
 * Synced from backend/dialects.py REGIONAL_PROFILES.glossary.
 * Per D-09: manual sync acceptable — prompts change rarely.
 */

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

export function formatGlossary(region: string): string {
	const glossary = DIALECT_GLOSSARIES[region] || DIALECT_GLOSSARIES['limburgs'] || {};
	const keys = Object.keys(glossary);
	if (keys.length === 0) return '';
	const lines = Object.entries(glossary).map(([k, v]) => `${k}=${v}`);
	return 'Dialect vertaalsleutel:\n' + lines.join('\n');
}

export function formatFewShotExamples(region: string): string {
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
