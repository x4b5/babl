<script lang="ts">
	import { isStopword } from '$lib/utils/stopwords-nl';
	import { getTranscribeState } from '$lib/stores/transcribe.svelte';

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

	const ts = getTranscribeState();

	/** Speaker text colors for inline display */
	const SPEAKER_TEXT_COLORS: Record<string, string> = {
		A: 'text-emerald-300/90',
		B: 'text-orange-300/90',
		C: 'text-violet-300/90',
		D: 'text-sky-300/90'
	};

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

	// Important low-confidence words: not stopwords, sorted by lowest confidence
	let importantLowConfidence = $derived(
		words
			.map((w, i) => ({ ...w, index: i }))
			.filter((w) => w.confidence < threshold && !isStopword(w.text))
			.sort((a, b) => a.confidence - b.confidence)
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
						<span class="text-white/40">&rarr;</span>
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
							{@const word = words[i]}
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
							{#if i < group.endIndex}{' '}{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Original flat word view (no speakers or single speaker) -->
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
	{/if}
</div>
