<script lang="ts">
	import type { Status, Mode } from '$lib/stores/transcribe.svelte';
	import WaveformDisplay from './WaveformDisplay.svelte';
	import RecordingStatus from './RecordingStatus.svelte';

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
		localAvailable: boolean;
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
		localAvailable,
		apiStatus,
		estimatedTranscribeCost,
		onToggleRecording,
		onFileUpload
	}: Props = $props();

	let localUnavailable = $derived(transcribeMode === 'local' && !localAvailable);

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
				disabled={(status === 'processing' || localUnavailable) && status !== 'recording'}
				aria-label="Opname starten of stoppen"
				class="relative z-10 flex h-24 w-24 sm:h-36 sm:w-36 items-center justify-center rounded-full bg-[#3e4553] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
					{status === 'recording'
					? 'animate-pulse-glow'
					: status === 'idle' || status === 'polishing'
						? 'hover:scale-[1.08] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]'
						: ''}"
			>
				{#if status === 'preparing'}
					<span class="animate-countdown text-3xl sm:text-4xl font-bold text-amber-400">
						{countdown}
					</span>
				{:else if status === 'recording'}
					<svg
						class="h-8 w-8 sm:h-12 sm:w-12 text-red-400"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<rect x="6" y="6" width="12" height="12" rx="2" />
					</svg>
				{:else if status === 'processing'}
					<svg
						class="h-8 w-8 sm:h-12 sm:w-12 text-white/60 animate-spin-slow"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				{:else}
					<svg
						class="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
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

	{#if status === 'recording'}
		<WaveformDisplay {waveformBars} {reconnecting} {reconnectStatus} {partialText} />
	{/if}

	<RecordingStatus
		{status}
		{formattedTime}
		{formattedProcessingTime}
		{processingProgress}
		{recordingWarning}
		{transcribeMode}
		{apiStatus}
		{estimatedTranscribeCost}
	/>

	<!-- Upload button -->
	<button
		onclick={() => fileInput.click()}
		disabled={(status !== 'idle' && status !== 'polishing') || localUnavailable}
		class="upload-btn glass rounded-full border border-neon/10 px-5 py-2 text-sm text-neon/50 transition-all duration-200 hover:text-neon/80 hover:border-neon/30 hover:bg-neon/5 disabled:opacity-30 disabled:cursor-not-allowed"
	>
		<span class="flex items-center gap-2">
			<svg
				class="h-4 w-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
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
