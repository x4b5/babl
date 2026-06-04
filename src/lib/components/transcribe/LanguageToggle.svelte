<script lang="ts">
	import type { Lang } from '$lib/stores/transcribe.svelte';

	interface Props {
		lang: Lang;
		onchange: (lang: Lang) => void;
	}

	let { lang, onchange }: Props = $props();

	const options: { value: Lang; label: string }[] = [
		{ value: 'auto', label: 'Standaard' },
		{ value: 'nl', label: 'Nederlands' },
		{ value: 'li', label: 'Limburgs' },
		{ value: 'en', label: 'Engels' }
	];
</script>

<div class="mb-4 sm:mb-8 flex flex-col items-center gap-3 animate-fade-in">
	<div class="glass flex flex-wrap justify-center rounded-2xl sm:rounded-full p-1 w-full sm:w-auto">
		{#each options as opt}
			<button
				onclick={() => onchange(opt.value)}
				class="flex-1 sm:flex-none rounded-xl sm:rounded-full px-3 py-2 text-xs sm:px-5 sm:py-2 sm:text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] {lang ===
				opt.value
					? 'bg-linear-to-r from-neon to-accent-start text-black shadow-lg shadow-neon/20 scale-105'
					: 'text-neon/40 hover:text-neon/70 scale-100'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</div>
