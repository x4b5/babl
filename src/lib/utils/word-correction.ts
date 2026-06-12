/**
 * Word correction utilities — pure functions for applying inline word
 * corrections to the raw transcript text.
 */

/** Escape regex special characters in a literal string. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Punctuation that may trail a token in the raw text while the word list omits it. */
const TRAILING_PUNCT = '.,;:!?…)\\]"\'»';

/**
 * Replace the nth match (1-based) of `pattern` in `text` with `replacement`.
 * The pattern must capture the leading boundary in group 1 and the token in group 2.
 * Returns null when fewer than n matches exist.
 */
function replaceNthMatch(
	text: string,
	pattern: RegExp,
	n: number,
	tokenLength: number,
	replacement: string
): string | null {
	let count = 0;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(text)) !== null) {
		count++;
		if (count === n) {
			const start = match.index + match[1].length;
			return text.slice(0, start) + replacement + text.slice(start + tokenLength);
		}
	}
	return null;
}

/**
 * Replace the nth occurrence (1-based) of a whitespace-delimited token in
 * `text` with `replacement`. Tokens must be bounded by whitespace, line
 * boundaries, or string boundaries so partial matches inside longer words
 * are never replaced.
 *
 * If no exact match exists anywhere (the word list may omit trailing
 * punctuation that the raw text has, e.g. token "hond" vs raw "hond,"),
 * a second pass tolerates trailing punctuation; the punctuation itself is
 * preserved. Returns the text unchanged when the nth occurrence does not exist.
 */
export function replaceNthToken(
	text: string,
	token: string,
	n: number,
	replacement: string
): string {
	if (!token || n < 1) return text;
	const esc = escapeRegex(token);

	const strict = new RegExp(`(^|\\s)(${esc})(?=\\s|$)`, 'g');
	const strictResult = replaceNthMatch(text, strict, n, token.length, replacement);
	if (strictResult !== null) return strictResult;

	// Fallback only when the strict pattern matches nowhere at all, so the
	// occurrence counting never mixes strict and tolerant matches.
	strict.lastIndex = 0;
	if (strict.test(text)) return text;

	const tolerant = new RegExp(`(^|\\s)(${esc})(?=[\\s${TRAILING_PUNCT}]|$)`, 'g');
	return replaceNthMatch(text, tolerant, n, token.length, replacement) ?? text;
}
