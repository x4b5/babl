<script lang="ts">
	import { deleteAllLocalData, exportLocalData } from '$lib/utils/data-management';
	import { resetConsent } from '$lib/stores/consent.svelte';
	import { revokeApiConsent } from '$lib/stores/api-consent.svelte';

	const version = __APP_VERSION__;
	const buildDate = __APP_BUILD_DATE__;

	let showDataOptions = $state(false);
	let confirmingDelete = $state(false);

	async function handleDelete() {
		await deleteAllLocalData();
		confirmingDelete = false;
		window.location.reload();
	}
</script>

<footer class="mt-12 sm:mt-16 animate-fade-in">
	<div class="flex flex-col items-center gap-2">
		<div class="flex flex-wrap items-center justify-center gap-2 text-xs text-white/40">
			<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
			<span class="text-white/20">|</span>
			<a href="/cookies" class="hover:text-white/60 transition-colors">Cookies</a>
			<span class="text-white/20">|</span>
			<a href="/voorwaarden" class="hover:text-white/60 transition-colors">Voorwaarden</a>
			<span class="text-white/20">|</span>
			<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
		</div>

		<div class="flex items-center gap-3 text-xs text-white/30">
			<button
				onclick={() => (showDataOptions = !showDataOptions)}
				class="hover:text-white/50 transition-colors cursor-pointer"
			>
				Mijn data
				<svg
					class="inline h-3 w-3 ml-0.5 transition-transform duration-200 {showDataOptions
						? 'rotate-180'
						: ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			<span class="text-white/15">|</span>
			<a href="/logout" class="hover:text-red-400/70 transition-colors"> Uitloggen </a>
		</div>

		{#if showDataOptions}
			<div class="flex flex-wrap items-center justify-center gap-2 animate-slide-up">
				<button
					onclick={() => exportLocalData()}
					class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/60"
				>
					Exporteer
				</button>
				{#if confirmingDelete}
					<div class="flex items-center gap-2">
						<span class="text-xs text-red-400">Zeker weten?</span>
						<button
							onclick={handleDelete}
							class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
						>
							Ja, wis alles
						</button>
						<button
							onclick={() => (confirmingDelete = false)}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10"
						>
							Annuleer
						</button>
					</div>
				{:else}
					<button
						onclick={() => (confirmingDelete = true)}
						class="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
					>
						Wis data
					</button>
				{/if}
				<button
					onclick={() => resetConsent()}
					class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/60"
				>
					Cookies
				</button>
				<button
					onclick={() => revokeApiConsent()}
					class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/60"
				>
					API consent
				</button>
			</div>
		{/if}

		<p class="text-[10px] text-white/20 mt-1">v{version} — {buildDate}</p>
	</div>
</footer>
