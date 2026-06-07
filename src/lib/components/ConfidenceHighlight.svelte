<script lang="ts">
	import { isStopword } from '$lib/utils/stopwords-nl';

	interface WordWithConfidence {
		text: string;
		confidence: number;
		speaker?: string;
	}

	interface Props {
		words: WordWithConfidence[];
		threshold?: number;
		oncorrect?: (correctedText: string) => void;
	}

	let { words, threshold = 0.7, oncorrect }: Props = $props();

	// Corrections map: index in words array → corrected text
	let corrections = $state<Map<number, string>>(new Map());

	// Important low-confidence words: not stopwords, sorted by lowest confidence
	let importantLowConfidence = $derived(
		words
			.map((w, i) => ({ ...w, index: i }))
			.filter((w) => w.confidence < threshold && !isStopword(w.text))
			.sort((a, b) => a.confidence - b.confidence)
	);

	// Build the final corrected text whenever corrections change
	let correctedText = $derived(words.map((w, i) => corrections.get(i) ?? w.text).join(' '));

	function applyCorrection(index: number, value: string) {
		const next = new Map(corrections);
		if (value.trim() === '' || value.trim() === words[index].text) {
			next.delete(index);
		} else {
			next.set(index, value.trim());
		}
		corrections = next;
		oncorrect?.(correctedText);
	}
</script>

<div class="space-y-3">
	{#if importantLowConfidence.length > 0}
		<div class="glass rounded-lg p-3 space-y-2">
			<p class="text-xs text-amber-400/80 font-medium">
				{importantLowConfidence.length} belangrijk{importantLowConfidence.length === 1 ? '' : 'e'} woord{importantLowConfidence.length ===
				1
					? ''
					: 'en'} met lage zekerheid
			</p>
			<div class="space-y-1.5">
				{#each importantLowConfidence as word (word.index)}
					<div class="flex items-center gap-2 text-sm">
						<span
							class="shrink-0 rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-amber-200/90 text-xs"
							title="Zekerheid: {Math.round(word.confidence * 100)}%"
						>
							{word.text}
						</span>
						<span class="text-white/40">→</span>
						<input
							type="text"
							class="flex-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-sm text-white/90 placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
							placeholder={word.text}
							value={corrections.get(word.index) ?? ''}
							onchange={(e) => applyCorrection(word.index, e.currentTarget.value)}
						/>
						<span class="text-[10px] text-white/30">{Math.round(word.confidence * 100)}%</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="leading-relaxed whitespace-pre-wrap">
		{#each words as word, i}
			{#if corrections.has(i)}
				<span class="text-green-300/90 font-medium">{corrections.get(i)}</span>
			{:else if word.confidence < threshold && !isStopword(word.text)}
				<span
					class="cursor-help border-b-2 border-amber-400/50 text-amber-200/90"
					title="Zekerheid: {Math.round(word.confidence * 100)}%">{word.text}</span
				>
			{:else}
				<span class="text-white/90">{word.text}</span>
			{/if}
			{#if i < words.length - 1}{' '}{/if}
		{/each}
	</div>
</div>
