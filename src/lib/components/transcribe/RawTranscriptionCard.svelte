<script lang="ts">
	import ConfidenceHighlight from '$lib/components/ConfidenceHighlight.svelte';
	import type { WordWithConfidence, Mode } from '$lib/stores/transcribe.svelte';
	import { copyText, getTranscribeState, setSpeakerLabel } from '$lib/stores/transcribe.svelte';
	import { getRecording } from '$lib/utils/recording-db';

	interface Props {
		raw: string;
		language: string;
		confidenceWords: WordWithConfidence[];
		transcribeMode: Mode;
		copiedRaw: boolean;
		savedRecordingId?: string | null;
	}

	let {
		raw,
		language,
		confidenceWords,
		transcribeMode,
		copiedRaw,
		savedRecordingId = null
	}: Props = $props();

	let downloading = $state(false);

	async function downloadRecording() {
		if (!savedRecordingId || downloading) return;
		downloading = true;
		try {
			const rec = await getRecording(savedRecordingId);
			if (!rec) return;
			const ext = rec.mimeType.includes('webm')
				? 'webm'
				: rec.mimeType.includes('ogg')
					? 'ogg'
					: 'mp4';
			const date = new Date(rec.createdAt);
			const pad = (n: number) => String(n).padStart(2, '0');
			const filename = `opname-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}h${pad(date.getMinutes())}.${ext}`;
			const url = URL.createObjectURL(rec.blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			downloading = false;
		}
	}

	const ts = getTranscribeState();

	/** Speaker color classes — cycles if more than defined */
	const SPEAKER_COLORS: Record<string, { text: string; border: string; bg: string }> = {
		A: { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10' },
		B: { text: 'text-orange-400', border: 'border-orange-400/30', bg: 'bg-orange-400/10' },
		C: { text: 'text-violet-400', border: 'border-violet-400/30', bg: 'bg-violet-400/10' },
		D: { text: 'text-sky-400', border: 'border-sky-400/30', bg: 'bg-sky-400/10' }
	};
	const FALLBACK_COLORS = {
		text: 'text-white/70',
		border: 'border-white/20',
		bg: 'bg-white/5'
	};

	function getSpeakerColors(speaker: string) {
		return SPEAKER_COLORS[speaker] ?? FALLBACK_COLORS;
	}

	interface SpeakerBlock {
		speaker: string;
		text: string;
	}

	/** Parse raw text into speaker blocks. Handles "Spreker X: tekst" format. */
	function parseSpeakerBlocks(text: string): SpeakerBlock[] {
		const lines = text.split('\n');
		const blocks: SpeakerBlock[] = [];
		const speakerRegex = /^Spreker\s+([A-Z0-9]+):\s*(.*)$/;

		for (const line of lines) {
			const match = line.match(speakerRegex);
			if (match) {
				const speaker = match[1];
				const content = match[2];
				// Merge with previous block if same speaker
				if (blocks.length > 0 && blocks[blocks.length - 1].speaker === speaker) {
					blocks[blocks.length - 1].text += ' ' + content;
				} else {
					blocks.push({ speaker, text: content });
				}
			} else if (line.trim()) {
				// Non-speaker line: append to last block or create anonymous block
				if (blocks.length > 0) {
					blocks[blocks.length - 1].text += '\n' + line;
				} else {
					blocks.push({ speaker: '', text: line });
				}
			}
		}
		return blocks;
	}

	/** Check if the raw text contains speaker labels */
	let hasSpeakers = $derived(raw.includes('Spreker '));
	let speakerBlocks = $derived(hasSpeakers ? parseSpeakerBlocks(raw) : []);
	let uniqueSpeakers = $derived([...new Set(speakerBlocks.map((b) => b.speaker).filter(Boolean))]);

	// Inline rename state
	let editingSpeaker = $state<string | null>(null);
	let editValue = $state('');

	function startRename(speaker: string) {
		editingSpeaker = speaker;
		editValue = ts.speakerLabels[speaker] ?? `Spreker ${speaker}`;
	}

	function finishRename(speaker: string) {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== `Spreker ${speaker}`) {
			setSpeakerLabel(speaker, trimmed);
		} else {
			setSpeakerLabel(speaker, '');
		}
		editingSpeaker = null;
	}

	function getSpeakerDisplayName(speaker: string): string {
		return ts.speakerLabels[speaker] || `Spreker ${speaker}`;
	}
</script>

{#if language}
	<div class="text-center text-base sm:text-sm text-white/55">
		Gedetecteerde taal: <span class="font-medium text-white/80">{language}</span>
	</div>
{/if}

<div
	class="gradient-border-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
>
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-base sm:text-sm font-semibold text-white/80">Ruwe transcriptie</h2>
		<div class="flex items-center gap-1">
			{#if savedRecordingId}
				<button
					onclick={downloadRecording}
					disabled={downloading}
					aria-label="Download audiobestand"
					class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200 text-white/55 hover:text-white/80 hover:bg-white/5 disabled:opacity-50"
				>
					<svg
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					Audio
				</button>
			{/if}
			<button
				onclick={() => copyText(raw, 'raw')}
				aria-label={copiedRaw ? 'Transcriptie gekopieerd' : 'Kopieer transcriptie'}
				class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200
					{copiedRaw
					? 'text-green-400 glow-green bg-green-500/10 copy-bounce'
					: 'text-white/55 hover:text-white/80 hover:bg-white/5'}"
			>
				{#if copiedRaw}
					<svg
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					Gekopieerd!
				{:else}
					<svg
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					Kopieer
				{/if}
			</button>
		</div>
	</div>

	<!-- Speaker rename tags -->
	{#if hasSpeakers && uniqueSpeakers.length > 0}
		<div class="mb-2 flex flex-wrap gap-1.5">
			{#each uniqueSpeakers as speaker}
				{@const colors = getSpeakerColors(speaker)}
				{#if editingSpeaker === speaker}
					<input
						type="text"
						class="rounded-full border px-2.5 py-0.5 text-xs font-medium {colors.border} {colors.bg} {colors.text} focus:outline-none focus:ring-1 focus:ring-white/30 w-28"
						bind:value={editValue}
						onkeydown={(e) => {
							if (e.key === 'Enter') finishRename(speaker);
							if (e.key === 'Escape') editingSpeaker = null;
						}}
						onblur={() => finishRename(speaker)}
						autofocus
					/>
				{:else}
					<button
						class="rounded-full border px-2.5 py-0.5 text-xs font-medium {colors.border} {colors.bg} {colors.text} hover:brightness-125 transition-all cursor-pointer"
						onclick={() => startRename(speaker)}
						title="Klik om te hernoemen"
					>
						{getSpeakerDisplayName(speaker)}
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	<div
		class="max-h-48 overflow-y-auto text-white leading-relaxed rounded-lg border border-white/10 bg-white/5 p-3"
	>
		{#if confidenceWords.length > 0 && transcribeMode === 'api'}
			<ConfidenceHighlight words={confidenceWords} />
		{:else if hasSpeakers && speakerBlocks.length > 0}
			<div class="space-y-2">
				{#each speakerBlocks as block, i}
					{@const colors = getSpeakerColors(block.speaker)}
					{#if block.speaker}
						<div class="border-l-2 pl-3 {colors.border}">
							<span class="text-xs font-semibold {colors.text}">
								{getSpeakerDisplayName(block.speaker)}
							</span>
							<p class="text-white/90 mt-0.5 whitespace-pre-wrap">{block.text}</p>
						</div>
					{:else}
						<p class="whitespace-pre-wrap text-white/90">{block.text}</p>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="whitespace-pre-wrap">{raw}</p>
			{#if transcribeMode === 'local' && raw}
				<p class="mt-2 text-xs italic text-white/60">
					Woordzekerheid niet beschikbaar in lokale modus
				</p>
			{/if}
		{/if}
	</div>
</div>
