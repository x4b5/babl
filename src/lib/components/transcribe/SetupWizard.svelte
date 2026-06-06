<script lang="ts">
	import {
		getSetupWizardState,
		closeWizard,
		setStep,
		copyCommand,
		confirmRam
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
		hasRamCheck?: boolean;
	}

	const fullSteps: Step[] = $derived([
		{
			title: 'Controleer je werkgeheugen (RAM)',
			done: w.ramConfirmed,
			description:
				'Whisper heeft minimaal 8 GB werkgeheugen nodig. Check je RAM via Apple menu (\uF8FF) > Over deze Mac.',
			commands: [],
			hasRamCheck: true
		},
		{
			title: 'Installeren en starten',
			done: w.status.backendRunning,
			description:
				'Open de Terminal app (zoek "Terminal" in Spotlight) en plak onderstaand commando. Dit downloadt en start alles automatisch.',
			commands: [
				{
					label: 'Kopieer en plak in Terminal',
					cmd: '(test -d ~/babl || git clone https://github.com/x4b5/babl.git ~/babl) && cd ~/babl && npm install && npm run transcribe'
				}
			]
		}
	]);

	const ollamaSteps: Step[] = $derived([
		{
			title: 'Installeer Ollama',
			done: w.status.ollamaRunning,
			description:
				'Ollama draait AI-modellen lokaal op je computer. Open de Terminal app en plak onderstaand commando.',
			commands: [
				{
					label: 'Kopieer en plak in Terminal',
					cmd: 'brew install ollama && ollama serve'
				}
			]
		},
		{
			title: 'Download het taalmodel',
			done: w.ollamaModelReady,
			description:
				'Nu moet het taalmodel gedownload worden. Dit is eenmalig en duurt een paar minuten.',
			commands: [
				{
					label: 'Kopieer en plak in Terminal',
					cmd: `ollama pull ${w.selectedModel}`
				}
			]
		}
	]);

	const steps: Step[] = $derived(w.wizardContext === 'ollama' ? ollamaSteps : fullSteps);
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
			<h2 class="text-lg font-semibold text-white">
				{w.wizardContext === 'ollama' ? 'Ollama installeren' : 'Hoe te installeren'}
			</h2>
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
		<p class="mb-5 text-sm text-white/50 leading-relaxed">
			{#if w.wizardContext === 'ollama'}
				Ollama draait AI-modellen lokaal op je computer, zodat de verslaglegging volledig privé
				blijft. Volg de stappen hieronder.
			{:else}
				Met de privé-modus wordt alle verwerking op jouw eigen computer gedaan. Er wordt niets naar
				het internet verstuurd. Volg de stappen hieronder.
			{/if}
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

							{#if step.hasRamCheck}
								<div class="rounded-lg bg-white/5 p-3">
									<p class="text-xs text-white/60">
										Minimaal <span class="font-semibold text-white/80">8 GB RAM</span> nodig. Meer is
										beter.
									</p>
								</div>
								<button
									onclick={confirmRam}
									class="w-full rounded-xl bg-neon/15 px-4 py-2.5 text-sm font-medium text-neon transition-all hover:bg-neon/25"
								>
									Ik heb genoeg RAM
								</button>
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

							<!-- Polling indicator (only for auto-detected steps) -->
							{#if !step.hasRamCheck}
								<p class="flex items-center gap-1.5 text-xs text-white/45">
									<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon/40"
									></span>
									Checkt automatisch elke 3 seconden...
								</p>
							{/if}
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
