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
		recordingWarning: string;
		transcribeMode: Mode;
		localAvailable: boolean;
		apiStatus: string;
		estimatedTranscribeCost: string;
		onToggleRecording: () => void;
		onPauseResume: () => void;
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
		recordingWarning,
		transcribeMode,
		localAvailable,
		apiStatus,
		estimatedTranscribeCost,
		onToggleRecording,
		onPauseResume,
		onFileUpload
	}: Props = $props();

	let localUnavailable = $derived(transcribeMode === 'local' && !localAvailable);

	let fileInput: HTMLInputElement;
</script>

<div class="mb-6 sm:mb-10 flex flex-col items-center gap-4 sm:gap-6 animate-fade-in">
	<div class="relative">
		<!-- Pulse rings during recording (not when paused) -->
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
					: status === 'paused'
						? 'conic-border-recording'
						: status === 'processing'
							? 'conic-border-processing'
							: ''}"
		>
			<button
				onclick={onToggleRecording}
				disabled={(status === 'processing' || localUnavailable) &&
					status !== 'recording' &&
					status !== 'paused'}
				aria-label={status === 'recording' || status === 'paused'
					? 'Opname stoppen'
					: 'Opname starten'}
				class="relative z-10 flex h-24 w-24 sm:h-44 sm:w-44 items-center justify-center rounded-full bg-[#3e4553] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
					{status === 'recording'
					? 'animate-pulse-glow'
					: status === 'paused'
						? 'shadow-[0_0_40px_rgba(234,179,8,0.2)]'
						: status === 'idle' || status === 'polishing'
							? 'shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:scale-[1.08] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]'
							: ''}"
			>
				{#if status === 'preparing'}
					<span class="animate-countdown text-3xl sm:text-4xl font-bold text-amber-400">
						{countdown}
					</span>
				{:else if status === 'recording' || status === 'paused'}
					<svg
						class="h-8 w-8 sm:h-14 sm:w-14 {status === 'paused'
							? 'text-yellow-400'
							: 'text-red-400'}"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<rect x="6" y="6" width="12" height="12" rx="2" />
					</svg>
				{:else if status === 'processing'}
					<!-- Boog-spinner: kwart cirkel in neon op een vage volledige cirkel -->
					<svg
						class="h-8 w-8 sm:h-14 sm:w-14 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9" class="stroke-white/10" stroke-width="2.5" />
						<path
							d="M12 3a9 9 0 0 1 9 9"
							class="stroke-neon"
							stroke-width="2.5"
							stroke-linecap="round"
						/>
					</svg>
				{:else}
					<svg
						class="h-8 w-8 sm:h-14 sm:w-14 text-yellow-400"
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

		<!-- Pauze/hervat-knop naast de hoofdknop -->
		{#if status === 'recording' || status === 'paused'}
			<button
				onclick={onPauseResume}
				aria-label={status === 'recording' ? 'Opname pauzeren' : 'Opname hervatten'}
				title={status === 'recording' ? 'Pauzeren' : 'Hervatten'}
				class="glass absolute top-1/2 left-full ml-3 sm:ml-5 flex h-12 w-12 sm:h-14 sm:w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 text-yellow-400 transition-all duration-200 hover:scale-105 hover:border-yellow-400/30 hover:bg-yellow-400/10 animate-fade-in"
			>
				{#if status === 'recording'}
					<svg
						class="h-5 w-5 sm:h-6 sm:w-6"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<rect x="7" y="5" width="4" height="14" rx="1" />
						<rect x="13" y="5" width="4" height="14" rx="1" />
					</svg>
				{:else}
					<svg
						class="h-5 w-5 sm:h-6 sm:w-6"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z"
						/>
					</svg>
				{/if}
			</button>
		{/if}
	</div>

	{#if status === 'recording' || status === 'paused'}
		<WaveformDisplay {waveformBars} {reconnecting} {reconnectStatus} {partialText} />
	{/if}

	<RecordingStatus
		{status}
		{formattedTime}
		{formattedProcessingTime}
		{recordingWarning}
		{transcribeMode}
		{apiStatus}
		{estimatedTranscribeCost}
	/>

	<!-- Upload button -->
	<button
		onclick={() => fileInput.click()}
		disabled={(status !== 'idle' && status !== 'polishing') || localUnavailable}
		class="upload-btn glass rounded-full border border-white/10 px-5 py-2 text-sm text-white/40 transition-all duration-200 hover:text-neon/70 hover:border-neon/20 hover:bg-neon/5 disabled:opacity-30 disabled:cursor-not-allowed"
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
		accept="audio/*,video/webm,.webm,.ogg,.mp4,.wav,.m4a"
		class="hidden"
		onchange={onFileUpload}
	/>
</div>
