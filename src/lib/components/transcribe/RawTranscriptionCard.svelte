<script lang="ts">
	import ConfidenceHighlight from '$lib/components/ConfidenceHighlight.svelte';
	import type { WordWithConfidence, Mode } from '$lib/stores/transcribe.svelte';
	import {
		copyText,
		getTranscribeState,
		setRaw,
		setSpeakerLabel,
		setSpeakerLabels
	} from '$lib/stores/transcribe.svelte';
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

	/** Focus an input element on mount — replaces `autofocus` to avoid a11y warning. */
	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

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

	// Dropdown states
	let mergeOpenFor = $state<string | null>(null);
	let downloadOpen = $state(false);

	/** Close dropdowns when clicking outside */
	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-dropdown]')) {
			downloadOpen = false;
			mergeOpenFor = null;
		}
	}

	/** Helper: download a Blob as a file */
	function downloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadFilename(ext: string): string {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `transcriptie-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}h${pad(now.getMinutes())}.${ext}`;
	}

	function downloadAsTxt() {
		const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
		downloadBlob(blob, downloadFilename('txt'));
		downloadOpen = false;
	}

	function downloadAsDoc() {
		const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Transcriptie</title>
<style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;}
.speaker{font-weight:bold;margin-top:12pt;}</style></head>
<body>${formatHtmlContent()}</body></html>`;
		const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
		downloadBlob(blob, downloadFilename('doc'));
		downloadOpen = false;
	}

	function downloadAsPdf() {
		const w = window.open('', '_blank');
		if (!w) return;
		w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Transcriptie</title>
<style>body{font-family:sans-serif;padding:2em;line-height:1.8;max-width:700px;margin:0 auto;}
.speaker{font-weight:bold;margin-top:1em;color:#333;}
@media print{body{padding:0;}}</style></head>
<body>${formatHtmlContent()}
<script>window.print();<\/script></body></html>`);
		w.document.close();
		downloadOpen = false;
	}

	/** Format raw text as HTML, preserving speaker blocks */
	function formatHtmlContent(): string {
		if (hasSpeakers && speakerBlocks.length > 0) {
			return speakerBlocks
				.map((b) => {
					const name = b.speaker ? getSpeakerDisplayName(b.speaker) : '';
					const text = b.text.replace(/\n/g, '<br>');
					return name ? `<p class="speaker">${name}:</p><p>${text}</p>` : `<p>${text}</p>`;
				})
				.join('');
		}
		return `<p>${raw.replace(/\n/g, '<br>')}</p>`;
	}

	/** Count unique speakers in a text */
	function countSpeakers(text: string): string[] {
		const matches = text.matchAll(/^Spreker\s+([A-Z0-9]+):/gm);
		return [...new Set([...matches].map((m) => m[1]))];
	}

	/** Strip all speaker prefixes from text */
	function stripAllPrefixes(text: string): string {
		return text.replace(/^Spreker\s+[A-Z0-9]+:\s*/gm, '');
	}

	/** Remove a speaker — strip their prefixes, auto-cleanup if ≤1 left */
	function removeSpeaker(speaker: string) {
		const escaped = speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		let newText = raw.replace(new RegExp(`^Spreker\\s+${escaped}:\\s*`, 'gm'), '');

		// Auto-cleanup: if ≤1 speaker remains, strip all prefixes
		const remaining = countSpeakers(newText);
		if (remaining.length <= 1) {
			newText = stripAllPrefixes(newText);
		}

		setRaw(newText);

		// Remove from speakerLabels
		const newLabels = { ...ts.speakerLabels };
		delete newLabels[speaker];
		if (remaining.length <= 1) {
			// Clear all labels if no multi-speaker context
			setSpeakerLabels({});
		} else {
			setSpeakerLabels(newLabels);
		}
	}

	/** Merge speaker `from` into `into` — replace prefixes, auto-cleanup */
	function mergeSpeaker(from: string, into: string) {
		const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		let newText = raw.replace(new RegExp(`^Spreker\\s+${escaped}:`, 'gm'), `Spreker ${into}:`);

		// Auto-cleanup: if ≤1 speaker remains, strip all prefixes
		const remaining = countSpeakers(newText);
		if (remaining.length <= 1) {
			newText = stripAllPrefixes(newText);
		}

		setRaw(newText);

		// Transfer custom label from→into if into has no label yet
		const newLabels = { ...ts.speakerLabels };
		if (!newLabels[into] && newLabels[from]) {
			newLabels[into] = newLabels[from];
		}
		delete newLabels[from];
		if (remaining.length <= 1) {
			setSpeakerLabels({});
		} else {
			setSpeakerLabels(newLabels);
		}

		mergeOpenFor = null;
	}
</script>

<svelte:window onclick={handleWindowClick} />

{#if language}
	<div class="text-center text-base sm:text-sm text-white/55">
		Gedetecteerde taal: <span class="font-medium text-white/80">{language}</span>
	</div>
{/if}

<div
	class="gradient-border-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
>
	<div class="mb-3 flex items-center justify-between">
		<div>
			<h2 class="text-base sm:text-sm font-semibold text-white/80">Ruwe transcriptie</h2>
			<p class="text-[11px] text-white/40 mt-0.5">
				AI-gegenereerd · {transcribeMode === 'local' ? 'Whisper (lokaal)' : 'AssemblyAI (EU)'}
			</p>
		</div>
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

			<!-- Download tekst dropdown -->
			<div class="relative" data-dropdown>
				<button
					onclick={() => (downloadOpen = !downloadOpen)}
					aria-label="Download transcriptie"
					class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200 text-white/55 hover:text-white/80 hover:bg-white/5"
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
					Tekst
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if downloadOpen}
					<div
						class="absolute right-0 top-full mt-1 z-10 rounded-lg border border-white/10 bg-black/90 backdrop-blur-sm shadow-lg py-1 min-w-[140px]"
					>
						<!-- Word -->
						<button
							class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
							onclick={downloadAsDoc}
						>
							<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M6 2h9l5 5v15H6z" fill="#2B579A" opacity="0.9" />
								<path d="M15 2v5h5" fill="#1E3F6F" opacity="0.7" />
								<text
									x="12"
									y="16"
									text-anchor="middle"
									fill="white"
									font-size="7"
									font-weight="bold"
									font-family="sans-serif">W</text
								>
							</svg>
							Word (.doc)
						</button>
						<!-- PDF -->
						<button
							class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
							onclick={downloadAsPdf}
						>
							<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M6 2h9l5 5v15H6z" fill="#D93025" opacity="0.9" />
								<path d="M15 2v5h5" fill="#A52714" opacity="0.7" />
								<text
									x="12"
									y="16"
									text-anchor="middle"
									fill="white"
									font-size="6"
									font-weight="bold"
									font-family="sans-serif">PDF</text
								>
							</svg>
							PDF
						</button>
						<!-- Tekst -->
						<button
							class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
							onclick={downloadAsTxt}
						>
							<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M6 2h9l5 5v15H6z"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									opacity="0.6"
								/>
								<path
									d="M15 2v5h5"
									stroke="currentColor"
									stroke-width="1.5"
									opacity="0.4"
									fill="none"
								/>
								<line
									x1="9"
									y1="10"
									x2="17"
									y2="10"
									stroke="currentColor"
									stroke-width="1"
									opacity="0.5"
								/>
								<line
									x1="9"
									y1="13"
									x2="17"
									y2="13"
									stroke="currentColor"
									stroke-width="1"
									opacity="0.5"
								/>
								<line
									x1="9"
									y1="16"
									x2="14"
									y2="16"
									stroke="currentColor"
									stroke-width="1"
									opacity="0.5"
								/>
							</svg>
							Tekst (.txt)
						</button>
					</div>
				{/if}
			</div>

			<!-- WhatsApp delen -->
			<a
				href="https://wa.me/?text={encodeURIComponent(raw)}"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Deel via WhatsApp"
				class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200 text-white/55 hover:text-green-400 hover:bg-green-400/10"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
					/>
				</svg>
			</a>

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
				<div class="relative flex items-center gap-0.5" data-dropdown>
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
							use:focusOnMount
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

					<!-- Verwijder-knop -->
					<button
						class="rounded-full w-5 h-5 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
						onclick={() => removeSpeaker(speaker)}
						title="Verwijder spreker"
						aria-label="Verwijder {getSpeakerDisplayName(speaker)}"
					>
						<svg
							class="w-3 h-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					<!-- Merge-knop (alleen bij 2+ sprekers) -->
					{#if uniqueSpeakers.length >= 2}
						<button
							class="rounded-full w-5 h-5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
							onclick={() => (mergeOpenFor = mergeOpenFor === speaker ? null : speaker)}
							title="Voeg samen met andere spreker"
							aria-label="Samenvoegen {getSpeakerDisplayName(speaker)}"
						>
							<svg
								class="w-3 h-3"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						<!-- Merge dropdown -->
						{#if mergeOpenFor === speaker}
							<div
								class="absolute top-full left-0 mt-1 z-10 rounded-lg border border-white/10 bg-black/90 backdrop-blur-sm shadow-lg py-1 min-w-max"
							>
								<p class="px-3 py-1 text-[10px] text-white/40 uppercase tracking-wider">
									Voeg samen met
								</p>
								{#each uniqueSpeakers.filter((s) => s !== speaker) as target}
									{@const targetColors = getSpeakerColors(target)}
									<button
										class="w-full text-left px-3 py-1.5 text-xs {targetColors.text} hover:bg-white/10 transition-colors"
										onclick={() => mergeSpeaker(speaker, target)}
									>
										{getSpeakerDisplayName(target)}
									</button>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
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
