<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		const { setupAbandonmentTracking } = await import('$lib/utils/analytics');
		const { getTranscribeState } = await import('$lib/stores/transcribe.svelte');
		const s = getTranscribeState();
		setupAbandonmentTracking(() => ({
			status: s.status
		}));
	});
</script>

<svelte:head>
	<title>BABL</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
