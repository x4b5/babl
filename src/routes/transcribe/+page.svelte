<script lang="ts">
	import ReconnectingWebSocket from 'reconnecting-websocket';
	import { deduplicateSegments } from '$lib/utils/dedup';
	import type { TranscriptionSegment } from '$lib/utils/dedup';

	const LOCAL_BACKEND_URL = 'http://localhost:8000';

	type Status = 'idle' | 'preparing' | 'recording' | 'processing' | 'correcting';

	let status = $state<Status>('idle');
	let countdown = $state(0);
	let raw = $state('');
	let corrected = $state('');
	let language = $state('');
	let error = $state('');
	let elapsed = $state(0);
	let copiedRaw = $state(false);
	let copiedCorrected = $state(false);
	let correctedExpanded = $state(false);
	let quality = $state<'light' | 'medium'>('light');
	let lang = $state<'auto' | 'nl' | 'li' | 'en'>('li');
	let mode = $state<'local' | 'api'>('local');
	let reportLength = $state<'kort' | 'middellang' | 'lang'>('middellang');
	let transcribeMode = $state<'local' | 'api'>('local');
	let apiStreamMode = $state<'realtime' | 'accurate'>('realtime');
	let streamSocket: ReconnectingWebSocket | undefined;
	let temperature = $state(0.5);
	let reconnecting = $state(false);
	let reconnectStatus = $state('');
	let streamStallTimer: ReturnType<typeof setTimeout> | undefined;
	let mistralAvailable = $state(false);
	let assemblyAvailable = $state(false);
	let localAvailable = $state(false);
	let privacyOpen = $state(false);
	let rawExpanded = $state(false);
	let keepDialect = $state(false);

	let partialText = $state('');
	let liveInterval: ReturnType<typeof setInterval> | undefined;
	let liveWorking = $state(false);

	// Incremental live transcription state
	let liveSegments = $state<string[]>([]);
	let lastSentChunkIndex = $state(0);
	let liveAudioDuration = $state(0); // seconds of audio already confirmed
	let lastSegmentEnd = $state(0); // Last confirmed segment end time for dedup (OF-03)
	const OVERLAP_CHUNKS = 6; // 3 seconds overlap at 500ms per chunk
	const CHUNK_INTERVAL_MS = 500; // MediaRecorder timeslice
	const SSE_STALL_TIMEOUT_MS = 30000; // 30s: abort SSE stream if no data received (EH-03)

	let mediaRecorder: MediaRecorder | undefined;
	let chunks: Blob[] = [];
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	let fileInput: HTMLInputElement;

	// Audio visualizer state
	let audioContext: AudioContext | undefined;
	let analyser: AnalyserNode | undefined;
	let waveformBars = $state<number[]>(new Array(40).fill(3));
	let animationFrameId: number | undefined;

	let processingElapsed = $state(0);
	let processingTimerInterval: ReturnType<typeof setInterval> | undefined;
	let recordingDuration = $state(0);

	const formattedTime = $derived.by(() => {
		const mins = Math.floor(elapsed / 60);
		const secs = elapsed % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	});

	const formattedProcessingTime = $derived.by(() => {
		const mins = Math.floor(processingElapsed / 60);
		const secs = processingElapsed % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	});

	// mlx-whisper on Apple Silicon ≈ faster than real-time
	const estimatedProcessingTime = $derived(Math.max(5, Math.ceil(recordingDuration * 0.5)));
	const processingProgress = $derived(
		Math.min(95, Math.round((processingElapsed / estimatedProcessingTime) * 100))
	);

	const RECORDING_MAX_SECONDS = 60 * 60; // 60 minuten max
	const RECORDING_WARN_SECONDS = 50 * 60; // waarschuwing bij 50 minuten

	const recordingWarning = $derived.by(() => {
		if (status !== 'recording') return '';
		if (elapsed >= RECORDING_WARN_SECONDS) {
			const remaining = Math.max(0, RECORDING_MAX_SECONDS - elapsed);
			const mins = Math.floor(remaining / 60);
			const secs = remaining % 60;
			return `Nog ${mins}:${String(secs).padStart(2, '0')} tot maximale opnameduur`;
		}
		return '';
	});

	// AssemblyAI cost: $0.17/hour (Universal-2 $0.15 + speaker diarization $0.02)
	const ASSEMBLYAI_COST_PER_SECOND = 0.17 / 3600;
	const estimatedTranscribeCost = $derived.by(() => {
		const seconds = status === 'recording' ? elapsed : recordingDuration;
		return (seconds * ASSEMBLYAI_COST_PER_SECOND).toFixed(4);
	});

	// Mistral cost per 1M tokens (input/output):
	// mistral-small-latest: $0.06 / $0.18
	// mistral-large-latest: $2.00 / $6.00
	// Estimate: ~1.3 tokens per word, output ≈ same length as input
	const MISTRAL_COST_PER_WORD: Record<string, number> = {
		light: ((0.06 + 0.18) * 1.3) / 1_000_000, // ~$0.000000312/word
		medium: ((2.0 + 6.0) * 1.3) / 1_000_000 // ~$0.0000104/word
	};
	const REPORT_LENGTH_FACTOR: Record<string, number> = {
		kort: 0.3,
		middellang: 1,
		lang: 1.5
	};
	const estimatedCorrectionCost = $derived.by(() => {
		const wordCount = raw ? raw.split(/\s+/).length : 0;
		const costPerWord = MISTRAL_COST_PER_WORD[quality] ?? MISTRAL_COST_PER_WORD['light'];
		const lengthFactor = REPORT_LENGTH_FACTOR[reportLength] ?? 1;
		return (wordCount * costPerWord * lengthFactor).toFixed(4);
	});

	$effect(() => {
		if (status === 'recording') {
			elapsed = 0;
			timerInterval = setInterval(() => {
				elapsed += 1;
			}, 1000);
		} else if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}
		return () => {
			if (timerInterval) clearInterval(timerInterval);
		};
	});

	$effect(() => {
		if (status === 'processing') {
			processingElapsed = 0;
			processingTimerInterval = setInterval(() => {
				processingElapsed += 1;
			}, 1000);
		} else if (processingTimerInterval) {
			clearInterval(processingTimerInterval);
			processingTimerInterval = undefined;
		}
		return () => {
			if (processingTimerInterval) clearInterval(processingTimerInterval);
		};
	});

	// Auto-stop recording at max duration
	$effect(() => {
		if (status === 'recording' && elapsed >= RECORDING_MAX_SECONDS) {
			stopRecording();
		}
	});

	// Keyboard shortcut: spacebar to toggle recording
	$effect(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.code === 'Space' && e.target === document.body) {
				e.preventDefault();
				toggleRecording();
			}
		}
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	// Health check: detect API availability (SvelteKit routes) + local backend
	$effect(() => {
		// Check SvelteKit API routes (works on Vercel + local)
		fetch('/api/health')
			.then((r) => r.json())
			.then((data) => {
				mistralAvailable = data.mistral_available ?? false;
				assemblyAvailable = data.assemblyai_available ?? false;
			})
			.catch(() => {
				mistralAvailable = false;
				assemblyAvailable = false;
			});

		// Check local backend (Whisper + Ollama)
		fetch(`${LOCAL_BACKEND_URL}/health`)
			.then((r) => r.json())
			.then(() => {
				localAvailable = true;
			})
			.catch(() => {
				localAvailable = false;
			});
	});

	function getSupportedMimeType(): string {
		for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']) {
			if (MediaRecorder.isTypeSupported(type)) return type;
		}
		return '';
	}

	/** Downsample audio blob to 16kHz mono WAV — Whisper doesn't need more. */
	async function downsampleToWav(blob: Blob): Promise<Blob> {
		const TARGET_RATE = 16000;
		const ctx = new OfflineAudioContext(1, 1, TARGET_RATE);
		const arrayBuffer = await blob.arrayBuffer();
		const decoded = await ctx.decodeAudioData(arrayBuffer);

		// Render to 16kHz mono
		const offline = new OfflineAudioContext(
			1,
			Math.ceil(decoded.duration * TARGET_RATE),
			TARGET_RATE
		);
		const source = offline.createBufferSource();
		source.buffer = decoded;
		source.connect(offline.destination);
		source.start();
		const rendered = await offline.startRendering();

		// Encode as WAV
		const pcm = rendered.getChannelData(0);
		const wavBuffer = encodeWav(pcm, TARGET_RATE);
		return new Blob([wavBuffer], { type: 'audio/wav' });
	}

	function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
		const len = samples.length;
		const buffer = new ArrayBuffer(44 + len * 2);
		const view = new DataView(buffer);

		function writeString(offset: number, str: string) {
			for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
		}

		writeString(0, 'RIFF');
		view.setUint32(4, 36 + len * 2, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true); // PCM
		view.setUint16(22, 1, true); // mono
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * 2, true); // byte rate
		view.setUint16(32, 2, true); // block align
		view.setUint16(34, 16, true); // bits per sample
		writeString(36, 'data');
		view.setUint32(40, len * 2, true);

		for (let i = 0; i < len; i++) {
			const s = Math.max(-1, Math.min(1, samples[i]));
			view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		return buffer;
	}

	/** Convert audio blob to raw 16kHz mono PCM Int16 LE bytes for AssemblyAI streaming. */
	async function toPcmInt16(blob: Blob): Promise<ArrayBuffer> {
		const TARGET_RATE = 16000;
		const arrayBuffer = await blob.arrayBuffer();
		const ctx = new OfflineAudioContext(1, 1, TARGET_RATE);
		const decoded = await ctx.decodeAudioData(arrayBuffer);

		const offline = new OfflineAudioContext(
			1,
			Math.ceil(decoded.duration * TARGET_RATE),
			TARGET_RATE
		);
		const source = offline.createBufferSource();
		source.buffer = decoded;
		source.connect(offline.destination);
		source.start();
		const rendered = await offline.startRendering();

		const samples = rendered.getChannelData(0);
		const pcmBuffer = new ArrayBuffer(samples.length * 2);
		const view = new DataView(pcmBuffer);
		for (let i = 0; i < samples.length; i++) {
			const s = Math.max(-1, Math.min(1, samples[i]));
			view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		return pcmBuffer;
	}

	function startWaveform(stream: MediaStream) {
		audioContext = new AudioContext();
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 128;
		const source = audioContext.createMediaStreamSource(stream);
		source.connect(analyser);

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		function updateBars() {
			if (!analyser) return;
			analyser.getByteFrequencyData(dataArray);
			const barCount = 40;
			const step = Math.floor(bufferLength / barCount);
			const newBars: number[] = [];
			for (let i = 0; i < barCount; i++) {
				const value = dataArray[i * step] || 0;
				newBars.push(Math.max(3, (value / 255) * 48));
			}
			waveformBars = newBars;
			animationFrameId = requestAnimationFrame(updateBars);
		}
		updateBars();
	}

	function stopWaveform() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = undefined;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = undefined;
			analyser = undefined;
		}
		waveformBars = new Array(40).fill(3);
	}

	let liveBusy = false;

	async function sendLiveChunk() {
		if (liveBusy || chunks.length === 0 || !mediaRecorder) return;
		// Nothing new to send
		if (chunks.length <= lastSentChunkIndex) return;
		liveBusy = true;
		try {
			const mimeType = mediaRecorder.mimeType;
			// Send only NEW chunks (with overlap for Whisper context)
			const sendFrom = Math.max(0, lastSentChunkIndex - OVERLAP_CHUNKS);
			const blob = new Blob(chunks.slice(sendFrom), { type: mimeType });
			const wav = await downsampleToWav(blob);

			const formData = new FormData();
			formData.append('file', wav, 'live.wav');
			formData.append('lang', lang);
			formData.append('offset', String(liveAudioDuration));

			console.log(
				`Live chunk: sending chunks ${sendFrom}-${chunks.length} (${(wav.size / 1024).toFixed(0)}KB, offset=${liveAudioDuration.toFixed(1)}s)`
			);

			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
				method: 'POST',
				body: formData
			});
			if (resp.ok) {
				const data = await resp.json();
				if (data.language) language = data.language;
				const segments: TranscriptionSegment[] = data.segments || [];
				if (segments.length > 0) {
					// Timestamp-based deduplication (OF-03, D-06)
					const { unique, newLastSegmentEnd } = deduplicateSegments(segments, lastSegmentEnd);

					if (unique.length > 0) {
						const newText = unique.map((s) => s.text).join(' ');
						partialText = partialText ? `${partialText} ${newText}` : newText;
						liveWorking = true;
						lastSegmentEnd = newLastSegmentEnd;
						liveAudioDuration = unique[unique.length - 1].end;
					}
				}
				lastSentChunkIndex = chunks.length;
			}
		} catch (e) {
			console.warn('Live chunk failed:', e);
		} finally {
			liveBusy = false;
		}
	}

	let liveRunning = false;

	function startLiveTranscription() {
		partialText = '';
		liveWorking = false;
		liveBusy = false;
		liveRunning = true;
		lastSentChunkIndex = 0;
		liveAudioDuration = 0;
		lastSegmentEnd = 0; // Reset dedup tracking
		liveLoop();
	}

	async function liveLoop() {
		while (liveRunning) {
			// Wait at least 5s between sends, collecting audio
			await new Promise((r) => setTimeout(r, 5000));
			if (!liveRunning) break;
			await sendLiveChunk();
		}
	}

	function stopLiveTranscription() {
		liveRunning = false;
	}

	/** Start real-time WebSocket streaming to AssemblyAI. */
	function startRealtimeStream() {
		partialText = '';
		liveSegments = [];
		liveWorking = false;

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
			console.log('[RT] WebSocket connected');
			reconnecting = false;
			reconnectStatus = '';
			streamSocket!.send(JSON.stringify({ lang }));

			// Start stall detection timer
			if (streamStallTimer) clearTimeout(streamStallTimer);
			streamStallTimer = setTimeout(() => {
				error =
					'Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.';
				stopRealtimeStream();
			}, 30000);
		});

		streamSocket.addEventListener('message', (event: MessageEvent) => {
			const data = JSON.parse(event.data);

			if (data.type === 'ping') {
				streamSocket!.send(JSON.stringify({ type: 'pong' }));
				return;
			}

			if (data.type === 'partial') {
				// Partial = work-in-progress, overwrite
				partialText = [...liveSegments, data.text].join(' ');
				// Reset stall timer on data
				if (streamStallTimer) clearTimeout(streamStallTimer);
				streamStallTimer = setTimeout(() => {
					error =
						'Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.';
					stopRealtimeStream();
				}, 30000);
			} else if (data.type === 'final') {
				// Final = confirmed segment, append
				liveSegments = [...liveSegments, data.text];
				partialText = liveSegments.join(' ');
				liveWorking = true;
				// Reset stall timer on data
				if (streamStallTimer) clearTimeout(streamStallTimer);
				streamStallTimer = setTimeout(() => {
					error =
						'Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.';
					stopRealtimeStream();
				}, 30000);
			} else if (data.type === 'error') {
				console.error('[RT] Error:', data.message);
				error = `Real-time fout: ${data.message}`;
			}
		});

		streamSocket.addEventListener('error', () => {
			console.error('[RT] WebSocket error');
			if (streamSocket && streamSocket.retryCount >= 5) {
				reconnecting = false;
				reconnectStatus = '';
				error =
					'Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen.';
			} else if (streamSocket) {
				reconnecting = true;
				reconnectStatus = `Verbinding herstellen (poging ${(streamSocket.retryCount || 0) + 1}/5)...`;
			}
		});

		streamSocket.addEventListener('close', () => {
			console.log('[RT] WebSocket closed');
		});
	}

	/** Stop real-time WebSocket streaming. */
	function stopRealtimeStream() {
		if (streamSocket) {
			streamSocket.close();
			streamSocket = undefined;
		}
		reconnecting = false;
		reconnectStatus = '';
		if (streamStallTimer) {
			clearTimeout(streamStallTimer);
			streamStallTimer = undefined;
		}
	}

	/** Send a MediaRecorder chunk as PCM via WebSocket. */
	async function sendChunkToStream(blob: Blob) {
		if (!streamSocket || streamSocket.readyState !== WebSocket.OPEN) return;
		try {
			const pcm = await toPcmInt16(blob);
			streamSocket.send(pcm);
		} catch (e) {
			console.error('[RT] PCM conversion error:', e);
		}
	}

	async function startRecording() {
		error = '';
		try {
			const mimeType = getSupportedMimeType();
			if (!mimeType) {
				error = 'Je browser ondersteunt geen audio-opname.';
				return;
			}
			status = 'preparing';
			countdown = 2;
			const countdownTimer = setInterval(() => {
				countdown -= 1;
				if (countdown <= 0) clearInterval(countdownTimer);
			}, 1000);

			await new Promise((resolve) => setTimeout(resolve, 2000));
			if (status !== 'preparing') return; // Cancelled

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, { mimeType });
			chunks = [];

			startWaveform(stream);

			const useRealtimeStream = transcribeMode === 'api' && apiStreamMode === 'realtime';

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
					if (useRealtimeStream) {
						sendChunkToStream(e.data);
					}
				}
			};

			mediaRecorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				stopWaveform();
				stopLiveTranscription();
				stopRealtimeStream();
				recordingDuration = elapsed;
				if (chunks.length === 0) {
					error = 'Geen audio opgenomen. Probeer langer op te nemen.';
					status = 'idle';
					return;
				}
				const blob = new Blob(chunks, { type: mimeType });

				// Real-time API streaming: use accumulated segments
				if (useRealtimeStream && liveSegments.length > 0) {
					raw = liveSegments.join(' ');
					partialText = '';
					status = 'idle';
					return;
				}

				if (transcribeMode === 'local') {
					// Use accumulated live transcription if available
					if (partialText) {
						// Send only the remaining unprocessed audio for the final chunk
						if (lastSentChunkIndex < chunks.length) {
							status = 'processing';
							try {
								const sendFrom = Math.max(0, lastSentChunkIndex - OVERLAP_CHUNKS);
								const remainingBlob = new Blob(chunks.slice(sendFrom), { type: mimeType });
								const wav = await downsampleToWav(remainingBlob);
								console.log(
									`Final chunk: sending remaining chunks ${sendFrom}-${chunks.length} (${(wav.size / 1024).toFixed(0)}KB)`
								);
								const formData = new FormData();
								formData.append('file', wav, 'final.wav');
								formData.append('lang', lang);
								formData.append('offset', String(liveAudioDuration));

								const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
									method: 'POST',
									body: formData
								});
								if (resp.ok) {
									const data = await resp.json();
									if (data.language) language = data.language;
									const segments = data.segments || [];
									if (segments.length > 0) {
										const newText = segments.map((s: { text: string }) => s.text).join(' ');
										partialText = `${partialText} ${newText}`;
									}
								}
							} catch {
								// Use what we have
							}
						}
						raw = partialText;
						partialText = '';
						status = 'idle';
						return;
					}

					status = 'processing';

					// No live text available — send full audio for final transcription
					try {
						const wav = await downsampleToWav(blob);
						console.log(
							`Final transcription: sending full audio (${(wav.size / 1024).toFixed(0)}KB)`
						);
						const formData = new FormData();
						formData.append('file', wav, 'final.wav');
						formData.append('lang', lang);

						const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
							method: 'POST',
							body: formData
						});
						if (resp.ok) {
							const data = await resp.json();
							if (data.text) {
								raw = data.text;
								if (data.language) language = data.language;
								partialText = '';
								status = 'idle';
								return;
							}
						}
					} catch {
						// Fall through to SSE transcription
					}
				}

				// Fallback: full SSE transcription
				try {
					const wav = await downsampleToWav(blob);
					console.log(
						`Downsampled: ${(blob.size / 1024).toFixed(0)}KB → ${(wav.size / 1024).toFixed(0)}KB`
					);
					await sendAudio(wav, 'recording.wav');
				} catch {
					// Fallback: send original if downsampling fails
					const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
					await sendAudio(blob, `recording.${ext}`);
				}
				partialText = '';
			};

			mediaRecorder.start(500);
			status = 'recording';
			if (useRealtimeStream) {
				startRealtimeStream();
			} else if (transcribeMode === 'local') {
				startLiveTranscription();
			}
		} catch {
			error = 'Microfoon niet beschikbaar. Controleer je browserpermissies.';
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
			status = 'processing';
		}
	}

	function toggleRecording() {
		if (status === 'recording') {
			stopRecording();
		} else if (status === 'idle') {
			startRecording();
		} else if (status === 'preparing') {
			status = 'idle';
			countdown = 0;
		}
	}

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		error = '';
		status = 'processing';
		try {
			const wav = await downsampleToWav(file);
			console.log(
				`Downsampled upload: ${(file.size / 1024).toFixed(0)}KB → ${(wav.size / 1024).toFixed(0)}KB`
			);
			await sendAudio(wav, 'upload.wav');
		} catch {
			// Fallback: send original if downsampling fails
			await sendAudio(file, file.name);
		}
		input.value = '';
	}

	let apiStatus = $state('');

	async function sendAudio(blob: Blob, filename: string) {
		raw = '';
		corrected = '';
		error = '';
		apiStatus = '';
		console.log(`Sending audio: ${filename}, size: ${blob.size} bytes, type: ${blob.type}`);
		if (blob.size === 0) {
			error = 'Audio-bestand is leeg. Probeer opnieuw.';
			status = 'idle';
			return;
		}
		status = 'processing';

		const formData = new FormData();
		formData.append('file', blob, filename);
		formData.append('lang', lang);

		if (transcribeMode === 'api') {
			await sendAudioApi(formData);
		} else {
			await sendAudioLocal(formData);
		}
	}

	async function sendAudioApi(formData: FormData) {
		try {
			// Step 1: Submit audio, get transcript ID
			apiStatus = 'Uploaden...';
			const submitResp = await fetch('/api/transcribe-api', {
				method: 'POST',
				body: formData
			});

			if (!submitResp.ok) {
				const detail = await submitResp.text();
				throw new Error(detail || `Server error ${submitResp.status}`);
			}

			const { transcriptId, error: submitError } = await submitResp.json();
			if (submitError) throw new Error(submitError);

			// Step 2: Poll for completion
			apiStatus = 'Wachtrij...';
			const POLL_INTERVAL = 3000;
			const MAX_POLL_TIME = 60 * 60 * 1000; // 60 minutes max
			const startTime = Date.now();

			while (true) {
				if (Date.now() - startTime > MAX_POLL_TIME) {
					throw new Error('Transcriptie duurde te lang (>60 min).');
				}

				await new Promise((r) => setTimeout(r, POLL_INTERVAL));

				const pollResp = await fetch(`/api/transcribe-api/${transcriptId}`);
				if (!pollResp.ok) {
					const detail = await pollResp.text();
					throw new Error(detail || `Poll error ${pollResp.status}`);
				}

				const result = await pollResp.json();
				const elapsedMs = Date.now() - startTime;
				const elapsedMin = Math.floor(elapsedMs / 60000);
				const WARN_AT_MIN = 45;

				if (result.status === 'queued') {
					apiStatus =
						elapsedMin >= WARN_AT_MIN
							? `Wachtrij... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
							: 'Wachtrij...';
				} else if (result.status === 'processing') {
					apiStatus =
						elapsedMin >= WARN_AT_MIN
							? `Verwerken... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
							: 'Verwerken...';
				} else if (result.status === 'completed') {
					raw = result.text || '';
					language = result.language || '';
					apiStatus = '';
					status = 'idle';
					return;
				} else if (result.status === 'error') {
					throw new Error(result.error || 'Transcriptie mislukt');
				}
			}
		} catch (e) {
			if (e instanceof TypeError) {
				error = 'API niet bereikbaar. Controleer je internetverbinding.';
			} else {
				error = `Fout: ${e instanceof Error ? e.message : String(e)}`;
			}
			apiStatus = '';
			status = 'idle';
		}
	}

	async function sendAudioLocal(formData: FormData) {
		const controller = new AbortController();
		let stallTimeout = setTimeout(() => controller.abort(), SSE_STALL_TIMEOUT_MS);

		const resetStallTimeout = () => {
			clearTimeout(stallTimeout);
			stallTimeout = setTimeout(() => controller.abort(), SSE_STALL_TIMEOUT_MS);
		};

		try {
			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
				method: 'POST',
				body: formData,
				signal: controller.signal
			});

			if (!resp.ok) {
				const detail = await resp.text();
				throw new Error(detail || `Server error ${resp.status}`);
			}

			// Read SSE stream — segments arrive one by one
			const reader = resp.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					clearTimeout(stallTimeout);
					break;
				}
				resetStallTimeout(); // Reset 30s timeout on each chunk received

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const event = JSON.parse(line.slice(6));

					if (event.type === 'info') {
						language = event.language || '';
					} else if (event.type === 'segment') {
						let segmentText = event.text;
						if (event.speaker) {
							segmentText = `Spreker ${event.speaker}: ${event.text}`;
						}
						raw = raw ? `${raw}\n${segmentText}` : segmentText;
					} else if (event.type === 'error') {
						throw new Error(event.message);
					}
				}
			}

			status = 'idle';
		} catch (e) {
			clearTimeout(stallTimeout);
			if (e instanceof DOMException && e.name === 'AbortError') {
				error =
					'Transcriptie reageert niet meer. Controleer of de backend draait en probeer opnieuw.';
			} else if (e instanceof TypeError) {
				error = 'Lokale backend niet bereikbaar. Start de server op localhost:8000.';
			} else {
				error = `Fout: ${e instanceof Error ? e.message : String(e)}`;
			}
			status = 'idle';
		}
	}

	function startCorrection() {
		if (!raw) return;
		corrected = '';
		correctedExpanded = false;
		status = 'correcting';
		fetchCorrection(raw, lang, quality);
	}

	async function fetchCorrection(text: string, lang: string, qual: string) {
		const body = {
			text,
			language: lang,
			quality: qual,
			mode,
			temperature,
			report_length: reportLength,
			keep_dialect: keepDialect
		};
		console.log('Correction request:', {
			report_length: body.report_length,
			mode: body.mode,
			quality: body.quality
		});
		const correctUrl = body.mode === 'api' ? '/api/correct' : `${LOCAL_BACKEND_URL}/correct`;

		const controller = new AbortController();
		let stallTimeout = setTimeout(() => controller.abort(), SSE_STALL_TIMEOUT_MS);

		const resetStallTimeout = () => {
			clearTimeout(stallTimeout);
			stallTimeout = setTimeout(() => controller.abort(), SSE_STALL_TIMEOUT_MS);
		};

		try {
			const resp = await fetch(correctUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: controller.signal
			});

			if (!resp.ok) {
				console.error('Correction failed:', resp.status);
				error = 'Verslaglegging mislukt (rate limit of serverfout). Probeer het opnieuw.';
				corrected = '';
				status = 'idle';
				return;
			}

			// Read SSE stream — tokens arrive one by one
			const reader = resp.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					clearTimeout(stallTimeout);
					break;
				}
				resetStallTimeout(); // Reset 30s timeout on each chunk received

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const event = JSON.parse(line.slice(6));

					if (event.type === 'token') {
						corrected += event.text;
					} else if (event.type === 'done') {
						// Streaming complete
					} else if (event.type === 'error') {
						throw new Error(event.message);
					}
				}
			}

			if (!corrected) corrected = text;
		} catch (e) {
			clearTimeout(stallTimeout);
			if (e instanceof DOMException && e.name === 'AbortError') {
				console.error('Correction timeout: no data for 30s');
				error =
					'Verslaglegging duurt te lang — probeer een korter fragment of herstart de backend.';
			} else {
				console.error('Correction error:', e);
				error = 'Verslaglegging mislukt. Controleer of de backend draait.';
			}
			corrected = '';
		} finally {
			status = 'idle';
		}
	}

	async function copyText(text: string, which: 'raw' | 'corrected') {
		await navigator.clipboard.writeText(text);
		if (which === 'raw') {
			copiedRaw = true;
			setTimeout(() => (copiedRaw = false), 1500);
		} else {
			copiedCorrected = true;
			setTimeout(() => (copiedCorrected = false), 1500);
		}
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="bg-dark-gradient min-h-screen">
	<!-- Floating orbs -->
	<div class="floating-orb orb-violet"></div>
	<div class="floating-orb orb-indigo"></div>
	<div class="floating-orb orb-cyan"></div>
	<div class="floating-orb orb-fuchsia"></div>

	<div class="mx-auto max-w-3xl px-4 py-6 sm:py-16">
		<!-- Header -->
		<header class="mb-6 sm:mb-12 text-center animate-fade-in">
			<h1
				class="gradient-text mb-2 sm:mb-4 text-5xl font-normal tracking-tighter sm:text-8xl md:text-9xl select-none"
			>
				<span class="inline-block hover:animate-letter-bounce">B</span><span
					class="inline-block hover:animate-letter-bounce">A</span
				><span class="inline-block hover:animate-letter-bounce">B</span><span
					class="inline-block hover:animate-letter-bounce">L</span
				>
			</h1>
			<p class="mb-3 sm:mb-4 text-xs sm:text-lg text-white/50">
				Spraak naar tekst met Limburgse dialectcorrectie
			</p>
			<div class="flex items-center justify-center gap-2">
				<span
					class="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium text-white/60"
				>
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
					Privacy-bewust
				</span>
				<a
					href="/logout"
					class="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
				>
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					Uitloggen
				</a>
			</div>
		</header>

		<!-- Language toggle -->
		<div class="mb-4 sm:mb-8 flex flex-col items-center gap-3 animate-fade-in">
			<div
				class="glass flex flex-wrap justify-center rounded-2xl sm:rounded-full p-1 w-full sm:w-auto"
			>
				{#each [{ value: 'auto', label: 'Standaard' }, { value: 'nl', label: 'Nederlands' }, { value: 'li', label: 'Limburgs' }, { value: 'en', label: 'Engels' }] as opt}
					<button
						onclick={() => (lang = opt.value as typeof lang)}
						class="flex-1 sm:flex-none rounded-xl sm:rounded-full px-3 py-2 text-xs sm:px-5 sm:py-2 sm:text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {lang ===
						opt.value
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/50 hover:text-white/80 scale-100'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Transcribe mode toggle -->
		<div class="mb-4 flex flex-col items-center gap-2 animate-fade-in w-full sm:w-auto">
			<div class="glass flex rounded-full p-1 w-full sm:w-auto">
				<button
					onclick={() => (transcribeMode = 'local')}
					disabled={!localAvailable}
					class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
					'local'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Lokaal
				</button>
				<button
					onclick={() => (transcribeMode = 'api')}
					disabled={!assemblyAvailable}
					class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
					'api'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					API
				</button>
			</div>
			{#if transcribeMode === 'api'}
				<div class="glass inline-flex rounded-full p-1">
					<button
						onclick={() => (apiStreamMode = 'realtime')}
						class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {apiStreamMode ===
						'realtime'
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/50 hover:text-white/80 scale-100'}"
					>
						Real-time
					</button>
					<button
						onclick={() => (apiStreamMode = 'accurate')}
						class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {apiStreamMode ===
						'accurate'
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/50 hover:text-white/80 scale-100'}"
					>
						Nauwkeurig
					</button>
				</div>
				<p class="text-xs text-white/40">
					{apiStreamMode === 'realtime'
						? 'AssemblyAI — live streaming (geen sprekerdetectie)'
						: 'AssemblyAI — batch met sprekerdetectie'}
				</p>
			{/if}
		</div>

		<!-- Record button -->
		<div class="mb-6 sm:mb-10 flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
			<div class="relative">
				<!-- Pulse rings during recording -->
				{#if status === 'recording'}
					<div class="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring"></div>
					<div
						class="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring"
						style="animation-delay: 0.5s"
					></div>
					<div
						class="absolute inset-0 rounded-full bg-red-500/15 animate-pulse-ring"
						style="animation-delay: 1s"
					></div>
				{/if}

				<!-- Conic gradient spinning border -->
				<div
					class="conic-border {status === 'preparing'
						? 'conic-border-preparing'
						: status === 'recording'
							? 'conic-border-recording'
							: status === 'processing'
								? 'conic-border-processing'
								: ''}"
				>
					<button
						onclick={toggleRecording}
						disabled={status === 'processing'}
						class="relative z-10 flex h-24 w-24 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-[#0a0a0f] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
							{status === 'recording'
							? 'animate-pulse-glow'
							: status === 'idle' || status === 'correcting'
								? 'hover:scale-[1.08] hover:shadow-[0_0_60px_rgba(212,255,0,0.4)]'
								: ''}"
					>
						{#if status === 'preparing'}
							<!-- Countdown -->
							<span class="animate-countdown text-3xl sm:text-4xl font-bold text-amber-400">
								{countdown}
							</span>
						{:else if status === 'recording'}
							<!-- Stop icon -->
							<svg
								class="h-8 w-8 sm:h-12 sm:w-12 text-red-400"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<rect x="6" y="6" width="12" height="12" rx="2" />
							</svg>
						{:else if status === 'processing'}
							<!-- Spinner -->
							<svg
								class="h-8 w-8 sm:h-12 sm:w-12 text-white/60 animate-spin-slow"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						{:else}
							<!-- Mic icon -->
							<svg
								class="h-8 w-8 sm:h-12 sm:w-12 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Live audio waveform visualizer -->
			{#if status === 'recording'}
				<div class="waveform-container animate-fade-in">
					{#each waveformBars as height}
						<div class="waveform-bar" style="height: {height}px"></div>
					{/each}
				</div>

				<!-- Reconnection banner -->
				{#if reconnecting || reconnectStatus}
					<div
						class="w-full max-w-xl animate-fade-in rounded-lg border border-white/12 px-4 py-3"
						style="background: rgba(255, 255, 255, 0.08); border-left: 4px solid {reconnecting
							? 'var(--color-neon)'
							: '#ef4444'};"
					>
						<div class="flex items-center gap-3">
							{#if reconnecting}
								<svg
									class="h-4 w-4 animate-spin text-white/70"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									></path>
								</svg>
							{/if}
							<span class="text-sm text-white/80">
								{reconnectStatus ||
									'Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen.'}
							</span>
						</div>
					</div>
				{/if}

				<!-- Live transcription preview -->
				{#if partialText}
					<div class="glass rounded-2xl p-4 w-full max-w-xl animate-fade-in">
						<div class="flex items-center gap-2 mb-2">
							<span class="inline-block h-2 w-2 rounded-full bg-neon animate-pulse"></span>
							<span class="text-xs font-medium text-white/50">Live transcriptie</span>
						</div>
						<p class="text-sm text-white/70 leading-relaxed max-h-32 overflow-y-auto">
							{partialText}
						</p>
					</div>
				{/if}
			{/if}

			<!-- Status text under button -->
			{#if status === 'preparing'}
				<div class="flex items-center gap-2 text-amber-400 font-medium animate-fade-in">
					<span class="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
					Maak je klaar...
				</div>
			{:else if status === 'recording'}
				<div class="flex items-center gap-2 text-red-400 font-medium animate-fade-in">
					<span class="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
					Opname bezig — {formattedTime}
					{#if transcribeMode === 'api'}
						<span class="text-xs text-white/30 font-mono">${estimatedTranscribeCost}</span>
					{/if}
				</div>
				{#if recordingWarning}
					<div class="flex items-center gap-2 text-amber-400 text-xs animate-fade-in">
						<svg
							class="h-3.5 w-3.5 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
						{recordingWarning}
					</div>
				{/if}
			{:else if status === 'processing'}
				<div class="flex flex-col items-center gap-3 animate-fade-in">
					<div class="flex items-center gap-3">
						<div class="flex gap-1">
							<span
								class="inline-block h-2 w-2 rounded-full bg-neon"
								style="animation: dot-bounce 1.4s ease-in-out infinite;"
							></span>
							<span
								class="inline-block h-2 w-2 rounded-full bg-neon"
								style="animation: dot-bounce 1.4s ease-in-out 0.2s infinite;"
							></span>
							<span
								class="inline-block h-2 w-2 rounded-full bg-neon"
								style="animation: dot-bounce 1.4s ease-in-out 0.4s infinite;"
							></span>
						</div>
						<span
							class="{apiStatus.includes('timeout')
								? 'text-amber-400'
								: 'shimmer-text'} font-medium">{apiStatus || 'Transcriberen...'}</span
						>
						<span class="text-sm text-white/30 font-mono">{formattedProcessingTime}</span>
					</div>
					<!-- Progress bar -->
					<div class="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
						<div
							class="h-full rounded-full bg-gradient-to-r from-neon to-accent-start transition-all duration-1000 ease-out"
							style="width: {processingProgress}%"
						></div>
					</div>
					<p class="text-xs text-white/20">
						{transcribeMode === 'api'
							? 'AssemblyAI transcribeert je audio'
							: 'Whisper large-v3 MLX analyseert je audio'}
						{#if transcribeMode === 'api'}
							<span class="font-mono text-amber-400/60">— ${estimatedTranscribeCost}</span>
						{/if}
					</p>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-2">
					<p class="text-sm text-white/30">Druk om op te nemen</p>
					<kbd class="kbd-hint"><span class="text-white/40">spatie</span> om op te nemen</kbd>
				</div>
			{/if}

			<!-- Upload button -->
			<button
				onclick={() => fileInput.click()}
				disabled={status !== 'idle' && status !== 'correcting'}
				class="upload-btn glass rounded-full px-5 py-2 text-sm text-white/50 transition-all duration-200 hover:text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<span class="flex items-center gap-2">
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
					Upload bestand
				</span>
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="audio/*"
				class="hidden"
				onchange={handleFileUpload}
			/>
		</div>

		<!-- Error -->
		{#if error}
			<div
				class="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm animate-slide-up"
			>
				{error}
			</div>
		{/if}

		<!-- Results -->
		{#if raw}
			<div class="animate-slide-up space-y-4">
				{#if language}
					<div class="text-center text-sm text-white/40">
						Gedetecteerde taal: <span class="font-medium text-white/70">{language}</span>
					</div>
				{/if}

				<!-- Raw transcription — full width -->
				<div
					class="gradient-border-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(212,255,0,0.15)]"
				>
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-sm font-semibold text-white/70">Ruwe transcriptie</h2>
						<button
							onclick={() => copyText(raw, 'raw')}
							class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200
								{copiedRaw
								? 'text-green-400 glow-green bg-green-500/10 copy-bounce'
								: 'text-white/40 hover:text-white/70 hover:bg-white/5'}"
						>
							{#if copiedRaw}
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
								Gekopieerd!
							{:else}
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								Kopieer
							{/if}
						</button>
					</div>
					<div
						class="max-h-48 overflow-y-auto whitespace-pre-wrap text-white/90 leading-relaxed rounded-lg border border-white/10 bg-white/5 p-3"
					>
						{raw}
					</div>
				</div>

				<!-- Step 2: Correction controls -->
				{#if status !== 'correcting'}
					<div class="glass rounded-2xl p-4 sm:p-5 animate-fade-in">
						<h3 class="mb-3 sm:mb-4 text-sm font-semibold text-white/70">Verslaglegging</h3>

						<div class="flex flex-wrap items-start gap-3 sm:gap-4 mb-4">
							<!-- Mode toggle -->
							<div class="flex flex-col gap-1">
								<span class="text-[10px] uppercase tracking-wider text-white/30">Model</span>
								<div class="glass inline-flex rounded-full p-1">
									<button
										onclick={() => (mode = 'local')}
										disabled={!localAvailable}
										class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
										'local'
											? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
											: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
									>
										Lokaal
									</button>
									<button
										onclick={() => (mode = 'api')}
										disabled={!mistralAvailable}
										class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
										'api'
											? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
											: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
									>
										API
									</button>
								</div>
							</div>

							<!-- Quality toggle -->
							<div class="flex flex-col gap-1">
								<span class="text-[10px] uppercase tracking-wider text-white/30">Kwaliteit</span>
								<div class="glass inline-flex rounded-full p-1">
									<button
										onclick={() => (quality = 'light')}
										class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {quality ===
										'light'
											? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
											: 'text-white/50 hover:text-white/80 scale-100'}"
									>
										Light
									</button>
									<button
										onclick={() => (quality = 'medium')}
										class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {quality ===
										'medium'
											? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
											: 'text-white/50 hover:text-white/80 scale-100'}"
									>
										Medium
									</button>
								</div>
							</div>

							<!-- Report length toggle -->
							<div class="flex flex-col gap-1">
								<span class="text-[10px] uppercase tracking-wider text-white/30">Omvang</span>
								<div class="glass inline-flex rounded-full p-1">
									{#each [{ value: 'kort', label: 'Kort' }, { value: 'middellang', label: 'Middellang' }, { value: 'lang', label: 'Lang' }] as opt}
										<button
											onclick={() => (reportLength = opt.value as typeof reportLength)}
											class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {reportLength ===
											opt.value
												? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
												: 'text-white/50 hover:text-white/80 scale-100'}"
										>
											{opt.label}
										</button>
									{/each}
								</div>
							</div>
						</div>

						{#if mode === 'api'}
							<p class="mb-3 text-xs text-amber-400/70">
								Tekst wordt verwerkt via Mistral (Europese servers)
								<span class="font-mono">— geschat ${estimatedCorrectionCost}</span>
							</p>
						{/if}

						<!-- Temperature slider -->
						<div class="mb-5 flex items-center gap-3">
							<label for="temperature" class="text-xs text-white/50 whitespace-nowrap"
								>Temperatuur</label
							>
							<input
								id="temperature"
								type="range"
								min="0"
								max="1"
								step="0.1"
								bind:value={temperature}
								class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-neon"
							/>
							<span class="w-8 text-right text-xs font-mono text-white/60"
								>{temperature.toFixed(1)}</span
							>
						</div>

						<!-- Phase 3: Dialect retention toggle -->
						{#if lang === 'li'}
							<div class="mb-5 flex items-center justify-between gap-3">
								<div class="flex flex-col">
									<span class="text-xs text-white/80">Behoud Dialect</span>
									<span class="text-[10px] text-white/30">Houd de output in het Limburgs</span>
								</div>
								<label class="relative inline-flex cursor-pointer items-center">
									<input type="checkbox" bind:checked={keepDialect} class="peer sr-only" />
									<div
										class="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/40 after:transition-all after:content-[''] peer-checked:bg-neon peer-checked:after:translate-x-full peer-checked:after:bg-black"
									></div>
								</label>
							</div>
						{/if}

						<!-- Generate button -->
						<button
							onclick={startCorrection}
							class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,255,0,0.3)] active:scale-[0.98]"
						>
							Verslaglegging genereren
						</button>
					</div>
				{/if}

				<!-- Correcting indicator -->
				{#if status === 'correcting' && !corrected}
					<div class="gradient-border-card p-5 animate-fade-in">
						<div class="mb-3">
							<h2 class="text-sm font-semibold text-white/70">Gecorrigeerd Nederlands</h2>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex gap-1">
								<span
									class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
									style="animation: dot-bounce 1.4s ease-in-out infinite;"
								></span>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
									style="animation: dot-bounce 1.4s ease-in-out 0.2s infinite;"
								></span>
								<span
									class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
									style="animation: dot-bounce 1.4s ease-in-out 0.4s infinite;"
								></span>
							</div>
							<span class="shimmer-text text-sm">Corrigeren...</span>
						</div>
					</div>
				{/if}

				<!-- Corrected result — full width -->
				{#if corrected}
					<div
						class="gradient-border-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(212,255,0,0.15)] animate-slide-up"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<h2 class="text-sm font-semibold text-white/70">Gecorrigeerd Nederlands</h2>
								{#if status === 'correcting'}
									<span class="inline-block h-2 w-2 rounded-full bg-neon animate-pulse"></span>
								{/if}
							</div>
							<button
								onclick={() => copyText(corrected, 'corrected')}
								class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200
									{copiedCorrected
									? 'text-green-400 glow-green bg-green-500/10 copy-bounce'
									: 'text-white/40 hover:text-white/70 hover:bg-white/5'}"
							>
								{#if copiedCorrected}
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									Gekopieerd!
								{:else}
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
									Kopieer
								{/if}
							</button>
						</div>
						<div class="relative">
							<div
								class="whitespace-pre-wrap text-white/90 leading-relaxed overflow-hidden transition-[max-height] duration-500 ease-in-out"
								style="max-height: {correctedExpanded ? 'none' : '12rem'}"
							>
								{corrected}
							</div>
							{#if !correctedExpanded}
								<div
									class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none"
								></div>
							{/if}
						</div>
						<button
							onclick={() => (correctedExpanded = !correctedExpanded)}
							class="mt-2 w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
						>
							{correctedExpanded ? 'Inklappen' : 'Lees meer...'}
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Privacy footer (smooth accordion) -->
		<div class="mt-12 sm:mt-16 animate-fade-in">
			<button
				onclick={() => (privacyOpen = !privacyOpen)}
				class="glass w-full rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-left transition-all duration-300 hover:bg-white/8"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 sm:gap-3">
						<div
							class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-linear-to-br from-neon/20 to-accent-start/20"
						>
							<svg
								class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<div class="flex flex-col sm:flex-row sm:items-center">
							<span class="text-xs sm:text-sm font-medium text-white/70"
								>Privacy-bewuste verwerking</span
							>
							<span
								class="sm:ml-2 text-[10px] text-white/30 uppercase tracking-tighter sm:normal-case sm:tracking-normal"
								>AVG & EU Act compliant</span
							>
						</div>
					</div>
					<svg
						class="h-4 w-4 text-white/30 transition-transform duration-300 {privacyOpen
							? 'rotate-180'
							: ''}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</div>
			</button>

			<div class="privacy-content {privacyOpen ? 'open' : ''}">
				<div>
					<div class="glass-strong mt-2 rounded-2xl p-6 text-sm text-white/50">
						<p class="mb-4 text-white/60">
							Spraakherkenning gebeurt via Whisper (lokaal) of AssemblyAI (EU-datacenter Dublin,
							Ierland). Tekstcorrectie verloopt via Ollama/Gemma (lokaal) of Mistral AI (Europese
							servers). Je kiest zelf per stap of verwerking lokaal of via API plaatsvindt.
							AssemblyAI is SOC 2 Type 2 gecertificeerd met EU Data Residency. Mistral AI verwerkt
							uitsluitend op EU-servers.
						</p>
						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
									AVG / GDPR
								</h4>
								<ul class="space-y-1.5 text-white/40">
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
										Geen persoonsgegevens worden opgeslagen of verwerkt
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
										Audio wordt direct na transcriptie verwijderd
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
										Geen gebruikersprofielen of tracking
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
										Lokale modus: geen gegevensoverdracht. API-modus: audio naar AssemblyAI (Dublin),
										tekst naar Mistral (EU)
									</li>
								</ul>
							</div>
							<div>
								<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
									EU AI Act
								</h4>
								<ul class="space-y-1.5 text-white/40">
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
										Classificatie: minimaal risico (geen verboden toepassing)
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
										Transparantie: AI-gegenereerde output is duidelijk gelabeld
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
										Modellen: Whisper + Ollama/Gemma (lokaal), AssemblyAI + Mistral (EU-servers, SOC 2)
									</li>
									<li class="flex items-start gap-2">
										<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
										Menselijke controle: gebruiker beoordeelt alle output
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
