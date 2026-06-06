/**
 * Setup wizard store — manages state for the local setup wizard.
 * Polls /health/setup every 3s when open, auto-advances steps.
 */

import { LOCAL_BACKEND_URL } from '$lib/stores/transcribe.svelte';

// ── Types ────────────────────────────────────────────────────

export interface SetupStatus {
	backendRunning: boolean;
	ollamaRunning: boolean;
	ollamaModels: Record<string, boolean>;
	whisperAvailable: boolean;
}

// ── Reactive state ────────────────────────────────────────────

let open = $state(false);
let currentStep = $state(0);
let status = $state<SetupStatus>({
	backendRunning: false,
	ollamaRunning: false,
	ollamaModels: {},
	whisperAvailable: false
});
let selectedModel = $state('gemma3:4b');
let copiedCommand = $state('');
let pollInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

// ── Derived ──────────────────────────────────────────────────

const ollamaModelReady = $derived(status.ollamaModels[selectedModel] ?? false);

const allReady = $derived(status.backendRunning && status.ollamaRunning && ollamaModelReady);

const recommendedStep = $derived.by(() => {
	if (!status.ollamaRunning) return 0;
	if (!ollamaModelReady) return 1;
	if (!status.backendRunning) return 2;
	return 2; // All done
});

// ── Polling ──────────────────────────────────────────────────

async function fetchSetupStatus(): Promise<void> {
	try {
		const resp = await fetch(`${LOCAL_BACKEND_URL}/health/setup`);
		const data = await resp.json();
		status = {
			backendRunning: data.backend_running ?? false,
			ollamaRunning: data.ollama_running ?? false,
			ollamaModels: data.ollama_models ?? {},
			whisperAvailable: data.whisper_available ?? false
		};
	} catch {
		// Backend not running — check Ollama directly
		try {
			const ollamaResp = await fetch('http://localhost:11434/api/tags');
			const ollamaData = await ollamaResp.json();
			const available = new Set((ollamaData.models ?? []).map((m: { name: string }) => m.name));
			status = {
				backendRunning: false,
				ollamaRunning: true,
				ollamaModels: {
					'gemma3:1b': available.has('gemma3:1b'),
					'gemma3:4b': available.has('gemma3:4b'),
					'gemma3:12b': available.has('gemma3:12b')
				},
				whisperAvailable: false
			};
		} catch {
			status = {
				backendRunning: false,
				ollamaRunning: false,
				ollamaModels: {},
				whisperAvailable: false
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

export function openWizard(): void {
	open = true;
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
		}
	};
}
