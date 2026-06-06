<script lang="ts">
	interface Props {
		waveformBars: number[];
		reconnecting: boolean;
		reconnectStatus: string;
		partialText: string;
	}

	let { waveformBars, reconnecting, reconnectStatus, partialText }: Props = $props();
</script>

<div class="waveform-container animate-fade-in">
	{#each waveformBars as height}
		<div class="waveform-bar" style="height: {height}px"></div>
	{/each}
</div>

<!-- Reconnection banner -->
{#if reconnecting || reconnectStatus}
	<div
		class="w-full max-w-xl animate-fade-in rounded-lg border border-white/12 px-4 py-3"
		style="background: rgba(255, 255, 255, 0.08); border-left: 4px solid {reconnecting
			? 'var(--color-neon)'
			: '#ef4444'};"
	>
		<div class="flex items-center gap-3">
			{#if reconnecting}
				<svg
					class="h-4 w-4 animate-spin text-white/80"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					></path>
				</svg>
			{/if}
			<span class="text-sm text-white/90">
				{reconnectStatus ||
					'Verbinding verloren. Je opname is bewaard — gebruik Bestand Upload om alsnog te transcriberen.'}
			</span>
		</div>
	</div>
{/if}

<!-- Live transcription preview -->
{#if partialText}
	<div class="glass rounded-2xl p-4 w-full max-w-xl animate-fade-in">
		<div class="flex items-center gap-2 mb-2">
			<span class="inline-block h-2 w-2 rounded-full bg-neon animate-pulse"></span>
			<span class="text-xs font-medium text-white/60">Live transcriptie</span>
		</div>
		<p class="text-sm text-white/80 leading-relaxed max-h-32 overflow-y-auto">
			{partialText}
		</p>
	</div>
{/if}
