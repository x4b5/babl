<script lang="ts">
	import type { Status } from '$lib/stores/transcribe.svelte';

	interface Props {
		status: Status;
		hasRaw: boolean;
		hasPolished: boolean;
	}

	let { status, hasRaw, hasPolished }: Props = $props();

	const steps = [
		{ id: 'transcribe', label: 'Spraak → Tekst' },
		{ id: 'polish', label: 'Polijsten' },
		{ id: 'report', label: 'Verslaglegging' }
	] as const;

	type StepState = 'completed' | 'active' | 'ready' | 'upcoming';

	function getStepState(stepId: string): StepState {
		if (stepId === 'transcribe') {
			if (status === 'recording' || status === 'processing' || status === 'preparing')
				return 'active';
			if (hasRaw) return 'completed';
			return 'ready';
		}
		if (stepId === 'polish') {
			if (status === 'polishing' || hasPolished) return 'completed';
			if (hasRaw && status === 'idle') return 'ready';
			return 'upcoming';
		}
		if (stepId === 'report') {
			if (hasPolished) return 'completed';
			if (status === 'polishing') return 'active';
			return 'upcoming';
		}
		return 'upcoming';
	}
</script>

<div class="mb-5" aria-label="Voortgang">
	<div class="glass rounded-xl px-4 py-3">
		<div class="flex items-center justify-between gap-1 sm:gap-2">
			{#each steps as step, i}
				{@const state = getStepState(step.id)}
				<div class="flex items-center gap-1 sm:gap-2 min-w-0">
					<!-- Step indicator circle -->
					<div
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300
							{state === 'completed' ? 'bg-neon/20 text-neon' : ''}
							{state === 'active' ? 'bg-neon/30 text-neon ring-2 ring-neon/40 animate-pulse-glow' : ''}
							{state === 'ready' ? 'bg-neon/10 text-neon/70 ring-1 ring-neon/30' : ''}
							{state === 'upcoming' ? 'bg-white/5 text-white/20' : ''}"
					>
						{#if state === 'completed'}
							<svg
								class="h-3.5 w-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="3"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else if state === 'active'}
							<div class="h-2 w-2 rounded-full bg-neon animate-pulse"></div>
						{:else if state === 'ready'}
							<div class="h-2 w-2 rounded-full bg-neon/50"></div>
						{:else}
							<div class="h-1.5 w-1.5 rounded-full bg-current opacity-50"></div>
						{/if}
					</div>
					<!-- Step label -->
					<span
						class="text-xs font-medium truncate transition-colors duration-300
							{state === 'completed' ? 'text-neon/70' : ''}
							{state === 'active' ? 'text-neon' : ''}
							{state === 'ready' ? 'text-neon/60' : ''}
							{state === 'upcoming' ? 'text-white/20' : ''}"
					>
						{step.label}
					</span>
				</div>

				<!-- Arrow between steps -->
				{#if i < steps.length - 1}
					<svg
						class="h-3 w-3 shrink-0 transition-colors duration-300
							{state === 'completed' ? 'text-neon/50' : 'text-white/15'}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
			{/each}
		</div>
	</div>
</div>
