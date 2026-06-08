<script lang="ts">
	import { grantApiConsent, denyApiConsent } from '$lib/stores/api-consent.svelte';

	interface Props {
		visible: boolean;
		onConsent: () => void;
		onDeny: () => void;
	}

	let { visible, onConsent, onDeny }: Props = $props();

	function handleGrant() {
		grantApiConsent();
		onConsent();
	}

	function handleDeny() {
		denyApiConsent();
		onDeny();
	}
</script>

{#if visible}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		onclick={handleDeny}
		aria-label="Sluit consent modal"
	></button>

	<!-- Modal panel -->
	<div
		class="fixed inset-x-4 bottom-4 top-auto z-50 mx-auto max-w-lg glass-strong rounded-2xl p-5 animate-slide-up sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
		role="dialog"
		aria-modal="true"
		aria-labelledby="api-consent-title"
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
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
					/>
				</svg>
			</div>
			<div>
				<h2 id="api-consent-title" class="text-lg font-semibold text-white">
					Verwerking via internet
				</h2>
				<p class="text-xs text-white/50">AVG art. 6/7 — expliciete toestemming</p>
			</div>
		</div>

		<!-- Explanation -->
		<p class="mb-4 text-sm leading-relaxed text-white/70">
			In API-modus wordt je audio en tekst verwerkt door externe diensten op EU-servers:
		</p>

		<ul class="mb-4 space-y-2 text-sm text-white/60">
			<li class="flex items-start gap-2">
				<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
				<span
					><span class="font-medium text-white/80">Audio</span> naar AssemblyAI (datacenter Dublin, Ierland)</span
				>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
				<span
					><span class="font-medium text-white/80">Tekst</span> naar Mistral AI (EU-servers, Parijs)</span
				>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
				<span
					>PII-redactie actief — namen, nummers en medische gegevens worden automatisch verwijderd</span
				>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
				<span>Geen opslag van audio of tekst na verwerking</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
				<span>EU AI Act compliant (beperkt risico, transparantieverplichtingen)</span>
			</li>
		</ul>

		<a
			href="/privacy"
			target="_blank"
			class="mb-5 inline-flex items-center gap-1 text-xs text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
		>
			Lees de volledige privacyverklaring
			<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				/>
			</svg>
		</a>

		<!-- Buttons -->
		<div class="flex gap-3">
			<button
				onclick={handleGrant}
				class="flex-1 rounded-xl bg-linear-to-r from-neon to-accent-start px-4 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,255,0,0.2)] active:scale-[0.98]"
			>
				Akkoord
			</button>
			<button
				onclick={handleDeny}
				class="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white/90 active:scale-[0.98]"
			>
				Niet akkoord
			</button>
		</div>

		<!-- Info for denied state -->
		<p class="mt-3 text-center text-xs text-white/40">
			Zonder toestemming kun je de lokale modus gebruiken (desktop met Whisper + Ollama).
		</p>
	</div>
{/if}
