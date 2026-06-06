<script lang="ts">
	import type { Status, Mode } from '$lib/stores/transcribe.svelte';

	interface Props {
		status: Status;
		formattedTime: string;
		formattedProcessingTime: string;
		processingProgress: number;
		recordingWarning: string;
		transcribeMode: Mode;
		apiStatus: string;
		estimatedTranscribeCost: string;
	}

	let {
		status,
		formattedTime,
		formattedProcessingTime,
		processingProgress,
		recordingWarning,
		transcribeMode,
		apiStatus,
		estimatedTranscribeCost
	}: Props = $props();
</script>

{#if status === 'preparing'}
	<div class="flex items-center gap-2 text-amber-400 font-medium animate-fade-in">
		<span class="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
		Maak je klaar...
	</div>
{:else if status === 'recording'}
	<div class="flex items-center gap-2 text-red-400 font-medium animate-fade-in">
		<span class="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
		Opname bezig — {formattedTime}
		{#if transcribeMode === 'api'}
			<span class="text-xs text-white/30 font-mono">${estimatedTranscribeCost}</span>
		{/if}
	</div>
	{#if recordingWarning}
		<div class="flex items-center gap-2 text-amber-400 text-xs animate-fade-in">
			<svg
				class="h-3.5 w-3.5 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
				/>
			</svg>
			{recordingWarning}
		</div>
	{/if}
{:else if status === 'processing'}
	<div class="flex flex-col items-center gap-3 animate-fade-in">
		<div class="flex items-center gap-3">
			<div class="flex gap-1">
				<span
					class="inline-block h-2 w-2 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out infinite;"
				></span>
				<span
					class="inline-block h-2 w-2 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out 0.2s infinite;"
				></span>
				<span
					class="inline-block h-2 w-2 rounded-full bg-neon"
					style="animation: dot-bounce 1.4s ease-in-out 0.4s infinite;"
				></span>
			</div>
			<span class="{apiStatus.includes('timeout') ? 'text-amber-400' : 'shimmer-text'} font-medium"
				>{apiStatus || 'Transcriberen...'}</span
			>
			<span class="text-sm text-white/30 font-mono">{formattedProcessingTime}</span>
		</div>
		<!-- Progress bar -->
		<div class="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
			<div
				class="h-full rounded-full bg-gradient-to-r from-neon to-accent-start transition-all duration-1000 ease-out"
				style="width: {processingProgress}%"
			></div>
		</div>
		<p class="text-xs text-white/20">
			{transcribeMode === 'api'
				? 'AssemblyAI transcribeert je audio'
				: 'Whisper large-v3 MLX analyseert je audio'}
			{#if transcribeMode === 'api'}
				<span class="font-mono text-amber-400/60">— ${estimatedTranscribeCost}</span>
			{/if}
		</p>
	</div>
{:else}
	<div class="flex flex-col items-center gap-2">
		<p class="text-base sm:text-sm text-white/30">Druk om op te nemen</p>
		<kbd class="kbd-hint hidden sm:inline-flex"
			><span class="text-white/40">spatie</span> om te starten/stoppen</kbd
		>
	</div>
{/if}
