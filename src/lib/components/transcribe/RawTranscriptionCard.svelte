<script lang="ts">
	import ConfidenceHighlight from '$lib/components/ConfidenceHighlight.svelte';
	import type { WordWithConfidence, Mode } from '$lib/stores/transcribe.svelte';
	import { copyText, getTranscribeState } from '$lib/stores/transcribe.svelte';

	interface Props {
		raw: string;
		language: string;
		confidenceWords: WordWithConfidence[];
		transcribeMode: Mode;
	}

	let { raw, language, confidenceWords, transcribeMode }: Props = $props();

	const s = getTranscribeState();
</script>

{#if language}
	<div class="text-center text-sm text-white/40">
		Gedetecteerde taal: <span class="font-medium text-white/70">{language}</span>
	</div>
{/if}

<div
	class="gradient-border-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(212,255,0,0.15)]"
>
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-sm font-semibold text-white/70">Ruwe transcriptie</h2>
		<button
			onclick={() => copyText(raw, 'raw')}
			class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200
				{s.copiedRaw
				? 'text-green-400 glow-green bg-green-500/10 copy-bounce'
				: 'text-white/40 hover:text-white/70 hover:bg-white/5'}"
		>
			{#if s.copiedRaw}
				<svg
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
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
	<div
		class="max-h-48 overflow-y-auto whitespace-pre-wrap text-white/90 leading-relaxed rounded-lg border border-white/10 bg-white/5 p-3"
	>
		{#if confidenceWords.length > 0 && transcribeMode === 'api'}
			<ConfidenceHighlight words={confidenceWords} />
		{:else}
			{raw}
			{#if transcribeMode === 'local' && raw}
				<p class="mt-2 text-[10px] italic text-white/30">
					Woordzekerheid niet beschikbaar in lokale modus
				</p>
			{/if}
		{/if}
	</div>
</div>
