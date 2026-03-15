<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		const { setupAbandonmentTracking } = await import('$lib/utils/analytics');
		const { getGameState } = await import('$lib/stores/game.svelte');
		const game = getGameState();
		setupAbandonmentTracking(() => ({
			phase: game.phase
		}));
	});
</script>

<svelte:head>
	<title>[APP_NAME]</title>
</svelte:head>

{@render children()}
