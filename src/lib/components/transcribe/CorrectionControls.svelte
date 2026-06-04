<script lang="ts">
	import type { Mode, Quality, ReportLength, Lang } from '$lib/stores/transcribe.svelte';

	interface Props {
		mode: Mode;
		quality: Quality;
		reportLength: ReportLength;
		temperature: number;
		lang: Lang;
		keepDialect: boolean;
		localAvailable: boolean;
		mistralAvailable: boolean;
		estimatedCorrectionCost: string;
		onModeChange: (mode: Mode) => void;
		onQualityChange: (quality: Quality) => void;
		onReportLengthChange: (length: ReportLength) => void;
		onTemperatureChange: (temp: number) => void;
		onKeepDialectChange: (keep: boolean) => void;
		onGenerate: () => void;
	}

	let {
		mode,
		quality,
		reportLength,
		temperature,
		lang,
		keepDialect,
		localAvailable,
		mistralAvailable,
		estimatedCorrectionCost,
		onModeChange,
		onQualityChange,
		onReportLengthChange,
		onTemperatureChange,
		onKeepDialectChange,
		onGenerate
	}: Props = $props();

	const reportLengthOptions: { value: ReportLength; label: string }[] = [
		{ value: 'kort', label: 'Kort' },
		{ value: 'middellang', label: 'Middellang' },
		{ value: 'lang', label: 'Lang' }
	];
</script>

<div class="glass rounded-2xl p-4 sm:p-5 animate-fade-in">
	<h3 class="mb-3 sm:mb-4 text-sm font-semibold text-white/70">Verslaglegging</h3>

	<div class="flex flex-wrap items-start gap-3 sm:gap-4 mb-4">
		<!-- Mode toggle -->
		<div class="flex flex-col gap-1">
			<span class="text-[10px] uppercase tracking-wider text-white/30">Model</span>
			<div class="glass inline-flex rounded-full p-1">
				<button
					onclick={() => onModeChange('local')}
					disabled={!localAvailable}
					class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'local'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					Lokaal
				</button>
				<button
					onclick={() => onModeChange('api')}
					disabled={!mistralAvailable}
					class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {mode ===
					'api'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
				>
					API
				</button>
			</div>
		</div>

		<!-- Quality toggle -->
		<div class="flex flex-col gap-1">
			<span class="text-[10px] uppercase tracking-wider text-white/30">Kwaliteit</span>
			<div class="glass inline-flex rounded-full p-1">
				<button
					onclick={() => onQualityChange('light')}
					class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {quality ===
					'light'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'}"
				>
					Light
				</button>
				<button
					onclick={() => onQualityChange('medium')}
					class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {quality ===
					'medium'
						? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
						: 'text-white/50 hover:text-white/80 scale-100'}"
				>
					Medium
				</button>
			</div>
		</div>

		<!-- Report length toggle -->
		<div class="flex flex-col gap-1">
			<span class="text-[10px] uppercase tracking-wider text-white/30">Omvang</span>
			<div class="glass inline-flex rounded-full p-1">
				{#each reportLengthOptions as opt}
					<button
						onclick={() => onReportLengthChange(opt.value)}
						class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {reportLength ===
						opt.value
							? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
							: 'text-white/50 hover:text-white/80 scale-100'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if mode === 'api'}
		<p class="mb-3 text-xs text-amber-400/70">
			Tekst wordt verwerkt via Mistral (Europese servers)
			<span class="font-mono">— geschat ${estimatedCorrectionCost}</span>
		</p>
	{/if}

	<!-- Temperature slider -->
	<div class="mb-5 flex items-center gap-3">
		<label for="temperature" class="text-xs text-white/50 whitespace-nowrap">Temperatuur</label>
		<input
			id="temperature"
			type="range"
			min="0"
			max="1"
			step="0.1"
			value={temperature}
			oninput={(e) => onTemperatureChange(parseFloat((e.target as HTMLInputElement).value))}
			class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-neon"
		/>
		<span class="w-8 text-right text-xs font-mono text-white/60">{temperature.toFixed(1)}</span>
	</div>

	<!-- Dialect retention toggle -->
	{#if lang === 'li'}
		<div class="mb-5 flex items-center justify-between gap-3">
			<div class="flex flex-col">
				<span class="text-xs text-white/80">Behoud Dialect</span>
				<span class="text-[10px] text-white/30">Houd de output in het Limburgs</span>
			</div>
			<label class="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					checked={keepDialect}
					onchange={(e) => onKeepDialectChange((e.target as HTMLInputElement).checked)}
					class="peer sr-only"
				/>
				<div
					class="peer h-5 w-9 rounded-full bg-white/10 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/40 after:transition-all after:content-[''] peer-checked:bg-neon peer-checked:after:translate-x-full peer-checked:after:bg-black"
				></div>
			</label>
		</div>
	{/if}

	<!-- Generate button -->
	<button
		onclick={onGenerate}
		class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,255,0,0.3)] active:scale-[0.98]"
	>
		Verslaglegging genereren
	</button>
</div>
