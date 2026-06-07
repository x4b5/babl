<script lang="ts">
	import type { Status } from '$lib/stores/transcribe.svelte';

	interface Props {
		status: Status;
	}

	let { status }: Props = $props();

	const steps = [
		{ id: 'recording', label: 'Opnemen' },
		{ id: 'processing', label: 'Transcriptie' },
		{ id: 'polishing', label: 'Polijsten' }
	] as const;

	type StepId = (typeof steps)[number]['id'];

	const stepOrder: StepId[] = ['recording', 'processing', 'polishing'];

	function getStepState(stepId: StepId): 'completed' | 'active' | 'upcoming' | 'idle' {
		if (status === 'idle' || status === 'preparing') return 'idle';

		const currentIndex = stepOrder.indexOf(status as StepId);
		const stepIndex = stepOrder.indexOf(stepId);

		if (stepIndex < currentIndex) return 'completed';
		if (stepIndex === currentIndex) return 'active';
		return 'upcoming';
	}
</script>

{#if status !== 'idle' && status !== 'preparing'}
	<div class="mb-5 animate-fade-in" aria-label="Voortgang">
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
								{state === 'upcoming' ? 'bg-white/5 text-white/30' : ''}
								{state === 'idle' ? 'bg-white/5 text-white/20' : ''}"
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
							{:else}
								<div class="h-1.5 w-1.5 rounded-full bg-current opacity-50"></div>
							{/if}
						</div>
						<!-- Step label -->
						<span
							class="text-xs font-medium truncate transition-colors duration-300
								{state === 'completed' ? 'text-neon/70' : ''}
								{state === 'active' ? 'text-neon' : ''}
								{state === 'upcoming' ? 'text-white/30' : ''}
								{state === 'idle' ? 'text-white/20' : ''}"
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
{/if}
