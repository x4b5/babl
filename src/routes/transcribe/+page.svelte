<script lang="ts">
	import ReconnectingWebSocket from 'reconnecting-websocket';
	import { deduplicateSegments } from '$lib/utils/dedup';
	import type { TranscriptionSegment } from '$lib/utils/dedup';
	import { classifyFrontendError, getUserMessage, isRetryable } from '$lib/utils/error-classifier';
	import { rateLimitMessage, RATE_LIMIT_EXHAUSTED } from '$lib/utils/error-types';
	import type { ErrorType } from '$lib/utils/error-types';
	import {
		cleanupMediaResources,
		cleanupNetworkResources,
		cleanupTimers
	} from '$lib/utils/cleanup';
	import { getSupportedMimeType, downsampleToWav, toPcmInt16 } from '$lib/utils/audio';
	import {
		saveRecording,
		getRecording,
		deleteRecording,
		pruneRecordings
	} from '$lib/utils/recording-db';
	import EvaluationScore from '$lib/components/EvaluationScore.svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';

	// Components
	import AppHeader from '$lib/components/transcribe/AppHeader.svelte';
	import LanguageToggle from '$lib/components/transcribe/LanguageToggle.svelte';
	import TranscribeModeToggle from '$lib/components/transcribe/TranscribeModeToggle.svelte';
	import RecordButton from '$lib/components/transcribe/RecordButton.svelte';
	import ErrorAlert from '$lib/components/transcribe/ErrorAlert.svelte';
	import RawTranscriptionCard from '$lib/components/transcribe/RawTranscriptionCard.svelte';
	import CorrectionControls from '$lib/components/transcribe/CorrectionControls.svelte';
	import CorrectedResultCard from '$lib/components/transcribe/CorrectedResultCard.svelte';
	import PrivacyFooter from '$lib/components/transcribe/PrivacyFooter.svelte';

	// Store
	import {
		getTranscribeState,
		LOCAL_BACKEND_URL,
		MAX_AUTO_RETRIES,
		OVERLAP_CHUNKS,
		CHUNK_INTERVAL_MS,
		SSE_STALL_TIMEOUT_MS,
		RECORDING_MAX_SECONDS,
		setStatus,
		setCountdown,
		setRaw,
		setCorrected,
		setLanguage,
		setError,
		setErrorType,
		setCountdownSeconds,
		setRetryCount,
		setElapsed,
		incrementElapsed,
		setCorrectedExpanded,
		setReconnecting,
		setReconnectStatus,
		setMistralAvailable,
		setAssemblyAvailable,
		setLocalAvailable,
		setPrivacyOpen,
		setKeepDialect,
		setConfidenceWords,
		setLowConfidenceCount,
		setEvalResult,
		setPartialText,
		setLiveWorking,
		setLiveSegments,
		setLastSentChunkIndex,
		setLiveAudioDuration,
		setLastSegmentEnd,
		setApiStatus,
		setProcessingElapsed,
		incrementProcessingElapsed,
		setRecordingDuration,
		setWaveformBars,
		appendCorrected,
		resetForCorrection,
		resetForTranscription,
		setQuality,
		setLang,
		setMode,
		setReportLength,
		setTranscribeMode,
		setApiStreamMode,
		setTemperature,
		setSavedRecordingId,
		setSavedRecordingMimeType
	} from '$lib/stores/transcribe.svelte';

	const s = getTranscribeState();

	// ── Infrastructure refs (local, not reactive) ──────────────────
	let mediaRecorder: MediaRecorder | undefined;
	let stream: MediaStream | undefined;
	let chunks: Blob[] = [];
	let timerInterval: ReturnType<typeof setInterval> | undefined;
	let processingTimerInterval: ReturnType<typeof setInterval> | undefined;
	let liveInterval: ReturnType<typeof setInterval> | undefined;
	let countdownInterval: ReturnType<typeof setInterval> | undefined;
	let streamStallTimer: ReturnType<typeof setTimeout> | undefined;
	let transcribeController: AbortController | undefined;
	let correctionController: AbortController | undefined;
	let liveChunkController: AbortController | undefined;
	let apiPollController: AbortController | undefined;
	let streamSocket: ReconnectingWebSocket | undefined;
	let audioContext: AudioContext | undefined;
	let analyser: AnalyserNode | undefined;
	let animationFrameId: number | undefined;
	let liveBusy = false;
	let liveRunning = false;

	/** Retry transcription using the saved recording from IndexedDB. */
	async function retryTranscription() {
		if (!s.savedRecordingId) return;
		try {
			const rec = await getRecording(s.savedRecordingId);
			if (!rec) return;
			setError('');
			setErrorType('');
			const ext = rec.mimeType.includes('webm')
				? 'webm'
				: rec.mimeType.includes('ogg')
					? 'ogg'
					: 'mp4';
			await sendAudio(rec.blob, `retry.${ext}`);
		} catch {
			setError('Opnieuw proberen mislukt. Download de opname en upload het bestand handmatig.');
		}
	}

	/** Remove saved recording from IndexedDB after successful transcription. */
	async function clearSavedRecording() {
		if (s.savedRecordingId) {
			try {
				await deleteRecording(s.savedRecordingId);
			} catch {
				// Ignore — best effort cleanup
			}
			setSavedRecordingId(null);
			setSavedRecordingMimeType('');
		}
	}

	// ── Effects ────────────────────────────────────────────────────

	// Recording elapsed timer
	$effect(() => {
		if (s.status === 'recording') {
			setElapsed(0);
			timerInterval = setInterval(() => incrementElapsed(), 1000);
		} else if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = undefined;
		}
		return () => {
			if (timerInterval) clearInterval(timerInterval);
		};
	});

	// Processing elapsed timer
	$effect(() => {
		if (s.status === 'processing') {
			setProcessingElapsed(0);
			processingTimerInterval = setInterval(() => incrementProcessingElapsed(), 1000);
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
		if (s.status === 'recording' && s.elapsed >= RECORDING_MAX_SECONDS) {
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

	// Cleanup countdown interval on unmount
	$effect(() => {
		return () => {
			if (countdownInterval) clearInterval(countdownInterval);
		};
	});

	// Health check: detect API availability + local backend
	$effect(() => {
		fetch('/api/health')
			.then((r) => r.json())
			.then((data) => {
				setMistralAvailable(data.mistral_available ?? false);
				setAssemblyAvailable(data.assemblyai_available ?? false);
			})
			.catch(() => {
				setMistralAvailable(false);
				setAssemblyAvailable(false);
			});

		fetch(`${LOCAL_BACKEND_URL}/health`)
			.then((r) => r.json())
			.then(() => setLocalAvailable(true))
			.catch(() => setLocalAvailable(false));

		// Prune old recordings from IndexedDB (keep max 3)
		pruneRecordings(3).catch(() => {});
	});

	// Resource cleanup: beforeunload + pagehide + component destroy
	$effect(() => {
		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (s.status === 'recording' || s.status === 'processing' || s.status === 'correcting') {
				e.preventDefault();
				e.returnValue = '';
			}
			cleanupAllResources();
		}
		function handlePageHide() {
			cleanupAllResources();
		}
		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('pagehide', handlePageHide);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('pagehide', handlePageHide);
			cleanupAllResources();
		};
	});

	// ── Audio waveform ─────────────────────────────────────────────

	function startWaveform(mediaStream: MediaStream) {
		audioContext = new AudioContext();
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 128;
		const source = audioContext.createMediaStreamSource(mediaStream);
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
			setWaveformBars(newBars);
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
		setWaveformBars(new Array(40).fill(3));
	}

	// ── Live transcription (local Whisper) ─────────────────────────

	async function sendLiveChunk() {
		if (liveBusy || chunks.length === 0 || !mediaRecorder) return;
		if (chunks.length <= s.lastSentChunkIndex) return;
		liveBusy = true;
		liveChunkController = new AbortController();
		try {
			const mimeType = mediaRecorder.mimeType;
			const sendFrom = Math.max(0, s.lastSentChunkIndex - OVERLAP_CHUNKS);
			const blob = new Blob(chunks.slice(sendFrom), { type: mimeType });
			const wav = await downsampleToWav(blob);
			const formData = new FormData();
			formData.append('file', wav, 'live.wav');
			formData.append('lang', s.lang);
			formData.append('offset', String(s.liveAudioDuration));
			console.log(
				`Live chunk: sending chunks ${sendFrom}-${chunks.length} (${(wav.size / 1024).toFixed(0)}KB, offset=${s.liveAudioDuration.toFixed(1)}s)`
			);
			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
				method: 'POST',
				body: formData,
				signal: liveChunkController.signal
			});
			if (resp.ok) {
				const data = await resp.json();
				if (data.language) setLanguage(data.language);
				const segments: TranscriptionSegment[] = data.segments || [];
				if (segments.length > 0) {
					const { unique, newLastSegmentEnd } = deduplicateSegments(segments, s.lastSegmentEnd);
					if (unique.length > 0) {
						const newText = unique.map((seg) => seg.text).join(' ');
						setPartialText(s.partialText ? `${s.partialText} ${newText}` : newText);
						setLiveWorking(true);
						setLastSegmentEnd(newLastSegmentEnd);
						setLiveAudioDuration(unique[unique.length - 1].end);
					}
				}
				setLastSentChunkIndex(chunks.length);
			}
		} catch (e) {
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('Live chunk aborted');
				return;
			}
			console.warn('Live chunk failed:', e);
		} finally {
			liveChunkController = undefined;
			liveBusy = false;
		}
	}

	function startLiveTranscription() {
		setPartialText('');
		setLiveWorking(false);
		liveBusy = false;
		liveRunning = true;
		setLastSentChunkIndex(0);
		setLiveAudioDuration(0);
		setLastSegmentEnd(0);
		liveLoop();
	}

	async function liveLoop() {
		while (liveRunning) {
			await new Promise((r) => setTimeout(r, 5000));
			if (!liveRunning) break;
			await sendLiveChunk();
		}
	}

	function stopLiveTranscription() {
		liveRunning = false;
	}

	// ── Real-time WebSocket streaming (AssemblyAI) ─────────────────

	function startRealtimeStream() {
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
			console.log('[RT] WebSocket connected');
			setReconnecting(false);
			setReconnectStatus('');
			streamSocket!.send(JSON.stringify({ lang: s.lang }));
			if (streamStallTimer) clearTimeout(streamStallTimer);
			streamStallTimer = setTimeout(() => {
				setError(
					'Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.'
				);
				stopRealtimeStream();
			}, 30000);
		});

		streamSocket.addEventListener('message', (event: MessageEvent) => {
			const data = JSON.parse(event.data);
			if (data.type === 'ping') {
				streamSocket!.send(JSON.stringify({ type: 'pong' }));
				return;
			}

			const resetStall = () => {
				if (streamStallTimer) clearTimeout(streamStallTimer);
				streamStallTimer = setTimeout(() => {
					setError(
						'Live transcriptie gestopt — geen data ontvangen. Controleer je internetverbinding.'
					);
					stopRealtimeStream();
				}, 30000);
			};

			if (data.type === 'partial') {
				setPartialText([...s.liveSegments, data.text].join(' '));
				resetStall();
			} else if (data.type === 'final') {
				setLiveSegments([...s.liveSegments, data.text]);
				setPartialText([...s.liveSegments].join(' '));
				setLiveWorking(true);
				resetStall();
			} else if (data.type === 'error') {
				console.error('[RT] Error:', data.message);
				setError(`Real-time fout: ${data.message}`);
			}
		});

		streamSocket.addEventListener('error', () => {
			console.error('[RT] WebSocket error');
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

		streamSocket.addEventListener('close', () => {
			console.log('[RT] WebSocket closed');
		});
	}

	function stopRealtimeStream() {
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

	// ── Resource cleanup ───────────────────────────────────────────

	function cleanupAllResources() {
		cleanupNetworkResources({
			transcribeController,
			correctionController,
			liveChunkController,
			apiPollController,
			streamSocket
		});
		cleanupMediaResources({
			mediaRecorder,
			stream,
			audioContext,
			analyser: { current: analyser },
			animationFrameId: { current: animationFrameId }
		});
		cleanupTimers({
			timerInterval,
			processingTimerInterval,
			liveInterval,
			countdownInterval,
			streamStallTimer
		});
		stream = undefined;
		transcribeController = undefined;
		correctionController = undefined;
		liveChunkController = undefined;
		apiPollController = undefined;
		streamSocket = undefined;
		audioContext = undefined;
		analyser = undefined;
		animationFrameId = undefined;
		mediaRecorder = undefined;
		setReconnecting(false);
		setReconnectStatus('');
	}

	async function sendChunkToStream(blob: Blob) {
		if (!streamSocket || streamSocket.readyState !== WebSocket.OPEN) return;
		try {
			const pcm = await toPcmInt16(blob);
			streamSocket.send(pcm);
		} catch (e) {
			console.error('[RT] PCM conversion error:', e);
		}
	}

	// ── Recording ──────────────────────────────────────────────────

	async function startRecording() {
		setError('');
		setErrorType('');
		try {
			const mimeType = getSupportedMimeType();
			if (!mimeType) {
				setError('Je browser ondersteunt geen audio-opname.');
				return;
			}
			setStatus('preparing');
			setCountdown(2);
			const countdownTimer = setInterval(() => {
				setCountdown(s.countdown - 1);
				if (s.countdown <= 1) clearInterval(countdownTimer);
			}, 1000);
			await new Promise((resolve) => setTimeout(resolve, 2000));
			if (s.status !== 'preparing') return;

			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, { mimeType });
			chunks = [];
			startWaveform(stream);
			const useRealtimeStream = s.transcribeMode === 'api' && s.apiStreamMode === 'realtime';

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
					if (useRealtimeStream) sendChunkToStream(e.data);
				}
			};

			mediaRecorder.onstop = async () => {
				if (stream) stream.getTracks().forEach((t) => t.stop());
				stopWaveform();
				stopLiveTranscription();
				stopRealtimeStream();
				setRecordingDuration(s.elapsed);

				if (chunks.length === 0) {
					setError('Geen audio opgenomen. Probeer langer op te nemen.');
					setStatus('idle');
					return;
				}
				const blob = new Blob(chunks, { type: mimeType });

				// Save recording locally before transcription attempt
				try {
					const recId = await saveRecording(blob, mimeType);
					setSavedRecordingId(recId);
					setSavedRecordingMimeType(mimeType);
				} catch {
					// IndexedDB unavailable — continue without saving
				}

				// Real-time API streaming: use accumulated segments
				if (useRealtimeStream && s.liveSegments.length > 0) {
					setRaw(s.liveSegments.join(' '));
					setPartialText('');
					await clearSavedRecording();
					setStatus('idle');
					return;
				}

				if (s.transcribeMode === 'local') {
					// Use accumulated live transcription if available
					if (s.partialText) {
						if (s.lastSentChunkIndex < chunks.length) {
							setStatus('processing');
							try {
								const sendFrom = Math.max(0, s.lastSentChunkIndex - OVERLAP_CHUNKS);
								const remainingBlob = new Blob(chunks.slice(sendFrom), { type: mimeType });
								const wav = await downsampleToWav(remainingBlob);
								console.log(
									`Final chunk: sending remaining chunks ${sendFrom}-${chunks.length} (${(wav.size / 1024).toFixed(0)}KB)`
								);
								const formData = new FormData();
								formData.append('file', wav, 'final.wav');
								formData.append('lang', s.lang);
								formData.append('offset', String(s.liveAudioDuration));
								const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
									method: 'POST',
									body: formData
								});
								if (resp.ok) {
									const data = await resp.json();
									if (data.language) setLanguage(data.language);
									const segments = data.segments || [];
									if (segments.length > 0) {
										const newText = segments.map((seg: { text: string }) => seg.text).join(' ');
										setPartialText(`${s.partialText} ${newText}`);
									}
								}
							} catch {
								// Use what we have
							}
						}
						setRaw(s.partialText);
						setPartialText('');
						await clearSavedRecording();
						setStatus('idle');
						return;
					}

					setStatus('processing');
					// No live text — send full audio for final transcription
					try {
						const wav = await downsampleToWav(blob);
						console.log(
							`Final transcription: sending full audio (${(wav.size / 1024).toFixed(0)}KB)`
						);
						const formData = new FormData();
						formData.append('file', wav, 'final.wav');
						formData.append('lang', s.lang);
						const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-live`, {
							method: 'POST',
							body: formData
						});
						if (resp.ok) {
							const data = await resp.json();
							if (data.text) {
								setRaw(data.text);
								if (data.language) setLanguage(data.language);
								setPartialText('');
								await clearSavedRecording();
								setStatus('idle');
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
					const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
					await sendAudio(blob, `recording.${ext}`);
				}
				setPartialText('');
			};

			mediaRecorder.start(CHUNK_INTERVAL_MS);
			setStatus('recording');
			if (useRealtimeStream) {
				startRealtimeStream();
			} else if (s.transcribeMode === 'local') {
				startLiveTranscription();
			}
		} catch {
			setError('Microfoon niet beschikbaar. Controleer je browserpermissies.');
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
			setStatus('processing');
		}
	}

	function toggleRecording() {
		if (s.status === 'recording') {
			stopRecording();
		} else if (s.status === 'idle') {
			startRecording();
		} else if (s.status === 'preparing') {
			setStatus('idle');
			setCountdown(0);
		}
	}

	// ── File upload ────────────────────────────────────────────────

	const MAX_DOWNSAMPLE_BYTES = 25 * 1024 * 1024; // 25MB

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		setError('');
		setStatus('processing');

		if (file.size > MAX_DOWNSAMPLE_BYTES) {
			// Too large for in-browser downsampling (OOM risk) — send original
			console.log(
				`File too large for downsampling (${(file.size / 1024 / 1024).toFixed(0)}MB), sending original`
			);
			await sendAudio(file, file.name);
		} else {
			try {
				const wav = await downsampleToWav(file);
				console.log(
					`Downsampled upload: ${(file.size / 1024).toFixed(0)}KB → ${(wav.size / 1024).toFixed(0)}KB`
				);
				await sendAudio(wav, 'upload.wav');
			} catch {
				await sendAudio(file, file.name);
			}
		}
		input.value = '';
	}

	// ── Audio send (dispatch to local/API) ─────────────────────────

	async function sendAudio(blob: Blob, filename: string) {
		resetForTranscription();
		console.log(`Sending audio: ${filename}, size: ${blob.size} bytes, type: ${blob.type}`);
		if (blob.size === 0) {
			setError('Audio-bestand is leeg. Probeer opnieuw.');
			setStatus('idle');
			return;
		}
		setStatus('processing');
		const formData = new FormData();
		formData.append('file', blob, filename);
		formData.append('lang', s.lang);
		if (s.transcribeMode === 'api') {
			await sendAudioApi(formData);
		} else {
			await sendAudioLocal(formData);
		}
	}

	const MAX_VERCEL_BODY_BYTES = 4 * 1024 * 1024; // 4MB — Vercel limit ~4.5MB

	async function sendAudioApi(formData: FormData) {
		apiPollController = new AbortController();
		try {
			setApiStatus('Uploaden...');

			// Vercel body limit is ~4.5MB — route large files through local backend SSE
			const file = formData.get('file') as Blob | null;
			const useLocalProxy = file && file.size > MAX_VERCEL_BODY_BYTES && s.localAvailable;

			if (useLocalProxy) {
				await sendAudioApiViaLocal(formData);
				return;
			}

			const submitResp = await fetch('/api/transcribe-api', {
				method: 'POST',
				body: formData,
				signal: apiPollController.signal
			});
			if (!submitResp.ok) {
				let body: { error?: string; error_type?: string } | undefined;
				try {
					body = await submitResp.json();
				} catch {
					/* not JSON */
				}
				if (body?.error_type) {
					setErrorType(body.error_type as ErrorType);
					setError(getUserMessage(body.error_type as ErrorType));
					setApiStatus('');
					setStatus('idle');
					return;
				}
				throw new Error(body?.error || `Server error ${submitResp.status}`);
			}
			const { transcriptId, error: submitError } = await submitResp.json();
			if (submitError) throw new Error(submitError);

			setApiStatus('Wachtrij...');
			const POLL_INTERVAL = 3000;
			const MAX_POLL_TIME = 60 * 60 * 1000;
			const startTime = Date.now();

			while (true) {
				if (Date.now() - startTime > MAX_POLL_TIME) {
					throw new Error('Transcriptie duurde te lang (>60 min).');
				}
				await new Promise((r) => setTimeout(r, POLL_INTERVAL));
				const pollResp = await fetch(`/api/transcribe-api/${transcriptId}`, {
					signal: apiPollController.signal
				});
				if (!pollResp.ok) {
					let body: { error?: string; error_type?: string } | undefined;
					try {
						body = await pollResp.json();
					} catch {
						/* not JSON */
					}
					if (body?.error_type) {
						setErrorType(body.error_type as ErrorType);
						setError(getUserMessage(body.error_type as ErrorType));
						setApiStatus('');
						setStatus('idle');
						return;
					}
					throw new Error(body?.error || `Poll error ${pollResp.status}`);
				}
				const result = await pollResp.json();
				const elapsedMs = Date.now() - startTime;
				const elapsedMin = Math.floor(elapsedMs / 60000);
				const WARN_AT_MIN = 45;

				if (result.status === 'queued') {
					setApiStatus(
						elapsedMin >= WARN_AT_MIN
							? `Wachtrij... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
							: 'Wachtrij...'
					);
				} else if (result.status === 'processing') {
					setApiStatus(
						elapsedMin >= WARN_AT_MIN
							? `Verwerken... (${elapsedMin} min — nog ${60 - elapsedMin} min tot timeout)`
							: 'Verwerken...'
					);
				} else if (result.status === 'completed') {
					setRaw(result.text || '');
					setLanguage(result.language || '');
					if (result.words && Array.isArray(result.words)) {
						setConfidenceWords(result.words);
						setLowConfidenceCount(result.low_confidence_count || 0);
					} else {
						setConfidenceWords([]);
						setLowConfidenceCount(0);
					}
					setApiStatus('');
					await clearSavedRecording();
					setStatus('idle');
					return;
				} else if (result.status === 'error') {
					throw new Error(result.error || 'Transcriptie mislukt');
				}
			}
		} catch (e) {
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('API transcription aborted');
				apiPollController = undefined;
				return;
			}
			const classified = classifyFrontendError(e);
			setErrorType(classified);
			setError(getUserMessage(classified));
			setApiStatus('');
			setStatus('idle');
		} finally {
			apiPollController = undefined;
		}
	}

	async function sendAudioApiViaLocal(formData: FormData) {
		// Large file: use local backend's /transcribe-api SSE endpoint (bypasses Vercel body limit)
		transcribeController = new AbortController();
		let stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);
		const resetStallTimeout = () => {
			clearTimeout(stallTimeout);
			stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);
		};

		try {
			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe-api`, {
				method: 'POST',
				body: formData,
				signal: transcribeController.signal
			});
			if (!resp.ok) {
				let body: { error?: string; error_type?: string } | undefined;
				try {
					body = await resp.json();
				} catch {
					/* not JSON */
				}
				if (body?.error_type) {
					setErrorType(body.error_type as ErrorType);
					setError(getUserMessage(body.error_type as ErrorType));
					setStatus('idle');
					return;
				}
				throw new Error(body?.error || `Server error ${resp.status}`);
			}
			const reader = resp.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					clearTimeout(stallTimeout);
					break;
				}
				resetStallTimeout();
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';
				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const event = JSON.parse(line.slice(6));
					if (event.type === 'info') {
						setLanguage(event.language || '');
					} else if (event.type === 'segment') {
						let segmentText = event.text;
						if (event.speaker) segmentText = `Spreker ${event.speaker}: ${event.text}`;
						setRaw(s.raw ? `${s.raw}\n${segmentText}` : segmentText);
					} else if (event.type === 'error') {
						if (event.error_type) {
							handleErrorEvent(event);
							setStatus('idle');
							return;
						}
						throw new Error(event.message);
					}
				}
			}
			setApiStatus('');
			await clearSavedRecording();
			setStatus('idle');
		} catch (e) {
			clearTimeout(stallTimeout);
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('API via local transcription aborted');
				transcribeController = undefined;
				return;
			}
			const classified = classifyFrontendError(e);
			setErrorType(classified);
			setError(getUserMessage(classified));
			setApiStatus('');
			setStatus('idle');
		} finally {
			transcribeController = undefined;
		}
	}

	async function sendAudioLocal(formData: FormData) {
		transcribeController = new AbortController();
		let stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);
		const resetStallTimeout = () => {
			clearTimeout(stallTimeout);
			stallTimeout = setTimeout(() => transcribeController!.abort(), SSE_STALL_TIMEOUT_MS);
		};

		try {
			const resp = await fetch(`${LOCAL_BACKEND_URL}/transcribe`, {
				method: 'POST',
				body: formData,
				signal: transcribeController.signal
			});
			if (!resp.ok) {
				let body: { error?: string; error_type?: string } | undefined;
				try {
					body = await resp.json();
				} catch {
					/* not JSON */
				}
				if (body?.error_type) {
					setErrorType(body.error_type as ErrorType);
					setError(getUserMessage(body.error_type as ErrorType));
					setStatus('idle');
					return;
				}
				throw new Error(body?.error || `Server error ${resp.status}`);
			}
			const reader = resp.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					clearTimeout(stallTimeout);
					break;
				}
				resetStallTimeout();
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';
				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const event = JSON.parse(line.slice(6));
					if (event.type === 'info') {
						setLanguage(event.language || '');
					} else if (event.type === 'segment') {
						let segmentText = event.text;
						if (event.speaker) segmentText = `Spreker ${event.speaker}: ${event.text}`;
						setRaw(s.raw ? `${s.raw}\n${segmentText}` : segmentText);
					} else if (event.type === 'error') {
						if (event.error_type) {
							handleErrorEvent(event);
							setStatus('idle');
							return;
						}
						throw new Error(event.message);
					}
				}
			}
			await clearSavedRecording();
			setStatus('idle');
		} catch (e) {
			clearTimeout(stallTimeout);
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('Local transcription aborted');
				transcribeController = undefined;
				return;
			}
			const classified = classifyFrontendError(e);
			setErrorType(classified);
			setError(getUserMessage(classified));
			setStatus('idle');
		} finally {
			transcribeController = undefined;
		}
	}

	// ── Correction ─────────────────────────────────────────────────

	function startCountdown(seconds: number) {
		if (countdownInterval) clearInterval(countdownInterval);
		setCountdownSeconds(seconds);
		setError(rateLimitMessage(seconds));
		countdownInterval = setInterval(() => {
			const next = s.countdownSeconds - 1;
			setCountdownSeconds(next);
			if (next > 0) {
				setError(rateLimitMessage(next));
			} else {
				clearInterval(countdownInterval!);
				countdownInterval = undefined;
				setError('');
				setErrorType('');
				setRetryCount(s.retryCount + 1);
				if (s.retryCount + 1 <= MAX_AUTO_RETRIES) {
					fetchCorrection(s.raw, s.lang, s.quality);
				} else {
					setError(RATE_LIMIT_EXHAUSTED);
					setErrorType('rate_limit');
					setRetryCount(0);
				}
			}
		}, 1000);
	}

	function handleErrorEvent(event: {
		error_type?: string;
		retry_after?: number;
		message?: string;
	}) {
		const eventErrorType = (event.error_type || 'server_error') as ErrorType;
		setErrorType(eventErrorType);
		if (isRetryable(eventErrorType) && event.retry_after) {
			startCountdown(event.retry_after);
		} else {
			setError(getUserMessage(eventErrorType));
		}
	}

	function startCorrection() {
		if (!s.raw) return;
		resetForCorrection();
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = undefined;
		}
		fetchCorrection(s.raw, s.lang, s.quality);
	}

	async function fetchCorrection(text: string, corrLang: string, qual: string) {
		const body = {
			text,
			language: corrLang,
			quality: qual,
			mode: s.mode,
			temperature: s.temperature,
			report_length: s.reportLength,
			keep_dialect: s.keepDialect
		};
		console.log('Correction request:', {
			report_length: body.report_length,
			mode: body.mode,
			quality: body.quality
		});
		const correctUrl = body.mode === 'api' ? '/api/correct' : `${LOCAL_BACKEND_URL}/correct`;
		correctionController = new AbortController();
		let stallTimeout = setTimeout(() => correctionController!.abort(), SSE_STALL_TIMEOUT_MS);
		const resetStallTimeout = () => {
			clearTimeout(stallTimeout);
			stallTimeout = setTimeout(() => correctionController!.abort(), SSE_STALL_TIMEOUT_MS);
		};

		try {
			const resp = await fetch(correctUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal: correctionController.signal
			});
			if (!resp.ok) {
				console.error('Correction failed:', resp.status);
				if (resp.status === 429) {
					setErrorType('rate_limit');
					const retryAfter = parseInt(resp.headers.get('Retry-After') || '3', 10);
					startCountdown(Math.max(1, retryAfter));
				} else {
					const classified = classifyFrontendError(new Error(`HTTP ${resp.status}`));
					setErrorType(classified);
					setError(getUserMessage(classified));
				}
				setCorrected('');
				setStatus('idle');
				return;
			}
			const reader = resp.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					clearTimeout(stallTimeout);
					break;
				}
				resetStallTimeout();
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';
				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const event = JSON.parse(line.slice(6));
					if (event.type === 'token') {
						appendCorrected(event.text);
					} else if (event.type === 'done') {
						// Streaming complete
					} else if (event.type === 'error') {
						handleErrorEvent(event);
						return;
					}
				}
			}
			if (!s.corrected) setCorrected(text);
		} catch (e) {
			clearTimeout(stallTimeout);
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('Correction aborted');
				correctionController = undefined;
				return;
			}
			console.error('Correction error:', e);
			const classified = classifyFrontendError(e);
			setErrorType(classified);
			setError(getUserMessage(classified));
			setCorrected('');
		} finally {
			correctionController = undefined;
			setStatus('idle');
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
	<div class="floating-orb orb-violet"></div>
	<div class="floating-orb orb-indigo"></div>
	<div class="floating-orb orb-cyan"></div>
	<div class="floating-orb orb-fuchsia"></div>

	<div class="mx-auto max-w-3xl px-4 py-6 sm:py-16">
		<AppHeader />

		<LanguageToggle lang={s.lang} onchange={(v) => setLang(v)} />

		<TranscribeModeToggle
			transcribeMode={s.transcribeMode}
			apiStreamMode={s.apiStreamMode}
			localAvailable={s.localAvailable}
			assemblyAvailable={s.assemblyAvailable}
			onTranscribeModeChange={(v) => setTranscribeMode(v)}
			onApiStreamModeChange={(v) => setApiStreamMode(v)}
		/>

		<RecordButton
			status={s.status}
			countdown={s.countdown}
			waveformBars={s.waveformBars}
			partialText={s.partialText}
			reconnecting={s.reconnecting}
			reconnectStatus={s.reconnectStatus}
			formattedTime={s.formattedTime}
			formattedProcessingTime={s.formattedProcessingTime}
			processingProgress={s.processingProgress}
			recordingWarning={s.recordingWarning}
			transcribeMode={s.transcribeMode}
			apiStatus={s.apiStatus}
			estimatedTranscribeCost={s.estimatedTranscribeCost}
			onToggleRecording={toggleRecording}
			onFileUpload={handleFileUpload}
		/>

		{#if s.error}
			<ErrorAlert
				error={s.error}
				errorType={s.errorType}
				savedRecordingId={s.savedRecordingId}
				onRetry={retryTranscription}
			/>
		{/if}

		{#if s.raw}
			<div class="animate-slide-up space-y-4">
				<RawTranscriptionCard
					raw={s.raw}
					language={s.language}
					confidenceWords={s.confidenceWords}
					transcribeMode={s.transcribeMode}
				/>

				{#if s.status !== 'correcting' && !s.corrected}
					<CorrectionControls
						mode={s.mode}
						quality={s.quality}
						reportLength={s.reportLength}
						temperature={s.temperature}
						lang={s.lang}
						keepDialect={s.keepDialect}
						localAvailable={s.localAvailable}
						mistralAvailable={s.mistralAvailable}
						estimatedCorrectionCost={s.estimatedCorrectionCost}
						onModeChange={(v) => setMode(v)}
						onQualityChange={(v) => setQuality(v)}
						onReportLengthChange={(v) => setReportLength(v)}
						onTemperatureChange={(v) => setTemperature(v)}
						onKeepDialectChange={(v) => setKeepDialect(v)}
						onGenerate={startCorrection}
					/>
				{/if}

				<CorrectedResultCard
					corrected={s.corrected}
					status={s.status}
					expanded={s.correctedExpanded}
					onToggleExpand={() => setCorrectedExpanded(!s.correctedExpanded)}
				/>

				{#if s.corrected}
					<FeedbackWidget
						rawText={s.raw}
						correctedText={s.corrected}
						dialectRegion="limburgs"
						lowConfidenceCount={s.lowConfidenceCount}
						transcribeMode={s.transcribeMode}
						onevaluated={(result) => setEvalResult(result)}
					/>
				{/if}

				{#if s.evalResult}
					<EvaluationScore
						wer={s.evalResult.wer}
						cer={s.evalResult.cer}
						substitutions={s.evalResult.substitutions}
						deletions={s.evalResult.deletions}
						insertions={s.evalResult.insertions}
						totalWords={s.evalResult.totalWords}
					/>
				{/if}
			</div>
		{/if}

		<PrivacyFooter open={s.privacyOpen} onToggle={() => setPrivacyOpen(!s.privacyOpen)} />
	</div>
</div>
