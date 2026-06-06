/**
 * IndexedDB wrapper for saving audio recordings locally.
 * Keeps recordings safe if transcription fails or the page refreshes.
 */

const DB_NAME = 'babl-recordings';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

export interface SavedRecording {
	id: string;
	blob: Blob;
	mimeType: string;
	createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveRecording(blob: Blob, mimeType: string): Promise<string> {
	const db = await openDb();
	const id = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const record: SavedRecording = { id, blob, mimeType, createdAt: Date.now() };
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put(record);
		tx.oncomplete = () => resolve(id);
		tx.onerror = () => reject(tx.error);
	});
}

export async function getRecording(id: string): Promise<SavedRecording | undefined> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const request = tx.objectStore(STORE_NAME).get(id);
		request.onsuccess = () => resolve(request.result as SavedRecording | undefined);
		request.onerror = () => reject(request.error);
	});
}

export async function deleteRecording(id: string): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function pruneRecordings(maxCount: number = 5): Promise<void> {
	const db = await openDb();
	const all: SavedRecording[] = await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const request = tx.objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve(request.result as SavedRecording[]);
		request.onerror = () => reject(request.error);
	});
	if (all.length <= maxCount) return;
	// Sort oldest first, delete the extras
	all.sort((a, b) => a.createdAt - b.createdAt);
	const toDelete = all.slice(0, all.length - maxCount);
	const tx = db.transaction(STORE_NAME, 'readwrite');
	for (const rec of toDelete) {
		tx.objectStore(STORE_NAME).delete(rec.id);
	}
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
