/**
 * Transcribe store — single source of truth for all transcription state.
 * Follows the getter-object pattern from game.svelte.ts.
 */

import type { ErrorType } from '$lib/utils/error-types';

// ── Type definitions ──────────────────────────────────────────

export type Status = 'idle' | 'preparing' | 'recording' | 'processing' | 'correcting';
export type Quality = 'light' | 'medium';
export type Lang = 'auto' | 'nl' | 'li' | 'en';
export type Mode = 'local' | 'api';
export type ReportLength = 'kort' | 'middellang' | 'lang';
export type ApiStreamMode = 'realtime' | 'accurate';

export interface WordWithConfidence {
	text: string;
	confidence: number;
	speaker?: string;
}

export interface EvalResult {
	wer: number;
	cer: number;
	substitutions: number;
	deletions: number;
	insertions: number;
	totalWords: number;
}

// ── Constants ─────────────────────────────────────────────────

export const LOCAL_BACKEND_URL = 'http://localhost:8000';
export const MAX_AUTO_RETRIES = 3;
export const OVERLAP_CHUNKS = 6; // 3 seconds overlap at 500ms per chunk
export const CHUNK_INTERVAL_MS = 500; // MediaRecorder timeslice
export const SSE_STALL_TIMEOUT_MS = 30000; // 30s: abort SSE stream if no data received
export const RECORDING_MAX_SECONDS = 2 * 60 * 60; // 120 minuten max
export const RECORDING_WARN_SECONDS = 110 * 60; // waarschuwing bij 110 minuten

// AssemblyAI cost: $0.17/hour (Universal-2 $0.15 + speaker diarization $0.02)
const ASSEMBLYAI_COST_PER_SECOND = 0.17 / 3600;

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

// ── Reactive state ────────────────────────────────────────────

let status = $state<Status>('idle');
let countdown = $state(0);
let raw = $state('');
let corrected = $state('');
let language = $state('');
let error = $state('');
let errorType = $state<ErrorType | ''>('');
let countdownSeconds = $state(0);
let retryCount = $state(0);
let elapsed = $state(0);
let copiedRaw = $state(false);
let copiedCorrected = $state(false);
let correctedExpanded = $state(false);
let quality = $state<Quality>('medium');
const lang: Lang = 'li';
let mode = $state<Mode>('api');
let reportLength = $state<ReportLength>('middellang');
let transcribeMode = $state<Mode>('api');
let apiStreamMode = $state<ApiStreamMode>('accurate');
let temperature = $state(0.5);
let reconnecting = $state(false);
let reconnectStatus = $state('');
let mistralAvailable = $state(false);
let assemblyAvailable = $state(false);
let localAvailable = $state(false);
let privacyOpen = $state(false);
let rawExpanded = $state(false);
let keepDialect = $state(false);
let confidenceWords = $state<WordWithConfidence[]>([]);
let lowConfidenceCount = $state(0);
let evalResult = $state<EvalResult | null>(null);
let partialText = $state('');
let liveWorking = $state(false);
let liveSegments = $state<string[]>([]);
let lastSentChunkIndex = $state(0);
let liveAudioDuration = $state(0);
let lastSegmentEnd = $state(0);
let apiStatus = $state('');
let processingElapsed = $state(0);
let recordingDuration = $state(0);
let waveformBars = $state<number[]>(new Array(40).fill(3));
let savedRecordingId = $state<string | null>(null);
let savedRecordingMimeType = $state('');

// ── Derived values ────────────────────────────────────────────

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

const estimatedTranscribeCost = $derived.by(() => {
	const seconds = status === 'recording' ? elapsed : recordingDuration;
	return (seconds * ASSEMBLYAI_COST_PER_SECOND).toFixed(4);
});

const estimatedCorrectionCost = $derived.by(() => {
	const wordCount = raw ? raw.split(/\s+/).length : 0;
	const costPerWord = MISTRAL_COST_PER_WORD[quality] ?? MISTRAL_COST_PER_WORD['light'];
	const lengthFactor = REPORT_LENGTH_FACTOR[reportLength] ?? 1;
	return (wordCount * costPerWord * lengthFactor).toFixed(4);
});

// ── Getter object ─────────────────────────────────────────────

export function getTranscribeState() {
	return {
		get status() {
			return status;
		},
		get countdown() {
			return countdown;
		},
		get raw() {
			return raw;
		},
		get corrected() {
			return corrected;
		},
		get language() {
			return language;
		},
		get error() {
			return error;
		},
		get errorType() {
			return errorType;
		},
		get countdownSeconds() {
			return countdownSeconds;
		},
		get retryCount() {
			return retryCount;
		},
		get elapsed() {
			return elapsed;
		},
		get copiedRaw() {
			return copiedRaw;
		},
		get copiedCorrected() {
			return copiedCorrected;
		},
		get correctedExpanded() {
			return correctedExpanded;
		},
		get quality() {
			return quality;
		},
		get lang() {
			return lang;
		},
		get mode() {
			return mode;
		},
		get reportLength() {
			return reportLength;
		},
		get transcribeMode() {
			return transcribeMode;
		},
		get apiStreamMode() {
			return apiStreamMode;
		},
		get temperature() {
			return temperature;
		},
		get reconnecting() {
			return reconnecting;
		},
		get reconnectStatus() {
			return reconnectStatus;
		},
		get mistralAvailable() {
			return mistralAvailable;
		},
		get assemblyAvailable() {
			return assemblyAvailable;
		},
		get localAvailable() {
			return localAvailable;
		},
		get privacyOpen() {
			return privacyOpen;
		},
		get rawExpanded() {
			return rawExpanded;
		},
		get keepDialect() {
			return keepDialect;
		},
		get confidenceWords() {
			return confidenceWords;
		},
		get lowConfidenceCount() {
			return lowConfidenceCount;
		},
		get evalResult() {
			return evalResult;
		},
		get partialText() {
			return partialText;
		},
		get liveWorking() {
			return liveWorking;
		},
		get liveSegments() {
			return liveSegments;
		},
		get lastSentChunkIndex() {
			return lastSentChunkIndex;
		},
		get liveAudioDuration() {
			return liveAudioDuration;
		},
		get lastSegmentEnd() {
			return lastSegmentEnd;
		},
		get apiStatus() {
			return apiStatus;
		},
		get processingElapsed() {
			return processingElapsed;
		},
		get recordingDuration() {
			return recordingDuration;
		},
		get waveformBars() {
			return waveformBars;
		},
		get savedRecordingId() {
			return savedRecordingId;
		},
		get savedRecordingMimeType() {
			return savedRecordingMimeType;
		},
		// Derived
		get formattedTime() {
			return formattedTime;
		},
		get formattedProcessingTime() {
			return formattedProcessingTime;
		},
		get estimatedProcessingTime() {
			return estimatedProcessingTime;
		},
		get processingProgress() {
			return processingProgress;
		},
		get recordingWarning() {
			return recordingWarning;
		},
		get estimatedTranscribeCost() {
			return estimatedTranscribeCost;
		},
		get estimatedCorrectionCost() {
			return estimatedCorrectionCost;
		}
	};
}

// ── Setters ───────────────────────────────────────────────────

export function setStatus(v: Status) {
	status = v;
}
export function setCountdown(v: number) {
	countdown = v;
}
export function setRaw(v: string) {
	raw = v;
}
export function setCorrected(v: string) {
	corrected = v;
}
export function setLanguage(v: string) {
	language = v;
}
export function setError(v: string) {
	error = v;
}
export function setErrorType(v: ErrorType | '') {
	errorType = v;
}
export function setCountdownSeconds(v: number) {
	countdownSeconds = v;
}
export function setRetryCount(v: number) {
	retryCount = v;
}
export function setElapsed(v: number) {
	elapsed = v;
}
export function incrementElapsed() {
	elapsed += 1;
}
export function setCopiedRaw(v: boolean) {
	copiedRaw = v;
}
export function setCopiedCorrected(v: boolean) {
	copiedCorrected = v;
}
export function setCorrectedExpanded(v: boolean) {
	correctedExpanded = v;
}
export function setQuality(v: Quality) {
	quality = v;
}
export function setMode(v: Mode) {
	mode = v;
}
export function setReportLength(v: ReportLength) {
	reportLength = v;
}
export function setTranscribeMode(v: Mode) {
	transcribeMode = v;
}
export function setApiStreamMode(v: ApiStreamMode) {
	apiStreamMode = v;
}
export function setTemperature(v: number) {
	temperature = v;
}
export function setReconnecting(v: boolean) {
	reconnecting = v;
}
export function setReconnectStatus(v: string) {
	reconnectStatus = v;
}
export function setMistralAvailable(v: boolean) {
	mistralAvailable = v;
}
export function setAssemblyAvailable(v: boolean) {
	assemblyAvailable = v;
}
export function setLocalAvailable(v: boolean) {
	localAvailable = v;
}
export function setPrivacyOpen(v: boolean) {
	privacyOpen = v;
}
export function setRawExpanded(v: boolean) {
	rawExpanded = v;
}
export function setKeepDialect(v: boolean) {
	keepDialect = v;
}
export function setConfidenceWords(v: WordWithConfidence[]) {
	confidenceWords = v;
}
export function setLowConfidenceCount(v: number) {
	lowConfidenceCount = v;
}
export function setEvalResult(v: EvalResult | null) {
	evalResult = v;
}
export function setPartialText(v: string) {
	partialText = v;
}
export function setLiveWorking(v: boolean) {
	liveWorking = v;
}
export function setLiveSegments(v: string[]) {
	liveSegments = v;
}
export function setLastSentChunkIndex(v: number) {
	lastSentChunkIndex = v;
}
export function setLiveAudioDuration(v: number) {
	liveAudioDuration = v;
}
export function setLastSegmentEnd(v: number) {
	lastSegmentEnd = v;
}
export function setApiStatus(v: string) {
	apiStatus = v;
}
export function setProcessingElapsed(v: number) {
	processingElapsed = v;
}
export function incrementProcessingElapsed() {
	processingElapsed += 1;
}
export function setRecordingDuration(v: number) {
	recordingDuration = v;
}
export function setWaveformBars(v: number[]) {
	waveformBars = v;
}
export function appendCorrected(v: string) {
	corrected += v;
}
export function appendRaw(v: string) {
	raw = raw ? `${raw}\n${v}` : v;
}
export function appendPartialText(v: string) {
	partialText = partialText ? `${partialText} ${v}` : v;
}
export function setSavedRecordingId(v: string | null) {
	savedRecordingId = v;
}
export function setSavedRecordingMimeType(v: string) {
	savedRecordingMimeType = v;
}

/** Copy text to clipboard and flash the copied indicator. */
export async function copyText(text: string, which: 'raw' | 'corrected') {
	await navigator.clipboard.writeText(text);
	if (which === 'raw') {
		copiedRaw = true;
		setTimeout(() => (copiedRaw = false), 1500);
	} else {
		copiedCorrected = true;
		setTimeout(() => (copiedCorrected = false), 1500);
	}
}

/** Reset correction state for a new correction attempt. */
export function resetForCorrection() {
	corrected = '';
	correctedExpanded = false;
	error = '';
	errorType = '';
	retryCount = 0;
	countdownSeconds = 0;
	status = 'correcting';
}

/** Reset transcription results for a new audio send. */
export function resetForTranscription() {
	raw = '';
	corrected = '';
	error = '';
	apiStatus = '';
	confidenceWords = [];
	lowConfidenceCount = 0;
	evalResult = null;
}
