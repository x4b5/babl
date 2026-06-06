<script lang="ts">
	import {
		cleanupMediaResources,
		cleanupNetworkResources,
		cleanupTimers
	} from '$lib/utils/cleanup';
	import { getRecording, deleteRecording, pruneRecordings } from '$lib/utils/recording-db';
	import { checkBackendHealth } from '$lib/utils/health-check';
	import EvaluationScore from '$lib/components/EvaluationScore.svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';

	// Components
	import AppHeader from '$lib/components/transcribe/AppHeader.svelte';
	import TranscribeModeToggle from '$lib/components/transcribe/TranscribeModeToggle.svelte';
	import RecordButton from '$lib/components/transcribe/RecordButton.svelte';
	import ErrorAlert from '$lib/components/transcribe/ErrorAlert.svelte';
	import RawTranscriptionCard from '$lib/components/transcribe/RawTranscriptionCard.svelte';
	import PolishingControls from '$lib/components/transcribe/PolishingControls.svelte';
	import PolishedResultCard from '$lib/components/transcribe/PolishedResultCard.svelte';
	import PrivacyFooter from '$lib/components/transcribe/PrivacyFooter.svelte';
	import SetupWizard from '$lib/components/transcribe/SetupWizard.svelte';

	// Services
	import { sendAudio } from '$lib/services/transcription';
	import { stopLiveTranscription } from '$lib/services/live-transcription';
	import { startPolishing, handleErrorEvent } from '$lib/services/polishing';
	import {
		startRealtimeStream,
		stopRealtimeStream,
		sendChunkToStream,
		getStreamSocket,
		getStreamStallTimer
	} from '$lib/services/realtime-stream';
	import { openWizard, closeWizard as closeSetupWizard } from '$lib/stores/setup-wizard.svelte';
	import { startWaveform, stopWaveform, type WaveformRefs } from '$lib/services/waveform';
	import {
		processRecording,
		handleFileUpload,
		requestMicPermission,
		acquireMicrophone
	} from '$lib/services/recording';

	// Store
	import {
		getTranscribeState,
		CHUNK_INTERVAL_MS,
		RECORDING_MAX_SECONDS,
		setStatus,
		setCountdown,
		setError,
		setErrorType,
		setElapsed,
		incrementElapsed,
		setCorrectedExpanded,
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
	let polishingController: AbortController | undefined;
	let liveChunkController: AbortController | undefined;
	let apiPollController: AbortController | undefined;
	let waveformRefs: WaveformRefs = {
		audioContext: undefined,
		analyser: undefined,
		animationFrameId: undefined
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
			handleErrorEvent(event, polishingRefs, polishingCallbacks);
		}
	};

	const polishingCallbacks = {
		setPolishingController: (v: AbortController | undefined) => {
			polishingController = v;
		},
		setCountdownInterval: (v: ReturnType<typeof setInterval> | undefined) => {
			countdownInterval = v;
		}
	};

	// Lazy refs so polishing service always reads current values
	const polishingRefs = {
		get polishingController() {
			return polishingController;
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
		checkBackendHealth();
		pruneRecordings(5).catch(() => {});
	});

	$effect(() => {
		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (s.status === 'recording' || s.status === 'processing' || s.status === 'polishing') {
				e.preventDefault();
				e.returnValue = '';
			}
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
			polishingController,
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
		polishingController = undefined;
		liveChunkController = undefined;
		apiPollController = undefined;
		waveformRefs = { audioContext: undefined, analyser: undefined, animationFrameId: undefined };
		mediaRecorder = undefined;
	}

	// ── Recording ─────────────────────────────────────────────────

	async function startRecording() {
		const result = await acquireMicrophone();
		if (!result) return;

		const { stream: micStream, mimeType } = result;
		stream = micStream;
		mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
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

	function onStartPolishing() {
		startPolishing(polishingRefs, polishingCallbacks);
	}

	function handleOpenSetupWizard() {
		openWizard('full');
	}

	function handleOpenOllamaWizard() {
		openWizard('ollama');
	}
</script>

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
			onOpenSetupWizard={handleOpenSetupWizard}
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
			localAvailable={s.localAvailable}
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
				onOpenSetupWizard={handleOpenOllamaWizard}
			/>
		{/if}

		{#if s.raw}
			<div class="animate-slide-up space-y-4">
				<RawTranscriptionCard
					raw={s.raw}
					language={s.language}
					confidenceWords={s.confidenceWords}
					transcribeMode={s.transcribeMode}
					copiedRaw={s.copiedRaw}
				/>

				{#if s.status !== 'polishing' && s.status !== 'processing'}
					<PolishingControls
						mode={s.mode}
						reportLength={s.reportLength}
						localAvailable={s.localAvailable}
						ollamaAvailable={s.ollamaAvailable}
						mistralAvailable={s.mistralAvailable}
						estimatedPolishingCost={s.estimatedPolishingCost}
						onModeChange={(v) => setMode(v)}
						onReportLengthChange={(v) => setReportLength(v)}
						onGenerate={onStartPolishing}
						onOpenSetupWizard={handleOpenOllamaWizard}
					/>
				{/if}

				<PolishedResultCard
					corrected={s.corrected}
					status={s.status}
					expanded={s.correctedExpanded}
					copiedCorrected={s.copiedCorrected}
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

		<PrivacyFooter />
	</div>

	<SetupWizard onClose={() => checkBackendHealth()} />
</div>
