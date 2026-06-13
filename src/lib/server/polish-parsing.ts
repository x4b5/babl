/**
 * Parsing-helpers voor de polijstroute — gescheiden van het endpoint zodat
 * ze testbaar zijn (fragiele JSON-extractie + chunking met overlap).
 */

/**
 * Haalt de gepolijste tekst uit modeloutput. Probeert achtereenvolgens:
 * 1) de hele string als JSON met een `polished`-veld,
 * 2) het eerste JSON-object in de string,
 * 3) de ruwe (getrimde) tekst als fallback.
 */
export function parsePolishingOutput(rawText: string): string {
	try {
		const parsed = JSON.parse(rawText);
		if (parsed.polished) return parsed.polished;
	} catch {
		// continue to attempt 2
	}

	const match = rawText.match(/\{[^{}]*\}/s);
	if (match) {
		try {
			const parsed = JSON.parse(match[0]);
			if (parsed.polished) return parsed.polished;
		} catch {
			// continue to fallback
		}
	}

	return rawText.trim();
}

/**
 * Splitst tekst in chunks van maximaal `maxWords` woorden op zinsgrenzen,
 * met `overlapWords` woorden overlap tussen opeenvolgende chunks.
 */
export function splitIntoChunks(text: string, maxWords = 400, overlapWords = 75): string[] {
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
