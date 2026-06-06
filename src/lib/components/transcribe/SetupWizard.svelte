<script lang="ts">
	import {
		getSetupWizardState,
		closeWizard,
		setStep,
		copyCommand
	} from '$lib/stores/setup-wizard.svelte';

	interface Props {
		onClose?: () => void;
	}

	let { onClose }: Props = $props();

	const w = getSetupWizardState();

	function handleClose() {
		closeWizard();
		onClose?.();
	}

	interface Step {
		title: string;
		done: boolean;
		commands: { label: string; cmd: string }[];
		description: string;
	}

	const steps: Step[] = $derived([
		{
			title: 'Ollama installeren',
			done: w.status.ollamaRunning,
			description:
				'Ollama is een tool om AI-modellen lokaal te draaien. Installeer het en start de server.',
			commands: [
				{ label: 'Installeer Ollama', cmd: 'brew install ollama' },
				{ label: 'Start de server', cmd: 'ollama serve' }
			]
		},
		{
			title: 'Model downloaden',
			done: w.ollamaModelReady,
			description:
				'Download het Gemma 3 model (2.3 GB). Dit is het AI-model dat je tekst corrigeert.',
			commands: [{ label: 'Download model', cmd: 'ollama pull gemma3:4b' }]
		},
		{
			title: 'Backend starten',
			done: w.status.backendRunning,
			description:
				'Start de BABL backend server. Dit verbindt Whisper (spraak) met Ollama (correctie).',
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
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-white">Lokaal instellen</h2>
			<button
				onclick={handleClose}
				class="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
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
								<span class="text-xs font-medium text-white/30">{i + 1}</span>
							</div>
						{/if}

						<span
							class="text-sm font-medium {isPast
								? 'text-emerald-400/70'
								: isActive
									? 'text-white'
									: 'text-white/40'}"
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
							<p class="text-xs text-white/50 leading-relaxed">{step.description}</p>

							{#each step.commands as { label, cmd }}
								<div>
									<span class="mb-1 block text-[10px] uppercase tracking-wider text-white/30"
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
											class="shrink-0 rounded-lg bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
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
							<p class="flex items-center gap-1.5 text-[10px] text-white/25">
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
				<p class="mt-1 text-xs text-emerald-400/60">
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
