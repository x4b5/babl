/**
 * Shared SSE stream reader with stall detection and JSON error recovery.
 * Eliminates duplicated SSE parsing across transcription and polishing flows.
 */

export interface SSEEvent {
	type: string;
	[key: string]: unknown;
}

export interface SSEReaderOptions {
	/** AbortController to cancel the stream. */
	controller: AbortController;
	/** Timeout in ms — abort if no data received within this window. */
	stallTimeoutMs: number;
	/** Called for each parsed SSE event. Return `'stop'` to end reading early. */
	onEvent: (event: SSEEvent) => void | 'stop';
	/** Called when a malformed SSE line cannot be parsed as JSON. */
	onParseError?: (line: string, error: unknown) => void;
}

/**
 * Read an SSE stream from a fetch Response with stall detection.
 * Handles the `data: {...}\n` protocol used by the backend.
 *
 * @returns `true` if the stream completed normally, `false` if aborted or stopped early.
 */
export async function readSSEStream(
	response: Response,
	options: SSEReaderOptions
): Promise<boolean> {
	const { controller, stallTimeoutMs, onEvent, onParseError } = options;
	const reader = response.body!.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	let stallTimeout = setTimeout(() => controller.abort(), stallTimeoutMs);
	const resetStall = () => {
		clearTimeout(stallTimeout);
		stallTimeout = setTimeout(() => controller.abort(), stallTimeoutMs);
	};

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				clearTimeout(stallTimeout);
				return true;
			}
			resetStall();
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				let event: SSEEvent;
				try {
					event = JSON.parse(line.slice(6));
				} catch (parseErr) {
					onParseError?.(line, parseErr);
					continue;
				}
				const result = onEvent(event);
				if (result === 'stop') {
					clearTimeout(stallTimeout);
					return true;
				}
			}
		}
	} finally {
		clearTimeout(stallTimeout);
	}
}
