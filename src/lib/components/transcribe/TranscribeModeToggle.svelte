<script lang="ts">
	import type { Mode, ApiStreamMode } from '$lib/stores/transcribe.svelte';

	interface Props {
		transcribeMode: Mode;
		apiStreamMode: ApiStreamMode;
		localAvailable: boolean;
		assemblyAvailable: boolean;
		onTranscribeModeChange: (mode: Mode) => void;
		onApiStreamModeChange: (mode: ApiStreamMode) => void;
	}

	let {
		transcribeMode,
		apiStreamMode,
		localAvailable,
		assemblyAvailable,
		onTranscribeModeChange,
		onApiStreamModeChange
	}: Props = $props();
</script>

<div class="mb-4 flex flex-col items-center gap-2 animate-fade-in w-full sm:w-auto">
	<div class="glass flex rounded-full p-1 w-full sm:w-auto">
		<button
			onclick={() => onTranscribeModeChange('local')}
			disabled={!localAvailable}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'local'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
		>
			Lokaal
		</button>
		<button
			onclick={() => onTranscribeModeChange('api')}
			disabled={!assemblyAvailable}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'api'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/50 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
		>
			API
		</button>
	</div>
	{#if transcribeMode === 'api'}
		<div class="glass inline-flex rounded-full p-1">
			<button
				onclick={() => onApiStreamModeChange('realtime')}
				class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {apiStreamMode ===
				'realtime'
					? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
					: 'text-white/50 hover:text-white/80 scale-100'}"
			>
				Real-time
			</button>
			<button
				onclick={() => onApiStreamModeChange('accurate')}
				class="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {apiStreamMode ===
				'accurate'
					? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
					: 'text-white/50 hover:text-white/80 scale-100'}"
			>
				Nauwkeurig
			</button>
		</div>
		<p class="text-xs text-white/40">
			{apiStreamMode === 'realtime'
				? 'AssemblyAI — live streaming (geen sprekerdetectie)'
				: 'AssemblyAI — batch met sprekerdetectie'}
		</p>
	{/if}
</div>
