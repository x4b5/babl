<script lang="ts">
	import {
		getSetupWizardState,
		closeWizard,
		setStep,
		copyCommand,
		confirmRam,
		downloadModel,
		downloadWhisper
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
		hasDownloadLink?: boolean;
		hasModelDownload?: boolean;
		hasWhisperDownload?: boolean;
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
		},
		{
			title: 'Download Whisper taalmodel',
			done: w.status.whisperModelCached,
			description:
				'Het Whisper model zet spraak om naar tekst. Klik hieronder om het te downloaden (eenmalig, ±3 GB).',
			commands: [],
			hasWhisperDownload: true
		}
	]);

	const qualityLabels: Record<string, string> = {
		light: 'Klein (snel)',
		medium: 'Standaard',
		heavy: 'Groot (best)'
	};

	const modelInfo: Record<string, { storage: string; ram: string }> = {
		light: { storage: '~1 GB', ram: '~2 GB' },
		medium: { storage: '~3 GB', ram: '~5 GB' },
		heavy: { storage: '~8 GB', ram: '~10 GB' }
	};

	const ollamaModels = $derived.by(() => {
		const config = w.status.modelConfig?.ollama;
		if (config && Object.keys(config).length > 0) {
			return Object.entries(config).map(([quality, model]) => ({ quality, model }));
		}
		return [
			{ quality: 'light', model: 'gemma3:1b' },
			{ quality: 'medium', model: 'gemma3:4b' },
			{ quality: 'heavy', model: 'gemma3:12b' }
		];
	});

	const anyModelInstalled = $derived(
		ollamaModels.some(({ model }) => w.status.ollamaModels[model] ?? false)
	);

	const ollamaSteps: Step[] = $derived([
		{
			title: 'Controleer je systeem',
			done: w.ramConfirmed,
			description:
				'De taalmodellen draaien op je eigen computer. Controleer of je genoeg werkgeheugen (RAM) en opslagruimte hebt.',
			commands: [],
			hasRamCheck: true
		},
		{
			title: 'Download Ollama',
			done: w.status.ollamaRunning,
			description:
				'Ollama is een gratis app die AI-modellen op je computer draait. Download de app (~500 MB), open het, en het start automatisch.',
			commands: [],
			hasDownloadLink: true
		},
		{
			title: 'Download een taalmodel',
			done: anyModelInstalled,
			description:
				'Kies minstens een model en klik op Download. Ollama draait het model automatisch na het downloaden — je hoeft verder niets te doen.',
			commands: [],
			hasModelDownload: true
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
								{#if w.wizardContext === 'ollama'}
									<div class="space-y-1.5 rounded-lg bg-white/5 p-3">
										<p class="text-xs font-medium text-white/70 mb-2">Benodigdheden per model:</p>
										{#each ollamaModels as { quality, model }}
											{@const info = modelInfo[quality] ?? { storage: '?', ram: '?' }}
											<div class="flex items-center justify-between text-xs">
												<span class="text-white/60"
													>{qualityLabels[quality] ?? quality}
													<span class="text-white/30">({model})</span></span
												>
												<span class="text-white/50">{info.ram} RAM · {info.storage} opslag</span>
											</div>
										{/each}
										<p class="text-xs text-white/40 mt-2">Ollama zelf: ~500 MB opslag</p>
									</div>
									<p class="text-xs text-white/50">
										Check je RAM via Apple menu (\uF8FF) &gt; Over deze Mac.
									</p>
								{:else}
									<div class="rounded-lg bg-white/5 p-3">
										<p class="text-xs text-white/60">
											Minimaal <span class="font-semibold text-white/80">8 GB RAM</span> nodig. Meer is
											beter.
										</p>
									</div>
								{/if}
								<button
									onclick={confirmRam}
									class="w-full rounded-xl bg-neon/15 px-4 py-2.5 text-sm font-medium text-neon transition-all hover:bg-neon/25"
								>
									Ik heb genoeg
								</button>
							{/if}

							{#if step.hasDownloadLink}
								<a
									href="https://ollama.com/download"
									target="_blank"
									rel="noopener noreferrer"
									class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
								>
									<img src="/ollama.png" alt="" class="h-5 w-5" />
									Download Ollama
								</a>
								<p class="text-xs text-white/40">
									Open na het downloaden de Ollama app. Het icoontje verschijnt bovenin je menubalk.
								</p>
								<p class="flex items-center gap-1.5 text-xs text-white/45">
									<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon/40"
									></span>
									Wacht tot Ollama draait...
								</p>
							{/if}

							{#if step.hasModelDownload}
								<div class="space-y-2">
									{#each ollamaModels as { quality, model }}
										{@const isInstalled = w.status.ollamaModels[model] ?? false}
										{@const isDownloading = w.modelDownloading && w.modelDownloadingName === model}
										{@const info = modelInfo[quality] ?? { storage: '?', ram: '?' }}
										<div class="rounded-lg bg-white/5 p-3">
											<div class="flex items-center justify-between">
												<div>
													<span class="text-sm font-medium text-white/80"
														>{qualityLabels[quality] ?? quality}</span
													>
													<span class="ml-2 text-xs text-white/30">{info.storage}</span>
												</div>
												{#if isInstalled}
													<span
														class="flex items-center gap-1 text-xs font-medium text-emerald-400"
													>
														<svg
															class="h-3.5 w-3.5"
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
														Geinstalleerd
													</span>
												{:else if isDownloading}
													<span class="text-xs text-neon/70">
														{w.modelDownloadProgress != null
															? `${w.modelDownloadProgress}%`
															: 'Bezig...'}
													</span>
												{:else}
													<button
														onclick={() => downloadModel(model)}
														disabled={w.modelDownloading}
														class="rounded-lg bg-neon/15 px-3 py-1.5 text-xs font-medium text-neon transition-all hover:bg-neon/25 disabled:opacity-30 disabled:cursor-not-allowed"
													>
														Download
													</button>
												{/if}
											</div>
											{#if isDownloading && w.modelDownloadProgress != null}
												<div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
													<div
														class="h-full rounded-full bg-neon transition-all duration-300"
														style="width: {w.modelDownloadProgress}%"
													></div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
								{#if w.modelDownloadError}
									<p class="text-xs text-red-400">{w.modelDownloadError}</p>
								{/if}
							{/if}

							{#if step.hasWhisperDownload}
								{#if w.status.whisperModelCached}
									<div class="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3">
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
										<span class="text-sm text-emerald-400">Whisper model gedownload</span>
									</div>
								{:else if w.status.whisperDownloading}
									<div class="rounded-lg bg-white/5 p-3">
										<div class="flex items-center gap-2">
											<span
												class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neon/30 border-t-neon"
											></span>
											<span class="text-sm text-neon/70">Whisper model wordt gedownload...</span>
										</div>
									</div>
								{:else}
									<button
										onclick={downloadWhisper}
										class="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
									>
										<img src="/openai.png" alt="" class="h-5 w-5 rounded-full" />
										Download Whisper model
									</button>
								{/if}
								<p class="flex items-center gap-1.5 text-xs text-white/45">
									<span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon/40"
									></span>
									Checkt automatisch...
								</p>
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
							{#if !step.hasRamCheck && !step.hasDownloadLink && !step.hasModelDownload}
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
