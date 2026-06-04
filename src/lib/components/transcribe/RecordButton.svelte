<script lang="ts">
	import type { Status, Mode } from '$lib/stores/transcribe.svelte';

	interface Props {
		status: Status;
		countdown: number;
		waveformBars: number[];
		partialText: string;
		reconnecting: boolean;
		reconnectStatus: string;
		formattedTime: string;
		formattedProcessingTime: string;
		processingProgress: number;
		recordingWarning: string;
		transcribeMode: Mode;
		apiStatus: string;
		estimatedTranscribeCost: string;
		onToggleRecording: () => void;
		onFileUpload: (e: Event) => void;
	}

	let {
		status,
		countdown,
		waveformBars,
		partialText,
		reconnecting,
		reconnectStatus,
		formattedTime,
		formattedProcessingTime,
		processingProgress,
		recordingWarning,
		transcribeMode,
		apiStatus,
		estimatedTranscribeCost,
		onToggleRecording,
		onFileUpload
	}: Props = $props();

	let fileInput: HTMLInputElement;
</script>

<div class="mb-6 sm:mb-10 flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
	<div class="relative">
		<!-- Pulse rings during recording -->
		{#if status === 'recording'}
			<div class="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring"></div>
			<div
				class="absolute inset-0 rounded-full bg-red-500/20 animate-pulse-ring"
				style="animation-delay: 0.5s"
			></div>
			<div
				class="absolute inset-0 rounded-full bg-red-500/15 animate-pulse-ring"
				style="animation-delay: 1s"
			></div>
		{/if}

		<!-- Conic gradient spinning border -->
		<div
			class="conic-border {status === 'preparing'
				? 'conic-border-preparing'
				: status === 'recording'
					? 'conic-border-recording'
					: status === 'processing'
						? 'conic-border-processing'
						: ''}"
		>
			<button
				onclick={onToggleRecording}
				disabled={status === 'processing'}
				class="relative z-10 flex h-24 w-24 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-[#0f1a14] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
					{status === 'recording'
					? 'animate-pulse-glow'
					: status === 'idle' || status === 'correcting'
						? 'hover:scale-[1.08] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]'
						: ''}"
			>
				{#if status === 'preparing'}
					<span class="animate-countdown text-3xl sm:text-4xl font-bold text-amber-400">
						{countdown}
					</span>
				{:else if status === 'recording'}
					<svg class="h-8 w-8 sm:h-12 sm:w-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
						<rect x="6" y="6" width="12" height="12" rx="2" />
					</svg>
				{:else if status === 'processing'}
					<svg
						class="h-8 w-8 sm:h-12 sm:w-12 text-white/60 animate-spin-slow"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				{:else}
					<svg
						class="h-8 w-8 sm:h-12 sm:w-12 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Live audio waveform visualizer -->
	{#if status === 'recording'}
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
							class="h-4 w-4 animate-spin text-white/70"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
							></path>
						</svg>
					{/if}
					<span class="text-sm text-white/80">
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
					<span class="text-xs font-medium text-white/50">Live transcriptie</span>
				</div>
				<p class="text-sm text-white/70 leading-relaxed max-h-32 overflow-y-auto">
					{partialText}
				</p>
			</div>
		{/if}
	{/if}

	<!-- Status text under button -->
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
				<span
					class="{apiStatus.includes('timeout') ? 'text-amber-400' : 'shimmer-text'} font-medium"
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
			<p class="text-sm text-white/30">Druk om op te nemen</p>
			<kbd class="kbd-hint hidden sm:inline-flex"
				><span class="text-white/40">spatie</span> om te starten/stoppen</kbd
			>
		</div>
	{/if}

	<!-- Upload button -->
	<button
		onclick={() => fileInput.click()}
		disabled={status !== 'idle' && status !== 'correcting'}
		class="upload-btn glass rounded-full border border-neon/10 px-5 py-2 text-sm text-neon/50 transition-all duration-200 hover:text-neon/80 hover:border-neon/30 hover:bg-neon/5 disabled:opacity-30 disabled:cursor-not-allowed"
	>
		<span class="flex items-center gap-2">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Upload bestand
		</span>
	</button>
	<input
		bind:this={fileInput}
		type="file"
		accept="audio/*"
		class="hidden"
		onchange={onFileUpload}
	/>
</div>
