<script lang="ts">
	import {
		cleanupMediaResources,
		cleanupNetworkResources,
		cleanupTimers
	} from '$lib/utils/cleanup';
	import { getSupportedMimeType } from '$lib/utils/audio';
	import { getRecording, deleteRecording, pruneRecordings } from '$lib/utils/recording-db';
	import EvaluationScore from '$lib/components/EvaluationScore.svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';

	// Components
	import AppHeader from '$lib/components/transcribe/AppHeader.svelte';
	import TranscribeModeToggle from '$lib/components/transcribe/TranscribeModeToggle.svelte';
	import RecordButton from '$lib/components/transcribe/RecordButton.svelte';
	import ErrorAlert from '$lib/components/transcribe/ErrorAlert.svelte';
	import RawTranscriptionCard from '$lib/components/transcribe/RawTranscriptionCard.svelte';
	import CorrectionControls from '$lib/components/transcribe/CorrectionControls.svelte';
	import CorrectedResultCard from '$lib/components/transcribe/CorrectedResultCard.svelte';
	import PrivacyFooter from '$lib/components/transcribe/PrivacyFooter.svelte';

	// Services
	import {
		sendAudio,
		startLiveTranscription,
		stopLiveTranscription,
		type LiveTranscriptionRefs
	} from '$lib/services/transcription';
	import { startCorrection, handleErrorEvent } from '$lib/services/correction';
	import {
		startRealtimeStream,
		stopRealtimeStream,
		sendChunkToStream,
		getStreamSocket,
		getStreamStallTimer
	} from '$lib/services/realtime-stream';
	import { startWaveform, stopWaveform, type WaveformRefs } from '$lib/services/waveform';
	import {
		processRecording,
		handleFileUpload,
		requestMicPermission
	} from '$lib/services/recording';

	// Store
	import {
		getTranscribeState,
		LOCAL_BACKEND_URL,
		CHUNK_INTERVAL_MS,
		RECORDING_MAX_SECONDS,
		setStatus,
		setCountdown,
		setError,
		setErrorType,
		setElapsed,
		incrementElapsed,
		setCorrectedExpanded,
		setMistralAvailable,
		setAssemblyAvailable,
		setLocalAvailable,
		setPrivacyOpen,
		setEvalResult,
		setProcessingElapsed,
		incrementProcessingElapsed,
		setMode,
		setReportLength,
		setTranscribeMode,
		setSavedRecordingId,
		setSavedRecordingMimeType
	} from '$lib/stores/transcribe.svelte';

	const s = getTranscribeState();

	// ── Infrastructure refs ───────────────────────────────────────
	let mediaRecorder: MediaRecorder | undefined;
	let stream: MediaStream | undefined;
	let chunks: Blob[] = [];
	let timerInterval: ReturnType<typeof setInterval> | undefined;
	let processingTimerInterval: ReturnType<typeof setInterval> | undefined;
	let countdownInterval: ReturnType<typeof setInterval> | undefined;
	let transcribeController: AbortController | undefined;
	let correctionController: AbortController | undefined;
	let liveChunkController: AbortController | undefined;
	let apiPollController: AbortController | undefined;
	let waveformRefs: WaveformRefs = {
		audioContext: undefined,
		analyser: undefined,
		animationFrameId: undefined
	};
	const liveTranscriptionRefs: LiveTranscriptionRefs = {
		get chunks() {
			return chunks;
		},
		get mediaRecorder() {
			return mediaRecorder;
		}
	};

	const liveTranscriptionCallbacks = {
		setLiveChunkController: (v: AbortController | undefined) => {
			liveChunkController = v;
		}
	};

	// ── Service callbacks ─────────────────────────────────────────

	const transcriptionCallbacks = {
		setTranscribeController: (v: AbortController | undefined) => {
			transcribeController = v;
		},
		setApiPollController: (v: AbortController | undefined) => {
			apiPollController = v;
		},
		onClearSavedRecording: clearSavedRecording,
		onHandleErrorEvent: (event: {
			error_type?: string;
			retry_after?: number;
			message?: string;
		}) => {
			handleErrorEvent(event, correctionRefs, correctionCallbacks);
		}
	};

	const correctionCallbacks = {
		setCorrectionController: (v: AbortController | undefined) => {
			correctionController = v;
		},
		setCountdownInterval: (v: ReturnType<typeof setInterval> | undefined) => {
			countdownInterval = v;
		}
	};

	// Lazy refs so correction service always reads current values
	const correctionRefs = {
		get correctionController() {
			return correctionController;
		},
		get countdownInterval() {
			return countdownInterval;
		}
	};

	const transcriptionRefs = {
		get transcribeController() {
			return transcribeController;
		},
		get apiPollController() {
			return apiPollController;
		}
	};

	// ── IndexedDB helpers ─────────────────────────────────────────

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
			await sendAudio(rec.blob, `retry.${ext}`, transcriptionRefs, transcriptionCallbacks);
		} catch {
			setError('Opnieuw proberen mislukt. Download de opname en upload het bestand handmatig.');
		}
	}

	async function clearSavedRecording() {
		if (s.savedRecordingId) {
			try {
				await deleteRecording(s.savedRecordingId);
			} catch {
				// Best effort cleanup
			}
			setSavedRecordingId(null);
			setSavedRecordingMimeType('');
		}
	}

	// ── Effects ───────────────────────────────────────────────────

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

	$effect(() => {
		if (s.status === 'recording' && s.elapsed >= RECORDING_MAX_SECONDS) {
			stopRecording();
		}
	});

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

	$effect(() => {
		return () => {
			if (countdownInterval) clearInterval(countdownInterval);
		};
	});

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

		pruneRecordings(3).catch(() => {});
	});

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

	// ── Resource cleanup ──────────────────────────────────────────

	function cleanupAllResources() {
		cleanupNetworkResources({
			transcribeController,
			correctionController,
			liveChunkController,
			apiPollController,
			streamSocket: getStreamSocket()
		});
		cleanupMediaResources({
			mediaRecorder,
			stream,
			audioContext: waveformRefs.audioContext,
			analyser: { current: waveformRefs.analyser },
			animationFrameId: { current: waveformRefs.animationFrameId }
		});
		cleanupTimers({
			timerInterval,
			processingTimerInterval,
			liveInterval: undefined,
			countdownInterval,
			streamStallTimer: getStreamStallTimer()
		});
		stopRealtimeStream();
		stream = undefined;
		transcribeController = undefined;
		correctionController = undefined;
		liveChunkController = undefined;
		apiPollController = undefined;
		waveformRefs = { audioContext: undefined, analyser: undefined, animationFrameId: undefined };
		mediaRecorder = undefined;
	}

	// ── Recording ─────────────────────────────────────────────────

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
			waveformRefs = startWaveform(stream, waveformRefs);
			const useRealtimeStream = s.transcribeMode === 'api' && s.apiStreamMode === 'realtime';

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
					if (useRealtimeStream) sendChunkToStream(e.data);
				}
			};

			mediaRecorder.onstop = async () => {
				if (stream) stream.getTracks().forEach((t) => t.stop());
				waveformRefs = stopWaveform(waveformRefs);
				stopLiveTranscription();
				stopRealtimeStream();
				await processRecording({
					chunks,
					mimeType,
					useRealtimeStream,
					transcriptionRefs,
					transcriptionCallbacks,
					onClearSavedRecording: clearSavedRecording
				});
			};

			mediaRecorder.start(CHUNK_INTERVAL_MS);
			setStatus('recording');
			if (useRealtimeStream) {
				startRealtimeStream();
			} else if (s.transcribeMode === 'local') {
				startLiveTranscription(liveTranscriptionRefs, liveTranscriptionCallbacks);
			}
		} catch (e) {
			setStatus('idle');
			const err = e instanceof DOMException ? e : null;
			if (err?.name === 'NotAllowedError') {
				setErrorType('mic_denied');
				setError(
					'Microfoontoegang is geweigerd. Klik op het slotje (of site-instellingen) in je adresbalk en zet "Microfoon" op "Toestaan".'
				);
			} else if (err?.name === 'NotFoundError') {
				setError('Geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.');
			} else {
				setError('Microfoon niet beschikbaar. Controleer je browserpermissies.');
			}
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

	function onFileUpload(e: Event) {
		handleFileUpload(e, transcriptionRefs, transcriptionCallbacks);
	}

	function onStartCorrection() {
		startCorrection(correctionRefs, correctionCallbacks);
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

		<TranscribeModeToggle
			transcribeMode={s.transcribeMode}
			localAvailable={s.localAvailable}
			assemblyAvailable={s.assemblyAvailable}
			onTranscribeModeChange={(v) => setTranscribeMode(v)}
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
			{onFileUpload}
		/>

		{#if s.error}
			<ErrorAlert
				error={s.error}
				errorType={s.errorType}
				savedRecordingId={s.savedRecordingId}
				onRetry={retryTranscription}
				onRequestMic={requestMicPermission}
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

				{#if s.status !== 'correcting'}
					<CorrectionControls
						mode={s.mode}
						reportLength={s.reportLength}
						localAvailable={s.localAvailable}
						mistralAvailable={s.mistralAvailable}
						estimatedCorrectionCost={s.estimatedCorrectionCost}
						onModeChange={(v) => setMode(v)}
						onReportLengthChange={(v) => setReportLength(v)}
						onGenerate={onStartCorrection}
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
