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
	import ProcessSteps from '$lib/components/transcribe/ProcessSteps.svelte';
	import SettingsPanel from '$lib/components/transcribe/SettingsPanel.svelte';
	import RecordButton from '$lib/components/transcribe/RecordButton.svelte';
	import ErrorAlert from '$lib/components/transcribe/ErrorAlert.svelte';
	import RawTranscriptionCard from '$lib/components/transcribe/RawTranscriptionCard.svelte';
	import PolishedResultCard from '$lib/components/transcribe/PolishedResultCard.svelte';
	import PrivacyFooter from '$lib/components/transcribe/PrivacyFooter.svelte';
	import SetupWizard from '$lib/components/transcribe/SetupWizard.svelte';
	import ApiConsentModal from '$lib/components/transcribe/ApiConsentModal.svelte';

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
	import {
		startWaveform,
		stopWaveform,
		pauseWaveform,
		resumeWaveform,
		type WaveformRefs
	} from '$lib/services/waveform';
	import {
		processRecording,
		handleFileUpload,
		requestMicPermission,
		acquireMicrophone
	} from '$lib/services/recording';

	// API Consent
	import { getApiConsentState, loadApiConsent } from '$lib/stores/api-consent.svelte';

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
		setPolishedExpanded,
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
	const apiConsent = getApiConsentState();

	// ── API Consent modal ────────────────────────────────────────
	let showApiConsentModal = $state(false);
	let pendingAction: (() => void) | null = $state(null);

	function needsApiConsent(): boolean {
		return s.transcribeMode === 'api' && !apiConsent.isGranted;
	}

	function handleApiConsentGranted() {
		showApiConsentModal = false;
		const action = pendingAction;
		pendingAction = null;
		action?.();
	}

	function handleApiConsentDenied() {
		showApiConsentModal = false;
		pendingAction = null;
	}

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
	let shouldAutoPolish = false;
	let lastClickTime = 0;
	const DOUBLE_CLICK_MS = 400;
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
			shouldAutoPolish = true;
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
			if (!timerInterval) {
				timerInterval = setInterval(() => incrementElapsed(), 1000);
			}
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
		loadApiConsent();
	});

	// ── Auto-polish: start polishing automatically after transcription ──
	$effect(() => {
		if (shouldAutoPolish && s.raw && s.status === 'idle' && !s.error) {
			shouldAutoPolish = false;
			onStartPolishing();
		}
	});

	$effect(() => {
		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (
				s.status === 'recording' ||
				s.status === 'paused' ||
				s.status === 'processing' ||
				s.status === 'polishing'
			) {
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
		setElapsed(0);
		setStatus('recording');
		if (useRealtimeStream) {
			startRealtimeStream();
		}
	}

	function stopRecording() {
		if (
			mediaRecorder &&
			(mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')
		) {
			mediaRecorder.stop();
			setStatus('processing');
			shouldAutoPolish = true;
		}
	}

	function pauseRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.pause();
			waveformRefs = pauseWaveform(waveformRefs);
			setStatus('paused');
		}
	}

	function resumeRecording() {
		if (mediaRecorder && mediaRecorder.state === 'paused') {
			mediaRecorder.resume();
			waveformRefs = resumeWaveform(waveformRefs);
			setStatus('recording');
		}
	}

	function toggleRecording() {
		const now = Date.now();
		const isDoubleClick = now - lastClickTime < DOUBLE_CLICK_MS;
		lastClickTime = now;

		if (s.status === 'recording') {
			if (isDoubleClick) {
				stopRecording();
			} else {
				pauseRecording();
			}
		} else if (s.status === 'paused') {
			if (isDoubleClick) {
				stopRecording();
			} else {
				resumeRecording();
			}
		} else if (s.status === 'idle') {
			if (needsApiConsent()) {
				pendingAction = () => startRecording();
				showApiConsentModal = true;
				return;
			}
			startRecording();
		} else if (s.status === 'preparing') {
			setStatus('idle');
			setCountdown(0);
		}
	}

	function onFileUpload(e: Event) {
		if (needsApiConsent()) {
			pendingAction = () => {
				shouldAutoPolish = true;
				handleFileUpload(e, transcriptionRefs, transcriptionCallbacks);
			};
			showApiConsentModal = true;
			return;
		}
		shouldAutoPolish = true;
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

		<div class="mb-6 sm:mb-10">
			<SettingsPanel
				transcribeMode={s.transcribeMode}
				polishMode={s.mode}
				reportLength={s.reportLength}
				localAvailable={s.localAvailable}
				assemblyAvailable={s.assemblyAvailable}
				ollamaAvailable={s.ollamaAvailable}
				mistralAvailable={s.mistralAvailable}
				onTranscribeModeChange={(v) => setTranscribeMode(v)}
				onPolishModeChange={(v) => setMode(v)}
				onReportLengthChange={(v) => setReportLength(v)}
				onOpenSetupWizard={handleOpenSetupWizard}
				onOpenOllamaWizard={handleOpenOllamaWizard}
			/>
		</div>

		{#if s.status !== 'idle'}
			<ProcessSteps status={s.status} hasRaw={!!s.raw} hasPolished={!!s.polished} />
		{/if}

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
					savedRecordingId={s.savedRecordingId}
				/>

				<PolishedResultCard
					polished={s.polished}
					status={s.status}
					expanded={s.polishedExpanded}
					copiedPolished={s.copiedPolished}
					polishMode={s.mode}
					aiMetadata={s.polishAiMetadata}
					onToggleExpand={() => setPolishedExpanded(!s.polishedExpanded)}
				/>

				{#if s.raw && !s.polished && s.status === 'idle' && !s.error}
					<div class="flex flex-col items-center gap-3">
						<div class="glass flex rounded-full p-1">
							<button
								onclick={() => setReportLength('samenvatting')}
								class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 {s.reportLength ===
								'samenvatting'
									? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
									: 'text-white/40 hover:text-white/70'}"
							>
								Samenvatting
							</button>
							<button
								onclick={() => setReportLength('verslaglegging')}
								class="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 {s.reportLength ===
								'verslaglegging'
									? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
									: 'text-white/40 hover:text-white/70'}"
							>
								Verslaglegging
							</button>
						</div>
						<button
							onclick={onStartPolishing}
							class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3.5 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98]"
						>
							{s.reportLength === 'samenvatting' ? 'Samenvatting genereren' : 'Verslag genereren'}
						</button>
					</div>
				{/if}

				{#if s.polished}
					<FeedbackWidget
						rawText={s.raw}
						polishedText={s.polished}
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

	<ApiConsentModal
		visible={showApiConsentModal}
		onConsent={handleApiConsentGranted}
		onDeny={handleApiConsentDenied}
	/>

	<SetupWizard onClose={() => checkBackendHealth()} />
</div>
