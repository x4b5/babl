<script lang="ts">
	import { isStopword } from '$lib/utils/stopwords-nl';
	import { replaceNthToken } from '$lib/utils/word-correction';
	import { getTranscribeState, setRaw } from '$lib/stores/transcribe.svelte';

	interface WordWithConfidence {
		text: string;
		confidence: number;
		speaker?: string;
	}

	interface Props {
		words: WordWithConfidence[];
		/** Onder deze zekerheid: amber (twijfelachtig). */
		threshold?: number;
		/** Onder deze zekerheid: rood (heel onzeker). */
		strongThreshold?: number;
	}

	let { words, threshold = 0.7, strongThreshold = 0.5 }: Props = $props();

	type ConfidenceBand = 'none' | 'low' | 'veryLow';

	/** Bepaalt het onzekerheidsniveau van een woord (stopwoorden tellen niet mee). */
	function bandFor(word: WordWithConfidence): ConfidenceBand {
		if (isStopword(word.text)) return 'none';
		if (word.confidence < strongThreshold) return 'veryLow';
		if (word.confidence < threshold) return 'low';
		return 'none';
	}

	const ts = getTranscribeState();

	/** Speaker text colors for inline display */
	const SPEAKER_BORDER_COLORS: Record<string, string> = {
		A: 'border-emerald-400/30',
		B: 'border-orange-400/30',
		C: 'border-violet-400/30',
		D: 'border-sky-400/30'
	};

	const SPEAKER_LABEL_COLORS: Record<string, string> = {
		A: 'text-emerald-400',
		B: 'text-orange-400',
		C: 'text-violet-400',
		D: 'text-sky-400'
	};

	function getSpeakerDisplayName(speaker: string): string {
		return ts.speakerLabels[speaker] || `Spreker ${speaker}`;
	}

	// Corrections map: index in words array → corrected text
	let corrections = $state<Map<number, string>>(new Map());

	// Inline editing state: which word is being edited and its draft text
	let editingIndex = $state<number | null>(null);
	let editValue = $state('');

	// Tel alleen nog níét gecorrigeerde woorden — telt af terwijl je verbetert.
	let veryLowRemaining = $derived(
		words.filter((w, i) => bandFor(w) === 'veryLow' && !corrections.has(i)).length
	);
	let lowRemaining = $derived(
		words.filter((w, i) => bandFor(w) === 'low' && !corrections.has(i)).length
	);

	// Welk woord is via de navigatiebalk geselecteerd (krijgt een ring).
	let activeIndex = $state<number | null>(null);

	/** Spring naar het eerstvolgende nog niet gecorrigeerde woord van dit niveau. */
	function jumpToNext(target: ConfidenceBand) {
		const indices: number[] = [];
		for (let i = 0; i < words.length; i++) {
			if (bandFor(words[i]) === target && !corrections.has(i)) indices.push(i);
		}
		if (indices.length === 0) return;
		const next = indices.find((i) => activeIndex === null || i > activeIndex) ?? indices[0];
		activeIndex = next;
		const el = document.getElementById(`cw-${next}`);
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		el?.focus();
	}

	/** Check if any words have speaker labels */
	let hasSpeakers = $derived(words.some((w) => w.speaker));

	/** Group words into speaker blocks for rendering */
	interface SpeakerWordGroup {
		speaker: string;
		startIndex: number;
		endIndex: number;
	}

	let speakerGroups = $derived.by(() => {
		if (!hasSpeakers) return [];
		const groups: SpeakerWordGroup[] = [];
		let currentSpeaker = '';
		let groupStart = 0;

		for (let i = 0; i < words.length; i++) {
			const speaker = words[i].speaker ?? '';
			if (speaker !== currentSpeaker) {
				if (i > 0) {
					groups.push({ speaker: currentSpeaker, startIndex: groupStart, endIndex: i - 1 });
				}
				currentSpeaker = speaker;
				groupStart = i;
			}
		}
		if (words.length > 0) {
			groups.push({
				speaker: currentSpeaker,
				startIndex: groupStart,
				endIndex: words.length - 1
			});
		}
		return groups;
	});

	function applyCorrection(index: number, value: string) {
		const trimmed = value.trim();
		// What currently stands in the raw text for this word (earlier correction or original)
		const oldToken = corrections.get(index) ?? words[index].text;
		const newToken = trimmed === '' ? words[index].text : trimmed;

		if (newToken !== oldToken) {
			// Count which occurrence of oldToken this is, among the words as currently displayed
			const n = words
				.slice(0, index + 1)
				.map((w, i) => corrections.get(i) ?? w.text)
				.filter((t) => t === oldToken).length;
			setRaw(replaceNthToken(ts.raw, oldToken, n, newToken));
		}

		const next = new Map(corrections);
		if (trimmed === '' || trimmed === words[index].text) {
			next.delete(index);
		} else {
			next.set(index, trimmed);
		}
		corrections = next;
	}

	function startEdit(index: number) {
		editingIndex = index;
		editValue = corrections.get(index) ?? words[index].text;
	}

	function commitEdit() {
		if (editingIndex === null) return;
		applyCorrection(editingIndex, editValue);
		editingIndex = null;
	}

	function cancelEdit() {
		editingIndex = null;
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

{#snippet wordToken(i: number)}
	{@const word = words[i]}
	{@const band = bandFor(word)}
	{#if editingIndex === i}
		<input
			type="text"
			class="inline-block rounded border border-amber-400/60 bg-black/40 px-1 py-0 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
			style="width: {Math.max(editValue.length + 2, 6)}ch"
			bind:value={editValue}
			onkeydown={(e) => {
				if (e.key === 'Enter') commitEdit();
				if (e.key === 'Escape') cancelEdit();
			}}
			onblur={commitEdit}
			use:focusOnMount
			aria-label="Corrigeer woord {word.text}"
		/>
	{:else}
		{@const corrected = corrections.has(i)}
		{@const colorClass = corrected
			? 'text-green-300/90 font-medium'
			: band === 'veryLow'
				? 'text-red-400 font-medium'
				: band === 'low'
					? 'text-amber-300'
					: 'text-white/90'}
		<button
			type="button"
			id="cw-{i}"
			class="cursor-pointer rounded-sm px-0.5 hover:bg-white/10 {colorClass} {activeIndex === i
				? 'bg-white/10 ring-1 ring-white/50'
				: ''}"
			onclick={() => startEdit(i)}
			aria-label="Woord {corrected ? corrections.get(i) : word.text} wijzigen{band === 'veryLow'
				? ' (heel onzeker)'
				: band === 'low'
					? ' (twijfelachtig)'
					: ''}"
			title={corrected
				? `Gecorrigeerd (was: ${word.text}) — klik om te wijzigen`
				: `Zekerheid: ${Math.round(word.confidence * 100)}% — klik om te wijzigen`}
			>{corrected ? corrections.get(i) : word.text}</button
		>
	{/if}
{/snippet}

<div class="space-y-3">
	{#if veryLowRemaining + lowRemaining > 0}
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<span class="text-white/45">Spring naar:</span>
			{#if veryLowRemaining > 0}
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-2.5 py-1 text-red-300 hover:bg-red-400/10"
					onclick={() => jumpToNext('veryLow')}
				>
					<span class="inline-block h-2 w-2 rounded-full bg-red-400"></span>
					{veryLowRemaining} heel onzeker →
				</button>
			{/if}
			{#if lowRemaining > 0}
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-2.5 py-1 text-amber-200 hover:bg-amber-400/10"
					onclick={() => jumpToNext('low')}
				>
					<span class="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
					{lowRemaining} twijfelachtig →
				</button>
			{/if}
		</div>
	{/if}

	{#if hasSpeakers && speakerGroups.length > 1}
		<!-- Speaker-grouped word view -->
		<div class="space-y-2">
			{#each speakerGroups as group}
				{@const borderColor = SPEAKER_BORDER_COLORS[group.speaker] ?? 'border-white/20'}
				{@const labelColor = SPEAKER_LABEL_COLORS[group.speaker] ?? 'text-white/60'}
				<div class="border-l-2 pl-3 {borderColor}">
					{#if group.speaker}
						<span class="text-xs font-semibold {labelColor}">
							{getSpeakerDisplayName(group.speaker)}
						</span>
					{/if}
					<div class="leading-relaxed whitespace-pre-wrap mt-0.5">
						{#each { length: group.endIndex - group.startIndex + 1 } as _, offset}
							{@const i = group.startIndex + offset}
							{@render wordToken(i)}
							{#if i < group.endIndex}{' '}{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Flat word view (no speakers or single speaker) -->
		<div class="leading-relaxed whitespace-pre-wrap">
			{#each words as _, i}
				{@render wordToken(i)}
				{#if i < words.length - 1}{' '}{/if}
			{/each}
		</div>
	{/if}
</div>
