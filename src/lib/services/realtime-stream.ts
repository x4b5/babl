/**
 * Real-time WebSocket streaming service for AssemblyAI transcription.
 * Manages WebSocket connection, reconnection, stall detection, and PCM streaming.
 */

import ReconnectingWebSocket from 'reconnecting-websocket';
import { toPcmInt16 } from '$lib/utils/audio';
import {
	LOCAL_BACKEND_URL,
	setPartialText,
	setLiveWorking,
	setLiveSegments,
	setReconnecting,
	setReconnectStatus,
	setError,
	getTranscribeState
} from '$lib/stores/transcribe.svelte';

const STALL_TIMEOUT_MS = 30000;

let streamSocket: ReconnectingWebSocket | undefined;
let streamStallTimer: ReturnType<typeof setTimeout> | undefined;

function resetStallTimer(): void {
	if (streamStallTimer) clearTimeout(streamStallTimer);
	streamStallTimer = setTimeout(() => {
		setError('Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.');
		stopRealtimeStream();
	}, STALL_TIMEOUT_MS);
}

export function startRealtimeStream(): void {
	const s = getTranscribeState();
	setPartialText('');
	setLiveSegments([]);
	setLiveWorking(false);

	const wsUrl = LOCAL_BACKEND_URL.replace('http', 'ws') + '/ws/transcribe-stream';
	streamSocket = new ReconnectingWebSocket(wsUrl, [], {
		maxRetries: 5,
		maxReconnectionDelay: 10000,
		minReconnectionDelay: 1000,
		reconnectionDelayGrowFactor: 1.3,
		connectionTimeout: 4000,
		minUptime: 5000
	});

	streamSocket.addEventListener('open', () => {
		setReconnecting(false);
		setReconnectStatus('');
		streamSocket!.send(JSON.stringify({ lang: s.lang }));
		resetStallTimer();
	});

	streamSocket.addEventListener('message', (event: MessageEvent) => {
		const s = getTranscribeState();
		let data: { type: string; text?: string; message?: string };
		try {
			data = JSON.parse(event.data);
		} catch {
			return;
		}
		if (data.type === 'ping') {
			streamSocket!.send(JSON.stringify({ type: 'pong' }));
			return;
		}

		if (data.type === 'partial') {
			setPartialText([...s.liveSegments, data.text!].join(' '));
			resetStallTimer();
		} else if (data.type === 'final') {
			setLiveSegments([...s.liveSegments, data.text!]);
			setPartialText([...s.liveSegments].join(' '));
			setLiveWorking(true);
			resetStallTimer();
		} else if (data.type === 'error') {
			setError(`Real-time fout: ${data.message}`);
		}
	});

	streamSocket.addEventListener('error', () => {
		if (streamSocket && streamSocket.retryCount >= 5) {
			setReconnecting(false);
			setReconnectStatus('');
			setError(
				'Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen.'
			);
		} else if (streamSocket) {
			setReconnecting(true);
			setReconnectStatus(
				`Verbinding herstellen (poging ${(streamSocket.retryCount || 0) + 1}/5)...`
			);
		}
	});

	streamSocket.addEventListener('close', () => {});
}

export function stopRealtimeStream(): void {
	if (streamSocket) {
		streamSocket.close();
		streamSocket = undefined;
	}
	setReconnecting(false);
	setReconnectStatus('');
	if (streamStallTimer) {
		clearTimeout(streamStallTimer);
		streamStallTimer = undefined;
	}
}

/** Send a raw audio chunk as PCM int16 over the WebSocket. */
export async function sendChunkToStream(blob: Blob): Promise<void> {
	if (!streamSocket || streamSocket.readyState !== WebSocket.OPEN) return;
	try {
		const pcm = await toPcmInt16(blob);
		streamSocket.send(pcm);
	} catch {
		// PCM conversion failed — skip this chunk
	}
}

/** Get the current stream socket (for cleanup). */
export function getStreamSocket(): ReconnectingWebSocket | undefined {
	return streamSocket;
}

/** Get the current stall timer (for cleanup). */
export function getStreamStallTimer(): ReturnType<typeof setTimeout> | undefined {
	return streamStallTimer;
}
