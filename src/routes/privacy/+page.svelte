<svelte:head>
	<title>Privacyverklaring — BABL</title>
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
			<h1 class="text-2xl font-semibold text-white">Privacyverklaring</h1>
			<p class="mt-2 text-sm text-white/55">Laatste update: juni 2026</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- 1. Inleiding -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">1. Inleiding</h2>
				<p class="text-sm leading-relaxed text-white/70">
					BABL is een spraak-naar-tekst tool die audio opneemt, transcribeert en Limburgs dialect
					corrigeert naar standaard Nederlands. Deze privacyverklaring beschrijft welke gegevens we
					verwerken, hoe we dat doen en welke rechten je hebt.
				</p>
				<div class="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-white/60">
					<p class="mb-1 font-medium text-neon/80">Verwerkingsverantwoordelijke</p>
					<p>
						<span class="text-white/55">[NAAM ORGANISATIE]</span><br />
						<span class="text-white/55">[ADRES]</span><br />
						Contact:
						<span class="text-white/55">[CONTACT EMAIL]</span>
					</p>
				</div>
			</section>

			<!-- 2. Welke gegevens verwerken we -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">2. Welke gegevens verwerken we</h2>
				<ul class="space-y-3 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Audio-opnames</span> — Tijdelijk vastgelegd in de
							browser tijdens opname. Worden direct na transcriptie verwijderd.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Getranscribeerde tekst</span> — Bestaat alleen in
							je browser-sessie. Wordt niet opgeslagen op een server.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Lokale opslag (IndexedDB)</span> — Maximaal 3 recente
							opnames worden lokaal bewaard zodat je bij een fout de transcriptie opnieuw kunt proberen.
							Deze data verlaat nooit je browser.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Sessiecookie</span>
							(<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">babl_session</code>) — Alleen
							voor authenticatie. Bevat geen persoonsgegevens.
						</div>
					</li>
				</ul>
			</section>

			<!-- 3. Hoe verwerken we gegevens -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">
					3. Hoe verwerken we gegevens — twee modi
				</h2>
				<p class="mb-4 text-sm text-white/70">
					Je kiest zelf per stap (transcriptie en correctie) of verwerking lokaal of via API
					plaatsvindt.
				</p>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Lokale modus</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li>Whisper (spraakherkenning) draait op je eigen apparaat</li>
							<li>Ollama/Gemma (tekstcorrectie) draait op je eigen apparaat</li>
							<li class="font-medium text-neon/60">Geen data verlaat je computer</li>
						</ul>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">API modus</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li>Audio wordt verwerkt door AssemblyAI (datacenter Dublin, Ierland)</li>
							<li>Tekst wordt verwerkt door Mistral AI (EU-servers)</li>
							<li class="font-medium text-indigo-400/60">Uitsluitend EU-servers</li>
							<li>
								<span class="font-medium text-white/70">PII-redactie</span> — AssemblyAI verwijdert
								automatisch persoonsnamen, telefoonnummers, e-mailadressen, geboortedatums en
								medische gegevens uit de transcriptie. Deze worden vervangen door labels zoals
								<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">[PERSON_NAME]</code>. Zo
								worden persoonsgegevens niet doorgestuurd naar de correctiestap (Mistral).
							</li>
						</ul>
					</div>
				</div>
			</section>

			<!-- 4. Analytics -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">4. Analytics</h2>
				<p class="mb-3 text-sm text-white/70">
					We gebruiken PostHog voor anonieme gebruiksstatistieken, gehost op het EU-endpoint (<code
						class="rounded bg-white/10 px-1.5 py-0.5 text-xs">eu.posthog.com</code
					>).
				</p>
				<ul class="space-y-1.5 text-sm text-white/60">
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						Geen IP-adressen worden opgeslagen
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						Geen gebruikersprofielen (<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs"
							>person_profiles: 'never'</code
						>)
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						Alleen: welke pagina bezocht, wanneer sessie verlaten
					</li>
				</ul>
			</section>

			<!-- 5. Cookies -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">5. Cookies</h2>
				<p class="mb-3 text-sm text-white/70">
					Lees ons volledige
					<a
						href="/cookies"
						class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
					>
						cookiebeleid
					</a>
					voor meer details.
				</p>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Cookie</th>
								<th class="pb-2 pr-4 font-medium">Doel</th>
								<th class="pb-2 font-medium">Duur</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4">
									<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">babl_session</code>
								</td>
								<td class="py-2 pr-4">Authenticatie</td>
								<td class="py-2">30 dagen</td>
							</tr>
							<tr>
								<td class="py-2 pr-4">
									<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">PostHog cookies</code>
								</td>
								<td class="py-2 pr-4">Anonieme analytics</td>
								<td class="py-2">1 jaar</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- 6. Derde partijen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">6. Derde partijen (sub-verwerkers)</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Partij</th>
								<th class="pb-2 pr-4 font-medium">Doel</th>
								<th class="pb-2 pr-4 font-medium">Locatie</th>
								<th class="pb-2 font-medium">Certificering</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">AssemblyAI</td>
								<td class="py-2 pr-4">Spraaktranscriptie + PII-redactie</td>
								<td class="py-2 pr-4">Dublin, Ierland</td>
								<td class="py-2">SOC 2 Type 2</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Mistral AI</td>
								<td class="py-2 pr-4">Tekstcorrectie</td>
								<td class="py-2 pr-4">EU-servers</td>
								<td class="py-2">—</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">PostHog</td>
								<td class="py-2 pr-4">Analytics</td>
								<td class="py-2 pr-4">EU</td>
								<td class="py-2">SOC 2 Type 2</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-white/70">Vercel</td>
								<td class="py-2 pr-4">Hosting</td>
								<td class="py-2 pr-4">Edge network (EU CDN)</td>
								<td class="py-2">SOC 2 Type 2</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-xs text-white/50">
					Derde partijen worden alleen ingeschakeld in API-modus. In lokale modus verlaat geen data
					je apparaat.
				</p>
			</section>

			<!-- 7. Bewaartermijnen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">7. Bewaartermijnen</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Audio</span> — Verwijderd direct na transcriptie
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">IndexedDB</span> — Maximaal 3 opnames, oudste worden
							automatisch opgeruimd
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Sessiecookie</span> — Verloopt na 30 dagen of bij
							uitloggen
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="font-medium text-white/80">Server logs</span> — Geen transcriptie-inhoud wordt
							gelogd
						</div>
					</li>
				</ul>
			</section>

			<!-- 8. Jouw rechten (AVG) -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">8. Jouw rechten (AVG / GDPR)</h2>
				<p class="mb-3 text-sm text-white/70">
					Op grond van de Algemene Verordening Gegevensbescherming (AVG) heb je de volgende rechten:
				</p>
				<ul class="space-y-1.5 text-sm text-white/60">
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span
							><span class="text-white/80">Inzage</span> — Opvragen welke gegevens we van je verwerken</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span
							><span class="text-white/80">Rectificatie</span> — Onjuiste gegevens laten corrigeren</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span
							><span class="text-white/80">Verwijdering</span> — Verzoeken om verwijdering van je gegevens</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span><span class="text-white/80">Bezwaar</span> — Bezwaar maken tegen verwerking</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span
							><span class="text-white/80">Overdraagbaarheid</span> — Gegevens in een standaardformaat
							ontvangen</span
						>
					</li>
				</ul>
				<div class="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-white/60">
					<p class="mb-1 font-medium text-neon/80">Zelf-service</p>
					<p>
						Je kunt je lokale data direct exporteren of verwijderen via de knoppen in de
						privacy-sectie onderaan de transcriptiepagina. Geen account of contactverzoek nodig.
					</p>
				</div>
				<div class="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
					<p>
						Neem contact op via <span class="text-white/55">[CONTACT EMAIL]</span> om je rechten uit te
						oefenen.
					</p>
					<p class="mt-2">
						Je hebt ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens:
						<a
							href="https://autoriteitpersoonsgegevens.nl"
							target="_blank"
							rel="noopener noreferrer"
							class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
						>
							autoriteitpersoonsgegevens.nl
						</a>
					</p>
				</div>
			</section>

			<!-- 9. EU AI Act transparantie -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">9. EU AI Act transparantie</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Risicoklasse</span> — Minimaal risico. BABL valt
							niet onder de categorie hoog-risico of verboden AI-toepassingen.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Gebruikte modellen</span> — Whisper large-v3 (spraakherkenning),
							Ollama/Gemma3 (lokale correctie), AssemblyAI Universal-2 (API transcriptie), Mistral (API
							correctie)
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Labeling</span> — Alle AI-gegenereerde output is
							duidelijk gelabeld als zodanig.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Menselijke controle</span> — De gebruiker beoordeelt
							en valideert alle AI-output voordat deze wordt gebruikt.
						</div>
					</li>
				</ul>
			</section>

			<!-- 10. Wijzigingen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">10. Wijzigingen</h2>
				<p class="text-sm text-white/70">
					We kunnen deze privacyverklaring van tijd tot tijd bijwerken. De datum bovenaan deze
					pagina geeft aan wanneer de laatste wijziging is doorgevoerd. Bij wezenlijke wijzigingen
					informeren we je via de applicatie.
				</p>
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
				<a href="/cookies" class="hover:text-white/70 transition-colors"> Cookiebeleid </a>
				<span class="text-white/10">|</span>
				<a href="/voorwaarden" class="hover:text-white/70 transition-colors"> Voorwaarden </a>
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
