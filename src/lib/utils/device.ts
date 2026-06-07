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
