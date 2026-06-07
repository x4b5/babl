<svelte:head>
	<title>Veelgestelde vragen — BABL</title>
</svelte:head>

<a
	href="/"
	class="fixed top-6 right-6 z-50 glass rounded-full px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-2"
>
	<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
		<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
	</svg>
	Terug
</a>

<div class="bg-dark-gradient relative min-h-screen overflow-hidden">
	<div class="floating-orb orb-violet"></div>
	<div class="floating-orb orb-indigo"></div>
	<div class="floating-orb orb-cyan"></div>

	<div class="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
		<header class="mb-10 text-center animate-fade-in">
			<a
				href="/"
				class="gradient-text mb-3 inline-block text-5xl font-normal tracking-tighter select-none hover:opacity-80 transition-opacity"
			>
				BABL
			</a>
			<h1 class="text-2xl font-semibold text-white/90">Veelgestelde vragen</h1>
			<p class="mt-2 text-sm text-white/40">Antwoorden op de meest voorkomende vragen over BABL</p>
		</header>

		<div class="space-y-4 animate-fade-in">
			<!-- 1. Microfoon -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Waarom werkt mijn microfoon niet?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>BABL vraagt toestemming om je microfoon te gebruiken. Als dat niet lukt:</p>
					<ul class="mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							Controleer of je browser toegang heeft tot de microfoon (klik op het slotje naast de adresbalk).
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							Gebruik je een headset of externe microfoon? Controleer of die als invoerbron is geselecteerd
							in je systeeminstellingen.
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							Sommige browsers (vooral Safari) blokkeren microfoon-toegang als de pagina niet via HTTPS
							geladen is.
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							Probeer de pagina te herladen en klik "Toestaan" wanneer de browser om toestemming vraagt.
						</li>
					</ul>
				</div>
			</details>

			<!-- 2. Wat gebeurt er na verwerking? -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Wat gebeurt er met mijn opname na verwerking?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>
						Niets — je opname wordt nergens bewaard. Audio en tekst bestaan alleen in je
						browsersessie. Sluit je de tab, dan is alles definitief weg.
					</p>
					<ul class="mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-neon/70">Lokale modus:</span> audio verlaat je computer niet. Alles
								wordt verwerkt door programma's op jouw machine.
							</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-indigo-400/70">API-modus:</span> audio wordt naar EU-servers gestuurd
								en direct na verwerking verwijderd door de aanbieder.
							</span>
						</li>
					</ul>
					<p class="mt-2">
						Meer hierover op de
						<a
							href="/about#waar-blijft-je-data"
							class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
						>
							Over BABL-pagina</a
						>.
					</p>
				</div>
			</details>

			<!-- 3. Telefoon -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Werkt BABL op mijn telefoon?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>Dat hangt af van de modus:</p>
					<ul class="mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-indigo-400/70">API-modus:</span> ja, werkt op elk apparaat met een moderne
								browser (telefoon, tablet, laptop).
							</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-neon/70">Lokale modus:</span> nee, dit vereist dat Whisper en Ollama
								op je computer draaien. Dat werkt alleen op een laptop of desktop met minimaal 8 GB werkgeheugen.
							</span>
						</li>
					</ul>
				</div>
			</details>

			<!-- 4. Limburgs dialect -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Hoe goed herkent BABL Limburgs dialect?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>
						BABL is experimenteel. Whisper kent het Limburgs niet als aparte taal, maar staat
						ingesteld op Nederlands met dialecthints en een woordenlijst van honderden Limburgse
						woorden. Het resultaat:
					</p>
					<ul class="mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							Duidelijk gesproken dialect wordt goed herkend en omgezet naar Nederlands.
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400/50"></span>
							Bij sterk accent, snel spreken of achtergrondlawaai worden meer fouten gemaakt.
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400/50"></span>
							Korte opnames (&lt;5 seconden) geven onbetrouwbare resultaten.
						</li>
					</ul>
					<p class="mt-2">
						Controleer het resultaat altijd. BABL is geen vervanging voor professionele
						transcriptie.
					</p>
				</div>
			</details>

			<!-- 5. Data verwijderen -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Hoe verwijder ik mijn data?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>
						Dat hoeft niet — er is niets om te verwijderen. BABL slaat geen data op. Je audio en
						tekst bestaan alleen in je browsersessie (tijdelijk geheugen). Sluit je de tab, dan is
						alles automatisch weg.
					</p>
					<p class="mt-2">
						Er is geen account, geen cloud-opslag, geen manier om iets terug te halen. Dat is bewust
						zo ontworpen.
					</p>
				</div>
			</details>

			<!-- 6. Kosten -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Wat kost het gebruik?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<ul class="space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-neon/70">Lokale modus:</span> gratis. Whisper en Ollama draaien op je
								eigen computer, zonder abonnement of betaling.
							</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-indigo-400/70">API-modus:</span> kost geld per gebruik. AssemblyAI (transcriptie)
								en Mistral (polijsten) rekenen per verwerkte audio/tekst. Je hebt je eigen API-sleutels
								nodig.
							</span>
						</li>
					</ul>
					<p class="mt-2">
						Zie de
						<a
							href="/about#voor-en-nadelen"
							class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
						>
							vergelijking lokaal vs API</a
						>
						voor een volledig overzicht.
					</p>
				</div>
			</details>

			<!-- 7. Vertrouwelijke gesprekken -->
			<details class="glass-strong rounded-2xl group">
				<summary
					class="flex cursor-pointer items-center justify-between p-6 text-sm font-medium text-white/90"
				>
					Kan ik BABL gebruiken voor vertrouwelijke gesprekken?
					<svg
						class="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</summary>
				<div class="px-6 pb-6 text-xs leading-relaxed text-white/50">
					<p>Ja, mits je de juiste modus kiest:</p>
					<ul class="mt-2 space-y-1.5">
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-neon/70">Lokale modus:</span> maximale vertrouwelijkheid. Audio verlaat
								je computer niet, er zijn geen derden betrokken.
							</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
							<span>
								<span class="text-indigo-400/70">API-modus:</span> audio gaat naar EU-servers (AssemblyAI
								Dublin, Mistral Parijs). Er gelden verwerkingsovereenkomsten en de data wordt direct na
								verwerking verwijderd. Geschikt voor de meeste situaties, maar bij zeer gevoelige data
								(medisch, juridisch) is lokaal veiliger.
							</span>
						</li>
					</ul>
					<p class="mt-2">
						Neem je iemand anders op? Vraag dan altijd vooraf toestemming. Meer hierover op de
						<a
							href="/about"
							class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
						>
							Over BABL-pagina</a
						>.
					</p>
				</div>
			</details>
		</div>

		<footer class="mt-10 text-center animate-fade-in">
			<div class="flex items-center justify-center gap-4 text-sm text-white/30">
				<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
				<span class="text-white/10">|</span>
				<a href="/cookies" class="hover:text-white/60 transition-colors">Cookies</a>
				<span class="text-white/10">|</span>
				<a href="/voorwaarden" class="hover:text-white/60 transition-colors">Voorwaarden</a>
				<span class="text-white/10">|</span>
				<a href="/begrippen" class="hover:text-white/60 transition-colors">Begrippen</a>
				<span class="text-white/10">|</span>
				<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
			</div>
		</footer>
	</div>
</div>
