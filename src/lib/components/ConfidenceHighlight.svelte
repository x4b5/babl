<script lang="ts">
	interface WordWithConfidence {
		text: string;
		confidence: number;
		speaker?: string;
	}

	interface Props {
		words: WordWithConfidence[];
		threshold?: number;
	}

	let { words, threshold = 0.7 }: Props = $props();

	let lowCount = $derived(words.filter((w) => w.confidence < threshold).length);
</script>

<div class="space-y-2">
	{#if lowCount > 0}
		<p class="text-xs text-amber-400/70">
			{lowCount} woord{lowCount === 1 ? '' : 'en'} met lage zekerheid
			<span class="ml-1 inline-block h-0.5 w-3 rounded bg-amber-400/50 align-middle"></span>
		</p>
	{/if}
	<div class="leading-relaxed whitespace-pre-wrap">
		{#each words as word, i}
			{#if word.confidence < threshold}
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
