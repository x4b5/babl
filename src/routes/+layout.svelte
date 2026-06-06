<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { loadConsent, getConsentState } from '$lib/stores/consent.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';

	let { children } = $props();

	const consent = getConsentState();

	onMount(() => {
		loadConsent();
	});

	$effect(() => {
		if (consent.isGranted) {
			import('$lib/utils/analytics').then(({ initAnalytics, setupAbandonmentTracking }) => {
				initAnalytics();
				import('$lib/stores/transcribe.svelte').then(({ getTranscribeState }) => {
					const s = getTranscribeState();
					setupAbandonmentTracking(() => ({
						status: s.status
					}));
				});
			});
		} else if (consent.isDenied) {
			import('$lib/utils/analytics').then(({ shutdownAnalytics }) => {
				shutdownAnalytics();
			});
		}
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

{#if consent.isPending}
	<CookieConsent />
{/if}
