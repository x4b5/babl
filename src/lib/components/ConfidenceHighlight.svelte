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
		threshold?: number;
	}

	let { words, threshold = 0.7 }: Props = $props();

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

	let lowConfidenceCount = $derived(
		words.filter((w) => w.confidence < threshold && !isStopword(w.text)).length
	);

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
	{#if editingIndex === i}
		<input
			type="text"
			class="inline-block rounded border border-amber-400/60 bg-black/40 px-1 py-0 text-sm text-white focus:outline-none"
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
	{:else if corrections.has(i)}
		<button
			class="cursor-pointer rounded-sm text-green-300/90 font-medium hover:bg-green-400/10"
			onclick={() => startEdit(i)}
			title="Gecorrigeerd (was: {word.text}) — klik om aan te passen">{corrections.get(i)}</button
		>
	{:else if word.confidence < threshold && !isStopword(word.text)}
		<button
			class="cursor-pointer rounded-sm border-b-2 border-amber-400/50 text-amber-200/90 hover:bg-amber-400/10"
			onclick={() => startEdit(i)}
			title="Zekerheid: {Math.round(word.confidence * 100)}% — klik om te corrigeren"
			>{word.text}</button
		>
	{:else}
		<span class="text-white/90">{word.text}</span>
	{/if}
{/snippet}

<div class="space-y-3">
	{#if lowConfidenceCount > 0}
		<p class="text-xs text-white/45">
			<span class="inline-block h-0.5 w-3 rounded bg-amber-400/50 align-middle"></span>
			{lowConfidenceCount}
			onzeker{lowConfidenceCount === 1 ? '' : 'e'} woord{lowConfidenceCount === 1
				? ' is'
				: 'en zijn'}
			gemarkeerd — klik op een woord om het te corrigeren.
		</p>
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
