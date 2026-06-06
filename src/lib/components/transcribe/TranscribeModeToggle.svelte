<script lang="ts">
	import type { Mode } from '$lib/stores/transcribe.svelte';

	interface Props {
		transcribeMode: Mode;
		localAvailable: boolean;
		assemblyAvailable: boolean;
		onTranscribeModeChange: (mode: Mode) => void;
		onOpenSetupWizard?: () => void;
	}

	let {
		transcribeMode,
		localAvailable,
		assemblyAvailable,
		onTranscribeModeChange,
		onOpenSetupWizard
	}: Props = $props();
</script>

<div class="mb-6 flex flex-col items-center gap-1 animate-fade-in w-full sm:w-auto">
	<div class="glass flex rounded-full p-1 w-full sm:w-auto">
		<button
			onclick={() => onTranscribeModeChange('local')}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'local'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/60 hover:text-white/80 scale-100'}"
		>
			<span class="block">Op dit apparaat</span>
			<span class="block text-xs opacity-70"
				><img src="/openai.png" alt="" class="inline h-3 w-3 -mt-0.5 rounded-full" /> Whisper</span
			>
		</button>
		<button
			onclick={() => onTranscribeModeChange('api')}
			disabled={!assemblyAvailable}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'api'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/60 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
		>
			<span class="block">Via internet</span>
			<span class="block text-xs opacity-70"
				><img src="/assemblyai.png" alt="" class="inline h-3 w-3 -mt-0.5" /> AssemblyAI</span
			>
		</button>
	</div>
	{#if !localAvailable && onOpenSetupWizard}
		<button
			onclick={onOpenSetupWizard}
			class="text-xs underline text-white/60 hover:text-white/80 transition-colors cursor-pointer"
		>
			Installeren op je apparaat
		</button>
	{/if}
	<a
		href="/about#voor-en-nadelen"
		class="text-sm text-white/30 hover:text-white/50 transition-colors underline mt-2"
	>
		Voor- en nadelen van beide opties
	</a>
</div>
