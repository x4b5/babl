<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<div class="fixed top-4 right-4 z-50">
	<ThemeToggle />
</div>

<header class="mb-8 sm:mb-16 text-center animate-fade-in">
	<h1
		class="gradient-text mb-0 text-5xl font-normal tracking-tighter sm:text-8xl md:text-9xl select-none"
	>
		<span class="inline-block hover:animate-letter-bounce">B</span><span
			class="inline-block hover:animate-letter-bounce">A</span
		><span class="inline-block hover:animate-letter-bounce">B</span><span
			class="inline-block hover:animate-letter-bounce">L</span
		>
	</h1>
	<div class="mb-3 sm:mb-4 text-center">
		<p
			class="text-lg sm:text-2xl font-semibold tracking-[0.15em] sm:tracking-[0.25em] text-white/70"
		>
			van spraak naar tekst
		</p>
		<p class="text-sm sm:text-lg italic mt-3 max-w-[280px] sm:max-w-none mx-auto text-white/40">
			Oog voor privacy met een gevoel voor Limburgs
		</p>
	</div>
</header>
