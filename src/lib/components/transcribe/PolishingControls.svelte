<script lang="ts">
	import type { Mode, ReportLength } from '$lib/stores/transcribe.svelte';
	import { isMobile } from '$lib/utils/device';

	interface Props {
		mode: Mode;
		reportLength: ReportLength;
		localAvailable: boolean;
		ollamaAvailable: boolean;
		mistralAvailable: boolean;
		estimatedPolishingCost: string;
		onModeChange: (mode: Mode) => void;
		onReportLengthChange: (length: ReportLength) => void;
		onGenerate: () => void;
		onOpenSetupWizard?: () => void;
	}

	let {
		mode,
		reportLength,
		localAvailable,
		ollamaAvailable,
		mistralAvailable,
		estimatedPolishingCost,
		onModeChange,
		onReportLengthChange,
		onGenerate,
		onOpenSetupWizard
	}: Props = $props();

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

<div class="glass rounded-2xl p-5 sm:p-6 animate-fade-in">
	<h3 class="mb-4 sm:mb-5 text-base font-semibold text-white/70">Verslaglegging</h3>

	<div class="flex flex-col items-center gap-4 mb-5">
		<!-- Mode toggle -->
		<div class="flex flex-col items-center gap-1 w-full sm:w-auto">
			{#if mobile}
				<!-- Mobile: only API mode available -->
				<div class="glass rounded-full px-4 py-2 text-sm font-medium text-center">
					<span class="block text-white/80">Via internet</span>
					<span class="block text-xs opacity-70">
						<img src="/mistral.png" alt="" class="inline h-3 w-3 -mt-0.5" /> Mistral
					</span>
				</div>
				<p class="text-xs text-white/40 mt-1">Alleen via internet beschikbaar op mobiel.</p>
			{:else}
				<!-- Desktop: full toggle -->
				<div class="glass flex rounded-full p-1 w-full sm:w-auto">
					<button
						onclick={() => onModeChange('local')}
						class="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
						'local'
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/60 hover:text-white/80 scale-100'}"
					>
						<span class="block">Op de computer</span>
						<span class="block text-xs opacity-70"
							><img src="/ollama.png" alt="" class="inline h-3 w-3 -mt-0.5" /> Ollama</span
						>
					</button>
					<button
						onclick={() => onModeChange('api')}
						disabled={!mistralAvailable}
						class="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
						'api'
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/60 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<span class="block">Via internet</span>
						<span class="block text-xs opacity-70"
							><img src="/mistral.png" alt="" class="inline h-3 w-3 -mt-0.5" /> Mistral</span
						>
					</button>
				</div>
				{#if mode === 'local'}
					<p class="text-xs text-white/40 mt-1">
						Vereist minimaal 8 GB RAM. Niet beschikbaar op mobiel.
					</p>
				{/if}
				{#if mode === 'local' && !localPolishingAvailable && onOpenSetupWizard}
					<button
						onclick={onOpenSetupWizard}
						class="text-xs underline text-white/60 hover:text-white/80 transition-colors cursor-pointer"
					>
						Installeren op je computer
					</button>
				{/if}
			{/if}
			<a
				href="/about#voor-en-nadelen"
				class="text-sm text-white/30 hover:text-white/50 transition-colors underline mt-2"
			>
				Voor- en nadelen van beide opties
			</a>
		</div>

		<!-- Report length toggle -->
		<div class="flex flex-col items-center gap-2 w-full sm:w-auto">
			<span class="text-xs uppercase tracking-wider text-white/30">Omvang</span>
			<div class="glass flex rounded-full p-1 w-full sm:w-auto">
				{#each reportLengthOptions as opt}
					<button
						onclick={() => onReportLengthChange(opt.value)}
						class="flex-1 sm:flex-none rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {reportLength ===
						opt.value
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-neon/40 hover:text-neon/70 scale-100'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if mode === 'api'}
		<p class="mb-4 text-sm text-amber-400/70">
			Tekst wordt verwerkt via Mistral (Europese servers)
			<span class="font-mono">— geschat ${estimatedPolishingCost}</span>
		</p>
	{/if}

	<!-- Generate button -->
	<button
		onclick={onGenerate}
		disabled={mode === 'local' && !localPolishingAvailable}
		class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3.5 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
	>
		Genereren
	</button>
</div>
