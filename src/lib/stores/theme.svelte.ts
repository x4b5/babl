const STORAGE_KEY = 'babl-theme';

type ThemePreference = 'dark' | 'light' | 'system';

let preference = $state<ThemePreference>('system');

function getSystemTheme(): 'dark' | 'light' {
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const resolvedTheme = $derived<'dark' | 'light'>(
	preference === 'system' ? getSystemTheme() : preference
);

function applyTheme(theme: 'dark' | 'light') {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('light', theme === 'light');

	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute('content', theme === 'light' ? '#e8ede9' : '#0f1a14');
	}
}

function loadTheme() {
	if (typeof window === 'undefined') return;

	const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
	if (stored === 'dark' || stored === 'light' || stored === 'system') {
		preference = stored;
	}

	applyTheme(resolvedTheme);

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (preference === 'system') {
			applyTheme(getSystemTheme());
		}
	});
}

function toggle() {
	const next = resolvedTheme === 'dark' ? 'light' : 'dark';
	preference = next;
	localStorage.setItem(STORAGE_KEY, next);
	applyTheme(next);
}

function setTheme(theme: ThemePreference) {
	preference = theme;
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme === 'system' ? getSystemTheme() : theme);
}

export function getThemeState() {
	return {
		get preference() {
			return preference;
		},
		get resolvedTheme() {
			return resolvedTheme;
		},
		toggle,
		setTheme,
		loadTheme
	};
}
