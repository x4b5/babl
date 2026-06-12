import { describe, it, expect } from 'vitest';
import { replaceNthToken } from './word-correction';

describe('replaceNthToken', () => {
	it('vervangt het eerste voorkomen van een woord', () => {
		expect(replaceNthToken('de kat zit op de mat', 'kat', 1, 'hond')).toBe('de hond zit op de mat');
	});

	it('vervangt het juiste voorkomen bij herhaalde woorden', () => {
		expect(replaceNthToken('de kat zit op de mat', 'de', 2, 'die')).toBe('de kat zit op die mat');
	});

	it('vervangt geen deel van een langer woord', () => {
		expect(replaceNthToken('dezelfde kat de mat', 'de', 1, 'die')).toBe('dezelfde kat die mat');
	});

	it('behoudt leestekens die bij het token horen', () => {
		expect(replaceNthToken('dat is een hoes, zei hij', 'hoes,', 1, 'huis,')).toBe(
			'dat is een huis, zei hij'
		);
	});

	it('werkt over regeleinden heen (sprekerregels)', () => {
		const text = 'Spreker A: dat klopt\nSpreker B: dat klopt niet';
		expect(replaceNthToken(text, 'klopt', 2, 'deugt')).toBe(
			'Spreker A: dat klopt\nSpreker B: dat deugt niet'
		);
	});

	it('geeft de tekst ongewijzigd terug als het voorkomen niet bestaat', () => {
		expect(replaceNthToken('de kat', 'hond', 1, 'poes')).toBe('de kat');
		expect(replaceNthToken('de kat', 'kat', 2, 'poes')).toBe('de kat');
	});

	it('kan een correctie terugdraaien (gecorrigeerd woord terug naar origineel)', () => {
		const corrected = replaceNthToken('de kat zit', 'kat', 1, 'hond');
		expect(replaceNthToken(corrected, 'hond', 1, 'kat')).toBe('de kat zit');
	});

	it('vervangt het eerste woord van de string', () => {
		expect(replaceNthToken('kat zit op de mat', 'kat', 1, 'hond')).toBe('hond zit op de mat');
	});

	it('valt terug op leesteken-tolerante match als het token zonder leesteken is aangeleverd', () => {
		expect(replaceNthToken('ik zie een hond, zei hij', 'hond', 1, 'paard')).toBe(
			'ik zie een paard, zei hij'
		);
	});

	it('leesteken-terugval telt voorkomens consistent', () => {
		expect(replaceNthToken('de hond. nog een hond!', 'hond', 2, 'kat')).toBe(
			'de hond. nog een kat!'
		);
	});

	it('exacte match heeft voorrang boven leesteken-terugval', () => {
		expect(replaceNthToken('hond, en hond', 'hond', 1, 'kat')).toBe('hond, en kat');
	});

	it('ontsnapt regex-speciale tekens in het token', () => {
		expect(replaceNthToken('kost (ongeveer) tien euro', '(ongeveer)', 1, 'circa')).toBe(
			'kost circa tien euro'
		);
	});
});
