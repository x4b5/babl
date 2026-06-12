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
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
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
					Word
				</button>
				<button
					onclick={() => downloadPdf(polished)}
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
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
				<button
					onclick={() => downloadTxt(polished)}
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
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
					Tekst
				</button>
			</div>

			<div class="mt-2 flex items-center justify-center gap-2">
				<span class="text-xs text-white/30 mr-1">Verzenden:</span>
				<a
					href="https://wa.me/?text={encodeURIComponent(polished)}"
					target="_blank"
					rel="noopener noreferrer"
					onclick={(e) => {
						if (
							!confirm(
								'Let op: de tekst wordt gedeeld via WhatsApp (Meta, servers buiten de EU). Doorgaan?'
							)
						) {
							e.preventDefault();
						}
					}}
					aria-label="Verzend via WhatsApp"
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/55 hover:text-green-400 hover:bg-green-400/10 transition-all duration-200"
				>
					<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
						/>
					</svg>
					WhatsApp
				</a>
			</div>
		{/if}
	</div>
{/if}
