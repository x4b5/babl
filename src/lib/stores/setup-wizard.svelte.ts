/**
 * Setup wizard store — manages state for the local setup wizard.
 * Polls /health/setup every 3s when open, auto-advances steps.
 */

import { LOCAL_BACKEND_URL } from '$lib/stores/transcribe.svelte';

// ── Types ────────────────────────────────────────────────────

export interface ModelConfig {
	ollama: Record<string, string>; // quality level -> model name
	mistral: Record<string, string>;
	whisper: string;
}

export interface SetupStatus {
	backendRunning: boolean;
	ollamaRunning: boolean;
	ollamaModels: Record<string, boolean>;
	whisperAvailable: boolean;
	whisperModelCached: boolean;
	whisperDownloading: boolean;
	modelConfig: ModelConfig | null;
}

// ── Reactive state ────────────────────────────────────────────

export type WizardContext = 'full' | 'ollama';

let open = $state(false);
let wizardContext = $state<WizardContext>('full');
let currentStep = $state(0);
let status = $state<SetupStatus>({
	backendRunning: false,
	ollamaRunning: false,
	ollamaModels: {},
	whisperAvailable: false,
	whisperModelCached: false,
	whisperDownloading: false,
	modelConfig: null
});
let selectedModel = $state('gemma3:4b');
let ramConfirmed = $state(false);
let copiedCommand = $state('');
let modelDownloading = $state(false);
let modelDownloadProgress = $state<number | null>(null);
let modelDownloadError = $state('');
let pollInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

// ── Derived ──────────────────────────────────────────────────

const ollamaModelReady = $derived(status.ollamaModels[selectedModel] ?? false);

const allReady = $derived(
	wizardContext === 'ollama'
		? status.ollamaRunning && (status.ollamaModels[selectedModel] ?? false)
		: status.backendRunning
);

const recommendedStep = $derived.by(() => {
	if (wizardContext === 'ollama') {
		if (!status.ollamaRunning) return 0;
		if (!(status.ollamaModels[selectedModel] ?? false)) return 1;
		return 1;
	}
	if (!ramConfirmed) return 0;
	if (!status.backendRunning) return 1;
	return 1;
});

// ── Polling ──────────────────────────────────────────────────

async function fetchSetupStatus(): Promise<void> {
	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/health/setup`);
		const data = await resp.json();
		const modelConfig: ModelConfig | null = data.model_config
			? {
					ollama: data.model_config.ollama ?? {},
					mistral: data.model_config.mistral ?? {},
					whisper: data.model_config.whisper ?? ''
				}
			: null;
		status = {
			backendRunning: data.backend_running ?? false,
			ollamaRunning: data.ollama_running ?? false,
			ollamaModels: data.ollama_models ?? {},
			whisperAvailable: data.whisper_available ?? false,
			whisperModelCached: data.whisper_model_cached ?? false,
			whisperDownloading: data.whisper_downloading ?? false,
			modelConfig
		};
		// Update selectedModel to the medium Ollama model from config
		if (modelConfig?.ollama?.medium) {
			selectedModel = modelConfig.ollama.medium;
		}
	} catch {
		// Backend not running — check Ollama directly
		try {
			const ollamaResp = await fetch('http://localhost:11434/api/tags');
			const ollamaData = await ollamaResp.json();
			const available: string[] = (ollamaData.models ?? []).map((m: { name: string }) => m.name);
			// Build ollamaModels from whatever Ollama has installed
			const ollamaModels: Record<string, boolean> = {};
			for (const name of available) {
				ollamaModels[name] = true;
			}
			status = {
				backendRunning: false,
				ollamaRunning: true,
				ollamaModels,
				whisperAvailable: false,
				whisperModelCached: false,
				whisperDownloading: false,
				modelConfig: null
			};
		} catch {
			status = {
				backendRunning: false,
				ollamaRunning: false,
				ollamaModels: {},
				whisperAvailable: false,
				whisperModelCached: false,
				whisperDownloading: false,
				modelConfig: null
			};
		}
	}

	// Auto-advance to recommended step
	if (open) {
		currentStep = recommendedStep;
	}
}

function startPolling(): void {
	fetchSetupStatus();
	pollInterval = setInterval(fetchSetupStatus, 3000);
}

function stopPolling(): void {
	if (pollInterval) {
		clearInterval(pollInterval);
		pollInterval = undefined;
	}
}

// ── Actions ──────────────────────────────────────────────────

export function openWizard(context: WizardContext = 'full'): void {
	open = true;
	wizardContext = context;
	ramConfirmed = false;
	currentStep = 0;
	startPolling();
}

export function closeWizard(): void {
	open = false;
	stopPolling();
}

export function setStep(step: number): void {
	currentStep = step;
}

export function setSelectedModel(model: string): void {
	selectedModel = model;
}

export function confirmRam(): void {
	ramConfirmed = true;
	currentStep = recommendedStep;
}

export async function downloadModel(): Promise<void> {
	modelDownloading = true;
	modelDownloadProgress = 0;
	modelDownloadError = '';

	try {
		const resp = await fetch('http://localhost:11434/api/pull', {
			method: 'POST',
			body: JSON.stringify({ name: selectedModel, stream: true })
		});

		if (!resp.ok || !resp.body) {
			modelDownloadError = 'Ollama reageert niet. Is het geïnstalleerd en gestart?';
			return;
		}

		const reader = resp.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (!line.trim()) continue;
				try {
					const data = JSON.parse(line);
					if (data.total && data.completed) {
						modelDownloadProgress = Math.round((data.completed / data.total) * 100);
					}
					if (data.status === 'success') {
						modelDownloadProgress = 100;
					}
				} catch {
					/* ignore parse errors */
				}
			}
		}

		// Trigger a status refresh to detect the new model
		await fetchSetupStatus();
	} catch {
		modelDownloadError = 'Download mislukt. Controleer of Ollama draait.';
	} finally {
		modelDownloading = false;
		modelDownloadProgress = null;
	}
}

export async function downloadWhisper(): Promise<void> {
	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/download-whisper`, { method: 'POST' });
		if (!resp.ok) {
			console.error('Failed to start Whisper download');
		}
		// Polling will detect when download completes via whisper_model_cached
	} catch {
		console.error('Backend not reachable for Whisper download');
	}
}

export async function copyCommand(command: string): Promise<void> {
	await navigator.clipboard.writeText(command);
	copiedCommand = command;
	setTimeout(() => {
		copiedCommand = '';
	}, 1500);
}

// ── Getter object ────────────────────────────────────────────

export function getSetupWizardState() {
	return {
		get open() {
			return open;
		},
		get wizardContext() {
			return wizardContext;
		},
		get currentStep() {
			return currentStep;
		},
		get status() {
			return status;
		},
		get copiedCommand() {
			return copiedCommand;
		},
		get allReady() {
			return allReady;
		},
		get recommendedStep() {
			return recommendedStep;
		},
		get ollamaModelReady() {
			return ollamaModelReady;
		},
		get selectedModel() {
			return selectedModel;
		},
		get ramConfirmed() {
			return ramConfirmed;
		},
		get modelDownloading() {
			return modelDownloading;
		},
		get modelDownloadProgress() {
			return modelDownloadProgress;
		},
		get modelDownloadError() {
			return modelDownloadError;
		}
	};
}
