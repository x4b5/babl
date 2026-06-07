/**
 * Device detection utility.
 * Used to hide local-mode options on mobile (localhost:8000 is unreachable).
 */
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;

	return (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
		(navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches)
	);
}

export type OS = 'mac' | 'windows' | 'linux';

/**
 * Detect the user's operating system from the browser.
 * Used in the setup wizard to show platform-specific instructions.
 */
export function getOS(): OS {
	if (typeof navigator === 'undefined') return 'mac';

	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes('win')) return 'windows';
	if (ua.includes('mac')) return 'mac';
	return 'linux';
}
