import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readSSEStream, type SSEEvent } from './sse-reader';

/** Helper: create a fake Response whose body yields the given chunks. */
function fakeResponse(chunks: string[]): Response {
	let index = 0;
	const reader: ReadableStreamDefaultReader<Uint8Array> = {
		read: async () => {
			if (index >= chunks.length)
				return { done: true, value: undefined } as ReadableStreamReadDoneResult;
			const value = new TextEncoder().encode(chunks[index++]);
			return { done: false, value } as ReadableStreamReadValueResult<Uint8Array>;
		},
		releaseLock: vi.fn(),
		cancel: vi.fn(),
		closed: Promise.resolve(undefined)
	};
	return {
		body: { getReader: () => reader }
	} as unknown as Response;
}

describe('readSSEStream', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('parses a single SSE event', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse(['data: {"type":"segment","text":"hallo"}\n']);

		const result = await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(result).toBe(true);
		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({ type: 'segment', text: 'hallo' });
	});

	it('parses multiple events across chunks', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse([
			'data: {"type":"segment","text":"een"}\n',
			'data: {"type":"segment","text":"twee"}\ndata: {"type":"done"}\n'
		]);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(events).toHaveLength(3);
		expect(events[0].text).toBe('een');
		expect(events[1].text).toBe('twee');
		expect(events[2].type).toBe('done');
	});

	it('handles split chunks (data split across reads)', async () => {
		const events: SSEEvent[] = [];
		// The JSON is split across two chunks
		const resp = fakeResponse(['data: {"type":"seg', 'ment","text":"hallo"}\n']);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({ type: 'segment', text: 'hallo' });
	});

	it('ignores non-data lines', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse([
			'event: transcript\ndata: {"type":"segment","text":"ok"}\nid: 123\n\n'
		]);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('segment');
	});

	it('stops early when onEvent returns "stop"', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse([
			'data: {"type":"error","message":"fail"}\ndata: {"type":"segment","text":"na-error"}\n'
		]);

		const result = await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
				if (e.type === 'error') return 'stop';
			}
		});

		expect(result).toBe(true);
		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('error');
	});

	it('calls onParseError for malformed JSON', async () => {
		const events: SSEEvent[] = [];
		const parseErrors: string[] = [];
		const resp = fakeResponse(['data: not-json\ndata: {"type":"ok"}\n']);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			},
			onParseError: (line) => {
				parseErrors.push(line);
			}
		});

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('ok');
		expect(parseErrors).toHaveLength(1);
		expect(parseErrors[0]).toBe('data: not-json');
	});

	it('continues without crash when onParseError is not provided', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse(['data: {broken\ndata: {"type":"ok"}\n']);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('ok');
	});

	it('handles empty lines gracefully', async () => {
		const events: SSEEvent[] = [];
		const resp = fakeResponse(['\n\ndata: {"type":"ok"}\n\n']);

		await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: (e) => {
				events.push(e);
			}
		});

		expect(events).toHaveLength(1);
	});

	it('returns true when stream ends normally', async () => {
		const resp = fakeResponse([]);

		const result = await readSSEStream(resp, {
			controller: new AbortController(),
			stallTimeoutMs: 5000,
			onEvent: () => {}
		});

		expect(result).toBe(true);
	});
});
