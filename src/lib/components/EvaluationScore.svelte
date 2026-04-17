<script lang="ts">
	interface Props {
		wer: number;
		cer: number;
		substitutions: number;
		deletions: number;
		insertions: number;
		totalWords: number;
	}

	let { wer, cer, substitutions, deletions, insertions, totalWords }: Props = $props();

	let werPercent = $derived(Math.round(wer * 100));
	let cerPercent = $derived(Math.round(cer * 100));
	let accuracy = $derived(Math.max(0, 100 - werPercent));

	let qualityLabel = $derived(
		accuracy >= 90 ? 'Uitstekend' : accuracy >= 75 ? 'Goed' : accuracy >= 50 ? 'Matig' : 'Laag'
	);

	let qualityColor = $derived(
		accuracy >= 90
			? 'text-green-400'
			: accuracy >= 75
				? 'text-[#d4ff00]'
				: accuracy >= 50
					? 'text-amber-400'
					: 'text-red-400'
	);
</script>

<div class="glass animate-fade-in rounded-xl p-4">
	<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Kwaliteitsscore</h3>

	<div class="mb-3 flex items-center gap-4">
		<div class="text-center">
			<div class="text-2xl font-bold {qualityColor}">{accuracy}%</div>
			<div class="text-[10px] text-white/40">{qualityLabel}</div>
		</div>
		<div class="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
			<div
				class="h-full rounded-full transition-all duration-500 {accuracy >= 90
					? 'bg-green-400'
					: accuracy >= 75
						? 'bg-[#d4ff00]'
						: accuracy >= 50
							? 'bg-amber-400'
							: 'bg-red-400'}"
				style="width: {accuracy}%"
			></div>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-2 text-xs">
		<div class="flex justify-between text-white/50">
			<span>WER</span>
			<span class="font-mono text-white/70">{werPercent}%</span>
		</div>
		<div class="flex justify-between text-white/50">
			<span>CER</span>
			<span class="font-mono text-white/70">{cerPercent}%</span>
		</div>
		<div class="flex justify-between text-white/50">
			<span>Substituties</span>
			<span class="font-mono text-white/70">{substitutions}</span>
		</div>
		<div class="flex justify-between text-white/50">
			<span>Deleties</span>
			<span class="font-mono text-white/70">{deletions}</span>
		</div>
		<div class="flex justify-between text-white/50">
			<span>Inserties</span>
			<span class="font-mono text-white/70">{insertions}</span>
		</div>
		<div class="flex justify-between text-white/50">
			<span>Totaal woorden</span>
			<span class="font-mono text-white/70">{totalWords}</span>
		</div>
	</div>
</div>
