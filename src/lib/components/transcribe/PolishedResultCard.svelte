<script lang="ts">
	import type { Status, Mode, AiMetadata } from '$lib/stores/transcribe.svelte';
	import { copyText } from '$lib/stores/transcribe.svelte';
	import { downloadTxt, downloadDocx, downloadPdf } from '$lib/utils/download-report';

	interface Props {
		polished: string;
		status: Status;
		onToggleExpand: () => void;
		expanded: boolean;
		copiedPolished: boolean;
		polishMode: Mode;
		aiMetadata?: AiMetadata | null;
	}

	let {
		polished,
		status,
		onToggleExpand,
		expanded,
		copiedPolished,
		polishMode,
		aiMetadata = null
	}: Props = $props();

	let aiLabel = $derived(
		aiMetadata
			? `AI-gegenereerd · ${aiMetadata.model} (${aiMetadata.provider === 'mistral' ? 'EU' : 'lokaal'})`
			: `AI-gegenereerd · ${polishMode === 'local' ? 'Ollama (lokaal)' : 'Mistral AI (EU)'}`
	);
</script>

{#if status === 'polishing' && !polished}
	<div class="gradient-border-card p-5 animate-fade-in">
		<div class="mb-3">
			<h2 class="text-base sm:text-sm font-semibold text-white/80">Gepolijst Nederlands</h2>
			<p class="text-[11px] text-white/40 mt-0.5">
				{aiLabel}
			</p>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex gap-1">
				<span
					class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out infinite;"
				></span>
				<span
					class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out 0.2s infinite;"
				></span>
				<span
					class="inline-block h-1.5 w-1.5 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out 0.4s infinite;"
				></span>
			</div>
			<span class="shimmer-text text-sm">Polijsten...</span>
		</div>
	</div>
{/if}

{#if polished}
	<div
		class="gradient-border-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-slide-up"
	>
		<div class="mb-3 flex items-center justify-between">
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-base sm:text-sm font-semibold text-white/80">Gepolijst Nederlands</h2>
					{#if status === 'polishing'}
						<span class="inline-block h-2 w-2 rounded-full bg-neon animate-pulse"></span>
					{/if}
				</div>
				<p class="text-[11px] text-white/40 mt-0.5">
					AI-gegenereerd · {polishMode === 'local' ? 'Ollama (lokaal)' : 'Mistral AI (EU)'}
				</p>
			</div>
			<button
				onclick={() => copyText(polished, 'polished')}
				aria-label={copiedPolished ? 'Gepolijst gekopieerd' : 'Kopieer gepolijst'}
				class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all duration-200
					{copiedPolished
					? 'text-green-400 glow-green bg-green-500/10 copy-bounce'
					: 'text-white/55 hover:text-white/80 hover:bg-white/5'}"
			>
				{#if copiedPolished}
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
		<div class="relative">
			<div
				class="whitespace-pre-wrap text-white leading-relaxed overflow-hidden transition-[max-height] duration-500 ease-in-out"
				style="max-height: {expanded ? 'none' : '12rem'}"
			>
				{polished}
			</div>
			{#if !expanded}
				<div
					class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f1a14] to-transparent pointer-events-none"
				></div>
			{/if}
		</div>
		<button
			onclick={onToggleExpand}
			aria-label={expanded ? 'Tekst inklappen' : 'Volledige tekst tonen'}
			class="mt-2 w-full text-center text-xs text-white/55 hover:text-white/80 transition-colors duration-200"
		>
			{expanded ? 'Inklappen' : 'Lees meer...'}
		</button>

		{#if status !== 'polishing'}
			<div class="mt-4 flex items-center justify-center gap-2 border-t border-white/5 pt-3">
				<span class="text-xs text-white/30 mr-1">Download:</span>
				<button
					onclick={() => downloadDocx(polished)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
				>
					Word
				</button>
				<button
					onclick={() => downloadPdf(polished)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
				>
					PDF
				</button>
				<button
					onclick={() => downloadTxt(polished)}
					class="rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
				>
					Tekst
				</button>
			</div>
		{/if}
	</div>
{/if}
