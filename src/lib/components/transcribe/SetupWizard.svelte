<script lang="ts">
	import {
		getSetupWizardState,
		closeWizard,
		setStep,
		copyCommand,
		setSelectedModel
	} from '$lib/stores/setup-wizard.svelte';
	import { setQuality } from '$lib/stores/transcribe.svelte';
	import type { Quality } from '$lib/stores/transcribe.svelte';

	interface Props {
		onClose?: () => void;
	}

	let { onClose }: Props = $props();

	const w = getSetupWizardState();

	function handleClose() {
		closeWizard();
		onClose?.();
	}

	interface ModelOption {
		label: string;
		model: string;
		quality: Quality;
		ram: string;
		description: string;
	}

	const modelOptions: ModelOption[] = [
		{
			label: 'Compact',
			model: 'gemma3:1b',
			quality: 'light',
			ram: '~1 GB',
			description: 'Basis — geschikt voor korte notities'
		},
		{
			label: 'Standaard',
			model: 'gemma3:4b',
			quality: 'medium',
			ram: '~3 GB',
			description: 'Goed — geschikt voor de meeste verslagen'
		},
		{
			label: 'Uitgebreid',
			model: 'gemma3:12b',
			quality: 'heavy',
			ram: '~8 GB',
			description: 'Beste kwaliteit — vereist krachtige laptop'
		}
	];

	function selectModel(opt: ModelOption) {
		setSelectedModel(opt.model);
		setQuality(opt.quality);
	}

	interface Step {
		title: string;
		done: boolean;
		commands: { label: string; cmd: string }[];
		description: string;
		hasModelChoice?: boolean;
	}

	const steps: Step[] = $derived([
		{
			title: 'AI-software installeren',
			done: w.status.ollamaRunning,
			description:
				'Ollama is een programma dat AI-modellen op jouw eigen computer kan draaien — zonder dat er iets naar het internet wordt gestuurd. Je installeert het via de terminal (opdrachtregel).',
			commands: [
				{ label: 'Installeer Ollama', cmd: 'brew install ollama' },
				{ label: 'Start de server', cmd: 'ollama serve' }
			]
		},
		{
			title: 'Taalmodel kiezen & downloaden',
			done: w.ollamaModelReady,
			description:
				'Kies een taalmodel dat past bij jouw computer. Een groter model geeft betere resultaten, maar heeft meer werkgeheugen (RAM) nodig.',
			commands: [{ label: 'Download model', cmd: `ollama pull ${w.selectedModel}` }],
			hasModelChoice: true
		},
		{
			title: 'BABL-server starten',
			done: w.status.backendRunning,
			description:
				'Start de BABL-server op jouw computer. Deze server verbindt de spraakherkenning (Whisper) met de tekstcorrectie (Ollama) zodat alles samenwerkt.',
			commands: [
				{ label: 'Alles-in-een', cmd: 'npm run transcribe' },
				{
					label: 'Of handmatig',
					cmd: 'cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000'
				}
			]
		}
	]);
</script>

{#if w.open}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		onclick={handleClose}
		aria-label="Sluit setup wizard"
	></button>

	<!-- Wizard panel -->
	<div
		class="fixed inset-x-4 bottom-4 top-auto z-50 mx-auto max-w-lg glass-strong rounded-2xl p-5 animate-slide-up sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
	>
		<!-- Header -->
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-white">Privé-modus activeren</h2>
			<button
				onclick={handleClose}
				class="rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Intro -->
		<p class="mb-4 text-sm text-white/50 leading-relaxed">
			Met de privé-modus wordt alle verwerking op jouw eigen computer gedaan. Er wordt niets naar
			het internet verstuurd.
		</p>
		<p class="mb-5 text-xs text-amber-400/60 leading-relaxed">
			Je hebt een terminal (opdrachtregel) nodig voor de stappen hieronder. Vraag hulp als je hier
			niet bekend mee bent.
		</p>

		<!-- Steps -->
		<div class="space-y-3">
			{#each steps as step, i}
				{@const isActive = w.currentStep === i && !step.done}
				{@const isPast = step.done}

				<div class="rounded-xl transition-all duration-200 {isActive ? 'glass p-4' : 'px-4 py-3'}">
					<!-- Step header -->
					<button class="flex w-full items-center gap-3 text-left" onclick={() => setStep(i)}>
						<!-- Status icon -->
						{#if isPast}
							<div
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"
							>
								<svg
									class="h-4 w-4 text-emerald-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
						{:else if isActive}
							<div
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon/20"
							>
								<span class="text-xs font-bold text-neon">{i + 1}</span>
							</div>
						{:else}
							<div
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5"
							>
								<span class="text-xs font-medium text-white/50">{i + 1}</span>
							</div>
						{/if}

						<span
							class="text-sm font-medium {isPast
								? 'text-emerald-400/70'
								: isActive
									? 'text-white'
									: 'text-white/55'}"
						>
							{step.title}
						</span>

						{#if isPast}
							<span class="ml-auto text-xs text-emerald-400/50">Klaar</span>
						{/if}
					</button>

					<!-- Expanded content (active step) -->
					{#if isActive}
						<div class="mt-3 space-y-3">
							<p class="text-sm text-white/60 leading-relaxed">{step.description}</p>

							{#if step.hasModelChoice}
								<div class="grid grid-cols-3 gap-2">
									{#each modelOptions as opt}
										{@const isSelected = w.selectedModel === opt.model}
										{@const isDownloaded = w.status.ollamaModels[opt.model] ?? false}
										<button
											onclick={() => selectModel(opt)}
											class="rounded-xl p-3 text-left transition-all {isSelected
												? 'bg-neon/15 ring-1 ring-neon/40'
												: 'bg-white/5 hover:bg-white/10'}"
										>
											<div class="flex items-center justify-between">
												<span
													class="text-xs font-semibold {isSelected ? 'text-neon' : 'text-white/80'}"
													>{opt.label}</span
												>
												{#if isDownloaded}
													<svg
														class="h-3.5 w-3.5 text-emerald-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2.5"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												{/if}
											</div>
											<span class="mt-1 block text-[10px] text-white/40">{opt.ram} RAM</span>
											<span class="mt-0.5 block text-[10px] text-white/30 leading-tight"
												>{opt.description}</span
											>
										</button>
									{/each}
								</div>
							{/if}

							{#each step.commands as { label, cmd }}
								<div>
									<span class="mb-1 block text-xs uppercase tracking-wider text-white/50"
										>{label}</span
									>
									<div class="flex items-center gap-2">
										<code
											class="flex-1 rounded-lg bg-black/30 px-3 py-2 text-xs font-mono text-neon/80 select-all overflow-x-auto"
										>
											{cmd}
										</code>
										<button
											onclick={() => copyCommand(cmd)}
											class="shrink-0 rounded-lg bg-white/5 p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white/80"
											aria-label="Kopieer commando"
										>
											{#if w.copiedCommand === cmd}
												<svg
													class="h-4 w-4 text-emerald-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											{:else}
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
													/>
												</svg>
											{/if}
										</button>
									</div>
								</div>
							{/each}

							<!-- Polling indicator -->
							<p class="flex items-center gap-1.5 text-xs text-white/45">
								<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon/40"></span>
								Checkt automatisch elke 3 seconden...
							</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- All ready -->
		{#if w.allReady}
			<div class="mt-4 rounded-xl bg-emerald-500/10 p-4 text-center">
				<p class="text-sm font-medium text-emerald-400">Alles is klaar!</p>
				<p class="mt-1 text-sm text-emerald-400/60">
					Je kunt nu lokaal transcriberen en corrigeren.
				</p>
				<button
					onclick={handleClose}
					class="mt-3 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
				>
					Klaar
				</button>
			</div>
		{/if}
	</div>
{/if}
