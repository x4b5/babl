<script lang="ts">
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<header class="mb-6 sm:mb-12 text-center animate-fade-in">
	<h1
		class="gradient-text mb-2 sm:mb-4 text-5xl font-normal tracking-tighter sm:text-8xl md:text-9xl select-none"
	>
		<span class="inline-block hover:animate-letter-bounce">B</span><span
			class="inline-block hover:animate-letter-bounce">A</span
		><span class="inline-block hover:animate-letter-bounce">B</span><span
			class="inline-block hover:animate-letter-bounce">L</span
		>
	</h1>
	<p class="mb-3 sm:mb-4 text-xs sm:text-lg text-white/50">
		Spraak naar tekst met Limburgse dialectcorrectie
	</p>
	<div class="flex items-center justify-center gap-2">
		<span
			class="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium text-white/60"
		>
			<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
			Privacy-bewust
		</span>
		<a
			href="/logout"
			class="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
		>
			<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			Uitloggen
		</a>
	</div>
</header>
