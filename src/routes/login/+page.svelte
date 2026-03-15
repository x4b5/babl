<script lang="ts">
	import '../../app.css';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap"
		rel="stylesheet"
	/>
	<title>Login — BABL</title>
</svelte:head>

<div class="bg-dark-gradient min-h-screen flex items-center justify-center">
	<div class="floating-orb orb-violet"></div>
	<div class="floating-orb orb-indigo"></div>
	<div class="floating-orb orb-cyan"></div>

	<div class="w-full max-w-sm px-4 animate-fade-in">
		<header class="mb-10 text-center">
			<h1 class="gradient-text mb-3 text-7xl font-normal tracking-tighter select-none">BABL</h1>
			<p class="text-sm text-white/40">Voer het wachtwoord in om door te gaan</p>
		</header>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="glass-strong rounded-2xl p-6"
		>
			{#if form?.incorrect}
				<div
					class="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-300 text-sm animate-slide-up"
				>
					Onjuist wachtwoord
				</div>
			{/if}

			<label for="password" class="mb-2 block text-xs font-medium text-white/50">Wachtwoord</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				autofocus
				class="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-neon/50 focus:ring-1 focus:ring-neon/30"
				placeholder="Wachtwoord"
			/>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-xl bg-linear-to-r from-neon to-accent-start px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,255,0,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<span class="flex items-center justify-center gap-2">
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="3"
								class="opacity-25"
							/>
							<path
								d="M4 12a8 8 0 018-8"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
						Controleren...
					</span>
				{:else}
					Doorgaan
				{/if}
			</button>
		</form>
	</div>
</div>
