/**
 * Setup wizard store — manages state for the local setup wizard.
 * Polls /health/setup every 3s when open, auto-advances steps.
 */

import { LOCAL_BACKEND_URL, setModelFamily, setMode } from '$lib/stores/transcribe.svelte';

// ── Types ────────────────────────────────────────────────────

interface ModelConfig {
	ollama: Record<string, string>; // quality level -> model name
	mistral: Record<string, string>;
	whisper: string;
}

interface SetupStatus {
	backendRunning: boolean;
	ollamaRunning: boolean;
	ollamaModels: Record<string, boolean>;
	whisperAvailable: boolean;
	whisperModelCached: boolean;
	whisperDownloading: boolean;
	modelConfig: ModelConfig | null;
}

// ── Model families ──────────────────────────────────────────

export const MODEL_FAMILIES: Record<string, Record<string, string>> = {
	qwen3: { light: 'qwen3:1.7b', medium: 'qwen3:4b', heavy: 'qwen3:14b' },
	gemma3: { light: 'gemma3:1b', medium: 'gemma3:4b', heavy: 'gemma3:12b' },
	mistral: { light: 'mistral:7b', medium: 'mistral-nemo', heavy: 'mistral-small' },
	phi4: { light: 'phi4-mini', medium: 'phi4-mini', heavy: 'phi4' },
	llama3: { light: 'llama3.2:1b', medium: 'llama3.2:3b', heavy: 'llama3.2:3b' }
};

export const MODEL_FAMILY_LABELS: Record<string, string> = {
	qwen3: 'Qwen 3',
	gemma3: 'Gemma 3',
	mistral: 'Mistral',
	phi4: 'Phi-4',
	llama3: 'Llama 3.2'
};

export const MODEL_FAMILY_DESCRIPTIONS: Record<string, string> = {
	qwen3:
		'Aanbevolen — door Alibaba (China), ondersteunt 119 talen waaronder sterk Nederlands. Beste keuze voor Limburgs dialect.',
	gemma3:
		'Door Google, goede allrounder voor Europese talen. Compact en snel, maar iets minder sterk in dialect.',
	mistral:
		'Door Mistral AI (Frankrijk), Europees model met degelijk Nederlands. Grotere modellen maar betrouwbaar.',
	phi4: 'Door Microsoft, sterk in redeneren en logica. Nederlands is beperkt ondersteund, niet ideaal voor dialect.',
	llama3:
		'Door Meta (Facebook), populair open model. Nederlands niet officieel ondersteund — alleen geschikt om te experimenteren.'
};

export const MODEL_RAM_INFO: Record<string, Record<string, { storage: string; ram: string }>> = {
	qwen3: {
		light: { storage: '~1.5 GB', ram: '~2 GB' },
		medium: { storage: '~3 GB', ram: '~4 GB' },
		heavy: { storage: '~9 GB', ram: '~10 GB' }
	},
	gemma3: {
		light: { storage: '~1 GB', ram: '~2 GB' },
		medium: { storage: '~3 GB', ram: '~4 GB' },
		heavy: { storage: '~8 GB', ram: '~9 GB' }
	},
	mistral: {
		light: { storage: '~4 GB', ram: '~5 GB' },
		medium: { storage: '~7 GB', ram: '~8 GB' },
		heavy: { storage: '~13 GB', ram: '~14 GB' }
	},
	phi4: {
		light: { storage: '~2.5 GB', ram: '~4 GB' },
		medium: { storage: '~2.5 GB', ram: '~4 GB' },
		heavy: { storage: '~9 GB', ram: '~10 GB' }
	},
	llama3: {
		light: { storage: '~1 GB', ram: '~2 GB' },
		medium: { storage: '~2 GB', ram: '~3 GB' },
		heavy: { storage: '~2 GB', ram: '~3 GB' }
	}
};

// ── Reactive state ────────────────────────────────────────────

export type WizardContext = 'full' | 'ollama';

let open = $state(false);
let wizardContext = $state<WizardContext>('full');
let selectedFamily = $state('qwen3');
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
let selectedModel = $state('qwen3:4b');
let ramConfirmed = $state(false);
let installConfirmed = $state(false);
let copiedCommand = $state('');
let modelDownloading = $state(false);
let modelDownloadingName = $state('');
let modelDownloadProgress = $state<number | null>(null);
let modelDownloadError = $state('');
let pollInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

// ── Derived ──────────────────────────────────────────────────

const ollamaModelReady = $derived.by(() => {
	const familyModels = MODEL_FAMILIES[selectedFamily];
	if (familyModels) {
		return Object.values(familyModels).every((model) => status.ollamaModels[model] ?? false);
	}
	return status.ollamaModels[selectedModel] ?? false;
});

const anyOllamaModelReady = $derived.by(() => {
	const familyModels = MODEL_FAMILIES[selectedFamily];
	if (familyModels) {
		return Object.values(familyModels).some((model) => status.ollamaModels[model] ?? false);
	}
	return status.ollamaModels[selectedModel] ?? false;
});

const allReady = $derived(
	wizardContext === 'ollama'
		? status.ollamaRunning && anyOllamaModelReady
		: status.backendRunning && status.whisperModelCached
);

const recommendedStep = $derived.by(() => {
	if (wizardContext === 'ollama') {
		if (!ramConfirmed) return 0;
		if (!status.ollamaRunning) return 1;
		if (!anyOllamaModelReady) return 2;
		return 2;
	}
	if (!ramConfirmed) return 0;
	if (!installConfirmed && !status.backendRunning) return 1;
	if (!status.backendRunning) return 2;
	if (!status.whisperModelCached) return 3;
	return 3;
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
		// Update selectedModel to the medium Ollama model from selected family
		const familyModels = MODEL_FAMILIES[selectedFamily];
		if (familyModels?.medium) {
			selectedModel = familyModels.medium;
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
	installConfirmed = false;
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

export function setSelectedFamily(family: string): void {
	selectedFamily = family;
	setModelFamily(family);
	const familyModels = MODEL_FAMILIES[family];
	if (familyModels?.medium) {
		selectedModel = familyModels.medium;
	}
}

export function confirmRam(): void {
	ramConfirmed = true;
	currentStep = recommendedStep;
}

export function confirmInstall(): void {
	installConfirmed = true;
	currentStep = recommendedStep;
}

export async function downloadModel(modelName?: string): Promise<void> {
	const target = modelName ?? selectedModel;
	modelDownloading = true;
	modelDownloadingName = target;
	modelDownloadProgress = 0;
	modelDownloadError = '';

	try {
		const resp = await fetch('http://localhost:11434/api/pull', {
			method: 'POST',
			body: JSON.stringify({ name: target, stream: true })
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
		// Auto-switch polishing mode to 'local' so the downloaded model gets used
		setMode('local');
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
		get selectedFamily() {
			return selectedFamily;
		},
		get selectedModel() {
			return selectedModel;
		},
		get ramConfirmed() {
			return ramConfirmed;
		},
		get installConfirmed() {
			return installConfirmed;
		},
		get modelDownloading() {
			return modelDownloading;
		},
		get modelDownloadingName() {
			return modelDownloadingName;
		},
		get modelDownloadProgress() {
			return modelDownloadProgress;
		},
		get modelDownloadError() {
			return modelDownloadError;
		}
	};
}
