<script lang="ts">
	import { deleteAllLocalData, exportLocalData } from '$lib/utils/data-management';
	import { resetConsent } from '$lib/stores/consent.svelte';

	const version = __APP_VERSION__;
	const buildDate = __APP_BUILD_DATE__;

	let confirmingDelete = $state(false);

	async function handleDelete() {
		await deleteAllLocalData();
		confirmingDelete = false;
		window.location.reload();
	}
</script>

<div class="mt-12 sm:mt-16 animate-fade-in">
	<a
		href="/about"
		class="glass w-full rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between transition-all duration-300 hover:bg-white/8"
	>
		<div class="flex items-center gap-2 sm:gap-3">
			<div
				class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-linear-to-br from-neon/20 to-accent-start/20"
			>
				<svg
					class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					/>
				</svg>
			</div>
			<span class="text-xs sm:text-sm font-medium text-white/80"
				>Over BABL — privacy, technologie & transparantie</span
			>
		</div>
		<svg
			class="h-4 w-4 text-white/60"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</a>

	<!-- Data management (AVG rechten) — altijd zichtbaar -->
	<div class="mt-3 glass-strong rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
		<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/55">Jouw data</p>
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => exportLocalData()}
				class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
			>
				Exporteer mijn data
			</button>
			{#if confirmingDelete}
				<div class="flex items-center gap-2">
					<span class="text-xs text-red-400">Weet je het zeker?</span>
					<button
						onclick={handleDelete}
						class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
					>
						Ja, wis alles
					</button>
					<button
						onclick={() => (confirmingDelete = false)}
						class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
					>
						Annuleren
					</button>
				</div>
			{:else}
				<button
					onclick={() => (confirmingDelete = true)}
					class="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
				>
					Wis mijn data
				</button>
			{/if}
			<button
				onclick={() => resetConsent()}
				class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
			>
				Cookie-instellingen
			</button>
		</div>
	</div>

	<div class="mt-4 flex flex-col items-center gap-1">
		<div class="flex items-center gap-2 text-xs text-white/50">
			<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
			<span class="text-white/40">|</span>
			<a href="/cookies" class="hover:text-white/60 transition-colors">Cookies</a>
			<span class="text-white/40">|</span>
			<a href="/voorwaarden" class="hover:text-white/60 transition-colors">Voorwaarden</a>
			<span class="text-white/40">|</span>
			<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
		</div>
		<p class="text-xs text-white/50">v{version} — {buildDate}</p>
	</div>
</div>
