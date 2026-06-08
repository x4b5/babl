<script lang="ts">
	import type { Mode, ReportLength } from '$lib/stores/transcribe.svelte';
	import { isMobile } from '$lib/utils/device';

	interface Props {
		transcribeMode: Mode;
		polishMode: Mode;
		reportLength: ReportLength;
		localAvailable: boolean;
		assemblyAvailable: boolean;
		ollamaAvailable: boolean;
		mistralAvailable: boolean;
		onTranscribeModeChange: (mode: Mode) => void;
		onPolishModeChange: (mode: Mode) => void;
		onReportLengthChange: (length: ReportLength) => void;
		onOpenSetupWizard?: () => void;
		onOpenOllamaWizard?: () => void;
	}

	let {
		transcribeMode,
		polishMode,
		reportLength,
		localAvailable,
		assemblyAvailable,
		ollamaAvailable,
		mistralAvailable,
		onTranscribeModeChange,
		onPolishModeChange,
		onReportLengthChange,
		onOpenSetupWizard,
		onOpenOllamaWizard
	}: Props = $props();

	let open = $state(false);
	let mobile = $state(false);

	$effect(() => {
		mobile = isMobile();
	});

	const localPolishingAvailable = $derived(localAvailable && ollamaAvailable);

	const reportLengthOptions: { value: ReportLength; label: string }[] = [
		{ value: 'samenvatting', label: 'Samenvatting' },
		{ value: 'uitgebreid', label: 'Uitgebreid' }
	];
</script>

<div class="flex flex-col items-center gap-2 animate-fade-in">
	<button
		onclick={() => (open = !open)}
		class="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer"
		aria-expanded={open}
		aria-controls="settings-panel"
	>
		<svg
			class="h-4 w-4 transition-transform duration-200 {open ? 'rotate-90' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
		Instellingen
		<svg
			class="h-3 w-3 transition-transform duration-200 {open ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<div id="settings-panel" class="glass rounded-2xl p-5 sm:p-6 w-full max-w-md animate-slide-up">
			<!-- Transcriptie modus -->
			<div class="mb-5">
				<h4 class="text-xs uppercase tracking-wider text-white/30 mb-2">Transcriptie</h4>
				{#if mobile}
					<div class="glass rounded-full px-4 py-2 text-sm font-medium text-center">
						<span class="text-white/80">Via internet</span>
						<span class="text-xs opacity-70 ml-1">
							<img src="/assemblyai.png" alt="" class="inline h-3 w-3 -mt-0.5" /> AssemblyAI
						</span>
					</div>
				{:else}
					<div class="glass flex rounded-full p-1">
						<button
							onclick={() => onTranscribeModeChange('local')}
							class="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 {transcribeMode ===
							'local'
								? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
								: 'text-white/60 hover:text-white/80'}"
						>
							<span class="block text-xs">Lokaal</span>
							<span class="block text-[10px] opacity-70">Whisper</span>
						</button>
						<button
							onclick={() => onTranscribeModeChange('api')}
							disabled={!assemblyAvailable}
							class="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 {transcribeMode ===
							'api'
								? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
								: 'text-white/60 hover:text-white/80'} disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<span class="block text-xs">Internet</span>
							<span class="block text-[10px] opacity-70">AssemblyAI</span>
						</button>
					</div>
					{#if !localAvailable && onOpenSetupWizard}
						<button
							onclick={onOpenSetupWizard}
							class="mt-1 text-xs underline text-white/40 hover:text-white/60 transition-colors cursor-pointer"
						>
							Lokaal installeren
						</button>
					{/if}
				{/if}
			</div>

			<!-- Polijsten modus -->
			<div class="mb-5">
				<h4 class="text-xs uppercase tracking-wider text-white/30 mb-2">Polijsten</h4>
				{#if mobile}
					<div class="glass rounded-full px-4 py-2 text-sm font-medium text-center">
						<span class="text-white/80">Via internet</span>
						<span class="text-xs opacity-70 ml-1">
							<img src="/mistral.png" alt="" class="inline h-3 w-3 -mt-0.5" /> Mistral
						</span>
					</div>
				{:else}
					<div class="glass flex rounded-full p-1">
						<button
							onclick={() => onPolishModeChange('local')}
							class="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 {polishMode ===
							'local'
								? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
								: 'text-white/60 hover:text-white/80'}"
						>
							<span class="block text-xs">Lokaal</span>
							<span class="block text-[10px] opacity-70">Ollama</span>
						</button>
						<button
							onclick={() => onPolishModeChange('api')}
							disabled={!mistralAvailable}
							class="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 {polishMode ===
							'api'
								? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
								: 'text-white/60 hover:text-white/80'} disabled:opacity-30 disabled:cursor-not-allowed"
						>
							<span class="block text-xs">Internet</span>
							<span class="block text-[10px] opacity-70">Mistral</span>
						</button>
					</div>
					{#if polishMode === 'local' && !localPolishingAvailable && onOpenOllamaWizard}
						<button
							onclick={onOpenOllamaWizard}
							class="mt-1 text-xs underline text-white/40 hover:text-white/60 transition-colors cursor-pointer"
						>
							Ollama installeren
						</button>
					{/if}
				{/if}
			</div>

			<!-- Rapportlengte -->
			<div>
				<h4 class="text-xs uppercase tracking-wider text-white/30 mb-2">Rapportlengte</h4>
				<div class="glass flex rounded-full p-1">
					{#each reportLengthOptions as opt}
						<button
							onclick={() => onReportLengthChange(opt.value)}
							class="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 {reportLength ===
							opt.value
								? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20'
								: 'text-white/40 hover:text-white/70'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>

			<a
				href="/about#voor-en-nadelen"
				class="block text-center text-xs text-white/20 hover:text-white/40 transition-colors underline mt-4"
			>
				Voor- en nadelen van beide opties
			</a>
		</div>
	{/if}
</div>
