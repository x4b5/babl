<script lang="ts">
	import { desktopLogin } from '$lib/config';

	interface Props {
		visible: boolean;
		onSuccess: () => void;
		onCancel: () => void;
	}

	let { visible, onSuccess, onCancel }: Props = $props();

	let dialogEl = $state<HTMLDivElement | null>(null);
	let password = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (loading || !password) return;
		loading = true;
		errorMsg = '';
		try {
			await desktopLogin(password);
			password = '';
			onSuccess();
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Inloggen mislukt.';
		} finally {
			loading = false;
		}
	}

	// Focus het wachtwoordveld zodra de modal verschijnt
	$effect(() => {
		if (visible && dialogEl) {
			dialogEl.querySelector<HTMLInputElement>('input')?.focus();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!visible) return;
		if (e.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
		onclick={onCancel}
		aria-label="Sluit inlogvenster"
	></button>

	<!-- Modal panel -->
	<div
		bind:this={dialogEl}
		class="fixed inset-x-4 top-1/2 z-70 mx-auto max-h-[85svh] max-w-md -translate-y-1/2 overflow-y-auto glass-strong rounded-2xl p-5 animate-slide-up sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
		role="dialog"
		aria-modal="true"
		aria-labelledby="api-login-title"
	>
		<!-- Header -->
		<div class="mb-4 flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
				<svg
					class="h-5 w-5 text-indigo-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</div>
			<div>
				<h2 id="api-login-title" class="text-lg font-semibold text-white">Inloggen voor cloud</h2>
				<p class="text-xs text-white/50">Nodig voor API-modus (AssemblyAI + Mistral)</p>
			</div>
		</div>

		<p class="mb-4 text-sm leading-relaxed text-white/70">
			De cloud-verwerking zit achter een wachtwoord. Log één keer in; daarna onthoudt de app je
			toegang.
		</p>

		<form onsubmit={handleSubmit}>
			{#if errorMsg}
				<div
					class="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
					role="alert"
				>
					{errorMsg}
				</div>
			{/if}

			<label for="api-password" class="mb-2 block text-xs font-medium text-white/60">
				Wachtwoord
			</label>
			<input
				id="api-password"
				type="password"
				autocomplete="current-password"
				bind:value={password}
				required
				class="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-neon/50 focus:ring-1 focus:ring-neon/30"
				placeholder="Wachtwoord"
			/>

			<div class="flex gap-3">
				<button
					type="submit"
					disabled={loading || !password}
					class="flex-1 rounded-xl bg-linear-to-r from-neon to-accent-start px-4 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Controleren...' : 'Inloggen'}
				</button>
				<button
					type="button"
					onclick={onCancel}
					class="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white/90 active:scale-[0.98]"
				>
					Annuleren
				</button>
			</div>
		</form>

		<p class="mt-3 text-center text-xs text-white/40">
			Liever niets naar de cloud? Gebruik de lokale modus (Whisper + Ollama).
		</p>
	</div>
{/if}
