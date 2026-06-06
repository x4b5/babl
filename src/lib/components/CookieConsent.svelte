<script lang="ts">
	import { grantConsent, denyConsent } from '$lib/stores/consent.svelte';

	function handleAccept() {
		grantConsent();
	}

	function handleReject() {
		denyConsent();
	}
</script>

<div
	class="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 animate-slide-up"
	role="dialog"
	aria-label="Cookie-instellingen"
>
	<div class="glass-strong mx-auto max-w-xl rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/30">
		<p class="mb-4 text-sm leading-relaxed text-white/60">
			BABL gebruikt analytische cookies (PostHog) om anonieme gebruiksstatistieken te verzamelen.
			Geen persoonsgegevens, geen IP-adressen.
			<a
				href="/cookies"
				class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
			>
				Meer info
			</a>
		</p>
		<div class="flex items-center gap-3">
			<button
				onclick={handleAccept}
				class="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
			>
				Accepteren
			</button>
			<button
				onclick={handleReject}
				class="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white/80 active:scale-[0.98]"
			>
				Weigeren
			</button>
		</div>
	</div>
</div>
