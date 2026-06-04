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
</svelte:head>

{@render children()}
