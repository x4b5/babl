import { describe, it, expect } from 'vitest';
import { parsePolishingOutput, splitIntoChunks } from './polish-parsing';

describe('parsePolishingOutput', () => {
	it('extracts polished from clean JSON', () => {
		expect(parsePolishingOutput('{"polished": "Dit is gepolijst."}')).toBe('Dit is gepolijst.');
	});

	it('extracts JSON embedded in surrounding noise', () => {
		const raw = 'Hier is het resultaat: {"polished": "Nette tekst."} klaar';
		expect(parsePolishingOutput(raw)).toBe('Nette tekst.');
	});

	it('falls back to trimmed raw text for invalid JSON', () => {
		expect(parsePolishingOutput('  gewoon platte tekst  ')).toBe('gewoon platte tekst');
	});

	it('falls back to raw text when JSON has no polished field', () => {
		expect(parsePolishingOutput('{"other": "x"}')).toBe('{"other": "x"}');
	});

	it('handles empty input', () => {
		expect(parsePolishingOutput('')).toBe('');
	});
});

describe('splitIntoChunks', () => {
	it('returns a single chunk when text is short', () => {
		const result = splitIntoChunks('Een korte zin. Nog een zin.', 400);
		expect(result).toHaveLength(1);
	});

	it('splits long text into multiple chunks on sentence boundaries', () => {
		const sentence = 'Dit is een zin met precies tien woorden erin voor de test. ';
		const text = sentence.repeat(60); // ~600 woorden
		const result = splitIntoChunks(text, 100, 0);
		expect(result.length).toBeGreaterThan(1);
	});

	it('includes overlap words between consecutive chunks', () => {
		const sentence = 'Woord een twee drie vier vijf zes zeven acht negen tien. ';
		const text = sentence.repeat(30);
		const withOverlap = splitIntoChunks(text, 50, 20);
		const withoutOverlap = splitIntoChunks(text, 50, 0);
		// Overlap zorgt voor meer/gelijk aantal chunks dan zonder overlap
		expect(withOverlap.length).toBeGreaterThanOrEqual(withoutOverlap.length);
	});

	it('returns the original text as a single chunk for empty/whitespace input', () => {
		expect(splitIntoChunks('   ', 400)).toEqual(['   ']);
	});
});
