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

<div class="mb-4 flex flex-col items-center gap-3 animate-fade-in w-full sm:w-auto">
	<div class="glass flex rounded-full p-1 w-full sm:w-auto">
		<button
			onclick={() => onTranscribeModeChange('local')}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'local'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/60 hover:text-white/80 scale-100'}"
		>
			Op dit apparaat
		</button>
		<button
			onclick={() => onTranscribeModeChange('api')}
			disabled={!assemblyAvailable}
			class="flex-1 sm:flex-none rounded-full px-4 py-2 text-xs sm:py-1.5 font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {transcribeMode ===
			'api'
				? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
				: 'text-white/60 hover:text-white/80 scale-100'} disabled:opacity-30 disabled:cursor-not-allowed"
		>
			Via internet
		</button>
	</div>
	<p class="text-sm text-white/40 text-center max-w-xs">
		{#if transcribeMode === 'local' && localAvailable}
			Verwerking gebeurt volledig op jouw computer. Niets verlaat je apparaat.
		{:else if transcribeMode === 'local' && !localAvailable && onOpenSetupWizard}
			<button
				onclick={onOpenSetupWizard}
				class="underline text-white/60 hover:text-white/80 transition-colors cursor-pointer"
			>
				Je moet dit nog installeren op je apparaat.
			</button>
		{:else if transcribeMode === 'local' && !localAvailable}
			Je moet dit nog installeren op je apparaat.
		{:else}
			Audio wordt verwerkt via EU-servers (AssemblyAI).
		{/if}
	</p>
</div>
