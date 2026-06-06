<svelte:head>
	<title>Gebruiksvoorwaarden — BABL</title>
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
			<h1 class="text-2xl font-semibold text-white">Gebruiksvoorwaarden</h1>
			<p class="mt-2 text-sm text-white/55">Laatste update: juni 2025</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- 1. Toepasselijkheid -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">1. Toepasselijkheid</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Deze gebruiksvoorwaarden zijn van toepassing op het gebruik van BABL, een
					spraak-naar-tekst tool met Limburgs dialect polijsten. Door BABL te gebruiken ga je
					akkoord met deze voorwaarden. Als je niet akkoord gaat, gebruik BABL dan niet.
				</p>
			</section>

			<!-- 2. Beschrijving van de dienst -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">2. Beschrijving van de dienst</h2>
				<p class="text-sm leading-relaxed text-white/70">
					BABL neemt audio op via je microfoon of bestandsupload, transcribeert de spraak naar tekst
					en polijst Limburgs dialect naar standaard Nederlands. Verwerking kan lokaal (op je eigen
					apparaat) of via API-diensten (AssemblyAI en Mistral AI, beide op EU-servers)
					plaatsvinden. Je kiest zelf per stap welke verwerkingsmodus je gebruikt.
				</p>
			</section>

			<!-- 3. AI-gegenereerde output -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">3. AI-gegenereerde output</h2>
				<div
					class="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-white/70"
				>
					<p class="mb-2 font-medium text-amber-400/80">Belangrijke disclaimer</p>
					<p>
						BABL maakt gebruik van kunstmatige intelligentie (AI) voor spraakherkenning en het
						polijsten van tekst. AI-output kan fouten bevatten. De gegenereerde tekst is een
						hulpmiddel en geen vervanging voor menselijke controle.
					</p>
				</div>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						Je bent zelf verantwoordelijk voor het controleren en valideren van alle AI-gegenereerde output
						voordat je deze gebruikt.
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						BABL garandeert niet dat transcripties of gepolijste teksten foutloos zijn.
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						Gebruik BABL-output niet voor medische, juridische of andere kritische doeleinden zonder onafhankelijke
						verificatie.
					</li>
				</ul>
			</section>

			<!-- 4. Aansprakelijkheid -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">4. Aansprakelijkheid</h2>
				<p class="text-sm leading-relaxed text-white/70">
					BABL wordt aangeboden "as is" zonder enige garantie. Wij zijn niet aansprakelijk voor
					schade die voortvloeit uit het gebruik van BABL, waaronder maar niet beperkt tot:
				</p>
				<ul class="mt-3 space-y-1.5 text-sm text-white/60">
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30"></span>
						Onjuiste of onvolledige transcripties of gepolijste teksten
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30"></span>
						Verlies van data of audio-opnames
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30"></span>
						Onderbrekingen of onbeschikbaarheid van de dienst
					</li>
				</ul>
			</section>

			<!-- 5. Intellectueel eigendom -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">5. Intellectueel eigendom</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Je behoudt alle rechten op je eigen audio-opnames en de daaruit gegenereerde tekst. BABL
					claimt geen eigendom over je content. De BABL-software, het ontwerp en de broncode zijn
					eigendom van de ontwikkelaar(s).
				</p>
			</section>

			<!-- 6. Privacy -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">6. Privacy</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Het gebruik van BABL is onderworpen aan onze
					<a
						href="/privacy"
						class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
					>
						privacyverklaring
					</a>
					en ons
					<a
						href="/cookies"
						class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
					>
						cookiebeleid
					</a>.
				</p>
			</section>

			<!-- 7. Wijzigingen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">7. Wijzigingen</h2>
				<p class="text-sm leading-relaxed text-white/70">
					We kunnen deze voorwaarden van tijd tot tijd bijwerken. De datum bovenaan deze pagina
					geeft aan wanneer de laatste wijziging is doorgevoerd. Door BABL te blijven gebruiken na
					een wijziging, ga je akkoord met de bijgewerkte voorwaarden.
				</p>
			</section>

			<!-- 8. Contact -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">8. Contact</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Heb je vragen over deze voorwaarden? Neem contact met ons op:
				</p>
				<div class="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
					<p>
						<span class="text-white/55">[NAAM ORGANISATIE]</span><br />
						<span class="text-white/55">[ADRES]</span><br />
						Contact: <span class="text-white/55">[CONTACT EMAIL]</span>
					</p>
				</div>
			</section>
		</div>

		<footer class="mt-10 text-center animate-fade-in">
			<div class="flex items-center justify-center gap-4 text-sm text-white/50">
				<a href="/" class="inline-flex items-center gap-2 hover:text-white/70 transition-colors">
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Terug naar BABL
				</a>
				<span class="text-white/10">|</span>
				<a href="/privacy" class="hover:text-white/70 transition-colors"> Privacy </a>
				<span class="text-white/10">|</span>
				<a href="/cookies" class="hover:text-white/70 transition-colors"> Cookies </a>
				<span class="text-white/10">|</span>
				<a href="/verwerkingsovereenkomst" class="hover:text-white/70 transition-colors">
					Verwerkingsovereenkomst
				</a>
				<span class="text-white/10">|</span>
				<a href="/about" class="hover:text-white/70 transition-colors"> Over BABL </a>
			</div>
		</footer>
	</div>
</div>
