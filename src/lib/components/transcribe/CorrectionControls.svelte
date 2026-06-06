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

<div class="glass rounded-2xl p-5 sm:p-6 animate-fade-in">
	<h3 class="mb-4 sm:mb-5 text-base font-semibold text-white/70">Verslaglegging</h3>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
		<!-- Mode toggle -->
		<div class="flex flex-col gap-2">
			<span class="text-xs uppercase tracking-wider text-white/30">Verwerking</span>
			<div class="text-sm text-white/40">
				{#if mode === 'local'}
					<p>
						Correctie via <img src="/ollama.png" alt="" class="inline h-3.5 w-3.5 -mt-0.5" />
						<a
							href="https://ollama.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline text-white/60 hover:text-white/80 transition-colors">Ollama</a
						> op jouw computer.
					</p>
				{:else}
					<p>
						Correctie via <img src="/mistral.png" alt="" class="inline h-3.5 w-3.5 -mt-0.5" />
						<a
							href="https://mistral.ai"
							target="_blank"
							rel="noopener noreferrer"
							class="underline text-white/60 hover:text-white/80 transition-colors">Mistral</a
						> (EU-servers).
					</p>
				{/if}
			</div>
			<div class="glass flex rounded-full p-1">
				<button
					onclick={() => onModeChange('local')}
					disabled={!localCorrectionAvailable}
					class="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'local'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-neon/40 hover:text-neon/70 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Op dit apparaat
				</button>
				<button
					onclick={() => onModeChange('api')}
					disabled={!mistralAvailable}
					class="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'api'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-neon/40 hover:text-neon/70 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Via internet
				</button>
			</div>
			<a
				href="/about#voor-en-nadelen"
				class="text-sm text-white/30 hover:text-white/50 transition-colors underline mt-2"
			>
				Voor- en nadelen van beide opties
			</a>
			{#if !localCorrectionAvailable && onOpenSetupWizard}
				<button
					onclick={onOpenSetupWizard}
					class="mt-2 glass rounded-xl px-4 py-3 text-left transition-all hover:bg-white/10 w-full"
				>
					<span class="block text-sm font-medium text-neon">Privé-modus activeren</span>
					<span class="block text-xs text-white/40 mt-0.5"
						>Installeer de software om alles op je eigen computer te draaien</span
					>
				</button>
			{/if}
		</div>

		<!-- Report length toggle -->
		<div class="flex flex-col gap-2">
			<span class="text-xs uppercase tracking-wider text-white/30">Omvang</span>
			<div class="glass flex rounded-full p-1">
				{#each reportLengthOptions as opt}
					<button
						onclick={() => onReportLengthChange(opt.value)}
						class="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {reportLength ===
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
			<span class="font-mono">— geschat ${estimatedCorrectionCost}</span>
		</p>
	{/if}

	<!-- Generate button -->
	<button
		onclick={onGenerate}
		class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3.5 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98]"
	>
		Genereren
	</button>
</div>
