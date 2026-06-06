/**
 * AVG/GDPR data management — delete and export local data.
 */

/** Delete all local data: IndexedDB, localStorage (babl* and ph* items), PostHog cookies. */
export async function deleteAllLocalData(): Promise<void> {
	// 1. Clear matching localStorage items
	try {
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && (key.startsWith('babl') || key.startsWith('ph_'))) {
				keysToRemove.push(key);
			}
		}
		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	} catch {
		// localStorage unavailable
	}

	// 2. Delete IndexedDB databases
	try {
		const databases = await indexedDB.databases();
		for (const db of databases) {
			if (db.name) {
				indexedDB.deleteDatabase(db.name);
			}
		}
	} catch {
		// indexedDB.databases() not supported in all browsers
	}

	// 3. Clear PostHog cookies (ph_*)
	try {
		const cookies = document.cookie.split(';');
		for (const cookie of cookies) {
			const name = cookie.split('=')[0].trim();
			if (name.startsWith('ph_')) {
				document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
			}
		}
	} catch {
		// silent fail
	}
}

/** Export all local data as a downloadable JSON file. */
export function exportLocalData(): void {
	const data: Record<string, unknown> = {
		exportDate: new Date().toISOString(),
		localStorage: {} as Record<string, string>,
		cookies: [] as string[]
	};

	// Collect localStorage items
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && (key.startsWith('babl') || key.startsWith('ph_'))) {
				(data.localStorage as Record<string, string>)[key] = localStorage.getItem(key) ?? '';
			}
		}
	} catch {
		// localStorage unavailable
	}

	// Collect relevant cookies
	try {
		const cookies = document.cookie.split(';');
		data.cookies = cookies
			.map((c) => c.trim())
			.filter((c) => c.startsWith('babl') || c.startsWith('ph_'));
	} catch {
		// silent fail
	}

	// Download as JSON
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `babl-data-export-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
