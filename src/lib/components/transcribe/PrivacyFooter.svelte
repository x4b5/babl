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
	<!-- Data management (AVG rechten) -->
	<div class="glass-strong rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
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
