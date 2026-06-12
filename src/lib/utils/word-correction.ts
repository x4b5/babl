/**
 * Word correction utilities — pure functions for applying inline word
 * corrections to the raw transcript text.
 */

/** Escape regex special characters in a literal string. */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace the nth occurrence (1-based) of a whitespace-delimited token in
 * `text` with `replacement`. Tokens must be bounded by whitespace, line
 * boundaries, or string boundaries so partial matches inside longer words
 * are never replaced. Returns the text unchanged when the nth occurrence
 * does not exist.
 */
export function replaceNthToken(
	text: string,
	token: string,
	n: number,
	replacement: string
): string {
	if (!token || n < 1) return text;
	const pattern = new RegExp(`(^|\\s)(${escapeRegex(token)})(?=\\s|$)`, 'g');
	let count = 0;
	let result = text;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(text)) !== null) {
		count++;
		if (count === n) {
			const start = match.index + match[1].length;
			result = text.slice(0, start) + replacement + text.slice(start + token.length);
			break;
		}
	}
	return result;
}
