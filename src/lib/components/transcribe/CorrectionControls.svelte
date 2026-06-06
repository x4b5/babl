<script lang="ts">
	import type { Mode, ReportLength } from '$lib/stores/transcribe.svelte';

	interface Props {
		mode: Mode;
		reportLength: ReportLength;
		localAvailable: boolean;
		ollamaAvailable: boolean;
		mistralAvailable: boolean;
		estimatedCorrectionCost: string;
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
		estimatedCorrectionCost,
		onModeChange,
		onReportLengthChange,
		onGenerate,
		onOpenSetupWizard
	}: Props = $props();

	const localCorrectionAvailable = $derived(localAvailable && ollamaAvailable);

	const reportLengthOptions: { value: ReportLength; label: string }[] = [
		{ value: 'samenvatting', label: 'Samenvatting' },
		{ value: 'uitgebreid', label: 'Uitgebreid' }
	];
</script>

<div class="glass rounded-2xl p-4 sm:p-5 animate-fade-in">
	<h3 class="mb-3 sm:mb-4 text-base sm:text-sm font-semibold text-white/70">Verslaglegging</h3>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
		<!-- Mode toggle -->
		<div class="flex flex-col gap-1">
			<span class="text-xs sm:text-[10px] uppercase tracking-wider text-white/30">Model</span>
			<div class="glass flex rounded-full p-1">
				<button
					onclick={() => onModeChange('local')}
					disabled={!localAvailable}
					class="flex-1 rounded-full px-4 py-1.5 text-sm sm:text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'local'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-neon/40 hover:text-neon/70 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Lokaal
				</button>
				<button
					onclick={() => onModeChange('api')}
					disabled={!mistralAvailable}
					class="flex-1 rounded-full px-4 py-1.5 text-sm sm:text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'api'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-neon/40 hover:text-neon/70 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					API
				</button>
			</div>
			{#if !localAvailable && onOpenSetupWizard}
				<button
					onclick={onOpenSetupWizard}
					class="mt-1 text-xs text-neon/40 transition-colors hover:text-neon/70"
				>
					Lokaal instellen &rsaquo;
				</button>
			{/if}
		</div>

		<!-- Report length toggle -->
		<div class="flex flex-col gap-1">
			<span class="text-xs sm:text-[10px] uppercase tracking-wider text-white/30">Omvang</span>
			<div class="glass flex rounded-full p-1">
				{#each reportLengthOptions as opt}
					<button
						onclick={() => onReportLengthChange(opt.value)}
						class="flex-1 rounded-full px-4 py-1.5 text-sm sm:text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {reportLength ===
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
		<p class="mb-3 text-sm sm:text-xs text-amber-400/70">
			Tekst wordt verwerkt via Mistral (Europese servers)
			<span class="font-mono">— geschat ${estimatedCorrectionCost}</span>
		</p>
	{/if}

	<!-- Generate button -->
	<button
		onclick={onGenerate}
		class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98]"
	>
		Genereren
	</button>
</div>
