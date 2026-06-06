<script lang="ts">
	import { deleteAllLocalData, exportLocalData } from '$lib/utils/data-management';
	import { resetConsent } from '$lib/stores/consent.svelte';

	interface Props {
		open: boolean;
		onToggle: () => void;
	}

	let { open, onToggle }: Props = $props();

	const version = __APP_VERSION__;
	const buildDate = __APP_BUILD_DATE__;

	let confirmingDelete = $state(false);

	async function handleDelete() {
		await deleteAllLocalData();
		confirmingDelete = false;
		window.location.reload();
	}
</script>

<div class="mt-12 sm:mt-16 animate-fade-in">
	<button
		onclick={onToggle}
		aria-expanded={open}
		aria-label={open ? 'Privacy-informatie verbergen' : 'Privacy-informatie tonen'}
		class="glass w-full rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-left transition-all duration-300 hover:bg-white/8"
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 sm:gap-3">
				<div
					class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-linear-to-br from-neon/20 to-accent-start/20"
				>
					<svg
						class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				</div>
				<div class="flex flex-col sm:flex-row sm:items-center">
					<span class="text-xs sm:text-sm font-medium text-white/70"
						>Privacy-bewuste verwerking</span
					>
					<span
						class="sm:ml-2 text-[10px] text-white/50 uppercase tracking-tighter sm:normal-case sm:tracking-normal"
						>AVG & EU Act compliant</span
					>
				</div>
			</div>
			<svg
				class="h-4 w-4 text-white/50 transition-transform duration-300 {open ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</button>

	<div class="privacy-content {open ? 'open' : ''}">
		<div>
			<div class="glass-strong mt-2 rounded-2xl p-6 text-sm text-white/50">
				<p class="mb-4 text-white/60">
					Spraakherkenning gebeurt via Whisper (lokaal) of AssemblyAI (EU-datacenter Dublin,
					Ierland). Tekstcorrectie verloopt via Ollama/Gemma (lokaal) of Mistral AI (Europese
					servers). Je kiest zelf per stap of verwerking lokaal of via API plaatsvindt. AssemblyAI
					is SOC 2 Type 2 gecertificeerd met EU Data Residency. Mistral AI verwerkt uitsluitend op
					EU-servers.
				</p>
				<div class="grid gap-6 md:grid-cols-2">
					<div>
						<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
							AVG / GDPR
						</h4>
						<ul class="space-y-1.5 text-white/40">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Geen persoonsgegevens worden opgeslagen of verwerkt
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Audio wordt direct na transcriptie verwijderd
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Geen gebruikersprofielen of tracking
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Lokale modus: geen gegevensoverdracht. API-modus: audio naar AssemblyAI (Dublin), tekst
								naar Mistral (EU)
							</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
							EU AI Act
						</h4>
						<ul class="space-y-1.5 text-white/40">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Classificatie: minimaal risico (geen verboden toepassing)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Transparantie: AI-gegenereerde output is duidelijk gelabeld
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Modellen: Whisper + Ollama/Gemma (lokaal), AssemblyAI + Mistral (EU-servers, SOC 2)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Menselijke controle: gebruiker beoordeelt alle output
							</li>
						</ul>
					</div>
				</div>
				<div class="mt-4 border-t border-white/10 pt-4">
					<a
						href="/privacy"
						class="text-xs text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
					>
						Lees de volledige privacyverklaring &rarr;
					</a>
				</div>

				<!-- Data management (AVG rechten) -->
				<div class="mt-4 border-t border-white/10 pt-4">
					<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Jouw data</p>
					<div class="flex flex-wrap gap-2">
						<button
							onclick={() => exportLocalData()}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
						>
							Exporteer mijn data
						</button>
						{#if confirmingDelete}
							<div class="flex items-center gap-2">
								<span class="text-xs text-red-400">Weet je het zeker?</span>
								<button
									onclick={handleDelete}
									class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
								>
									Ja, wis alles
								</button>
								<button
									onclick={() => (confirmingDelete = false)}
									class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10"
								>
									Annuleren
								</button>
							</div>
						{:else}
							<button
								onclick={() => (confirmingDelete = true)}
								class="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
							>
								Wis mijn data
							</button>
						{/if}
						<button
							onclick={() => resetConsent()}
							class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
						>
							Cookie-instellingen
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-4 flex flex-col items-center gap-1">
		<div class="flex items-center gap-2 text-[10px] text-white/30">
			<a href="/privacy" class="hover:text-white/50 transition-colors">Privacy</a>
			<span class="text-white/15">|</span>
			<a href="/cookies" class="hover:text-white/50 transition-colors">Cookies</a>
			<span class="text-white/15">|</span>
			<a href="/voorwaarden" class="hover:text-white/50 transition-colors">Voorwaarden</a>
		</div>
		<p class="text-[10px] text-white/30">v{version} — {buildDate}</p>
	</div>
</div>
