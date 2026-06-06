<svelte:head>
	<title>Verwerkingsovereenkomst — BABL</title>
</svelte:head>

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
			<h1 class="text-2xl font-semibold text-white">Verwerkingsovereenkomst</h1>
			<p class="mt-2 text-sm text-white/55">Laatste update: juni 2025</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- 1. Inleiding -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">
					1. Wat is een verwerkingsovereenkomst?
				</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Een verwerkingsovereenkomst (ook wel Data Processing Agreement of DPA) is een verplicht
					contract onder de AVG/GDPR tussen de verwerkingsverantwoordelijke (de organisatie die
					bepaalt waarom en hoe persoonsgegevens worden verwerkt) en de verwerker (de partij die
					namens de verantwoordelijke de data verwerkt).
				</p>
				<div class="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-white/60">
					<p class="mb-1 font-medium text-neon/80">Partijen</p>
					<p>
						<span class="text-white/80">Verwerkingsverantwoordelijke:</span>
						<span class="text-white/55">[NAAM ORGANISATIE]</span><br />
						<span class="text-white/80">Verwerker:</span>
						<span class="text-white/55">[NAAM VERWERKER / EXPLOITANT BABL]</span>
					</p>
				</div>
			</section>

			<!-- 2. Doel van de verwerking -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">2. Doel van de verwerking</h2>
				<p class="text-sm leading-relaxed text-white/70">
					BABL verwerkt persoonsgegevens uitsluitend voor het omzetten van gesproken taal
					(spraakopnames) naar geschreven tekst, met correctie van Limburgs dialect naar standaard
					Nederlands.
				</p>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Stap 1: Transcriptie</h3>
						<p class="text-sm text-white/60">Spraakopname omzetten naar ruwe tekst</p>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">Stap 2: Correctie</h3>
						<p class="text-sm text-white/60">
							Ruwe tekst corrigeren van dialect naar standaard Nederlands
						</p>
					</div>
				</div>
			</section>

			<!-- 3. Welke gegevens -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">3. Categorieën persoonsgegevens</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Categorie</th>
								<th class="pb-2 pr-4 font-medium">Beschrijving</th>
								<th class="pb-2 font-medium">Bewaartermijn</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Audio</td>
								<td class="py-2 pr-4">Opgenomen via microfoon of upload</td>
								<td class="py-2">Alleen tijdens verwerking</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Ruwe tekst</td>
								<td class="py-2 pr-4">Resultaat van spraak-naar-tekst</td>
								<td class="py-2">Sessieduur</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-white/70">Gecorrigeerde tekst</td>
								<td class="py-2 pr-4">Resultaat van dialectcorrectie</td>
								<td class="py-2">Sessieduur</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-xs text-white/50">
					Geen van deze gegevens wordt persistent opgeslagen op een server.
				</p>
			</section>

			<!-- 4. Verwerkingsmodi -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">4. Verwerkingsmodi en datalocatie</h2>
				<p class="mb-4 text-sm text-white/70">
					De gebruiker kiest zelf per stap welke modus wordt gebruikt.
				</p>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Lokale modus</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li>Whisper (transcriptie) op eigen apparaat</li>
							<li>Ollama/Gemma3 (correctie) op eigen apparaat</li>
							<li class="font-medium text-neon/60">Geen data verlaat je computer</li>
						</ul>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">API-modus</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li>AssemblyAI (datacenter Dublin, Ierland)</li>
							<li>Mistral AI (EU-servers, Parijs)</li>
							<li class="font-medium text-indigo-400/60">Uitsluitend EU-servers</li>
						</ul>
					</div>
				</div>
			</section>

			<!-- 5. Verplichtingen verwerker -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">5. Verplichtingen van de verwerker</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							Persoonsgegevens <span class="text-white/80">uitsluitend verwerken</span> op basis van instructies
							van de verantwoordelijke
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="text-white/80">Geen opslag</span> van persoonsgegevens na afloop van de sessie
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="text-white/80">Geheimhouding</span> voor alle personen met toegang tot persoonsgegevens
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="text-white/80">Geen gebruik</span> van persoonsgegevens voor eigen doeleinden
							of AI-training
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							Na beëindiging alle persoonsgegevens <span class="text-white/80"
								>wissen of retourneren</span
							>
						</div>
					</li>
				</ul>
			</section>

			<!-- 6. Subverwerkers -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">6. Subverwerkers (alleen API-modus)</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Partij</th>
								<th class="pb-2 pr-4 font-medium">Doel</th>
								<th class="pb-2 pr-4 font-medium">Locatie</th>
								<th class="pb-2 pr-4 font-medium">DPA</th>
								<th class="pb-2 font-medium">Training</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">AssemblyAI</td>
								<td class="py-2 pr-4">Spraaktranscriptie + PII-redactie</td>
								<td class="py-2 pr-4">Dublin, Ierland</td>
								<td class="py-2 pr-4">
									<a
										href="https://www.assemblyai.com/legal/data-processing-addendum"
										target="_blank"
										rel="noopener noreferrer"
										class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
									>
										Automatisch via ToS
									</a>
								</td>
								<td class="py-2">Nee</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-white/70">Mistral AI</td>
								<td class="py-2 pr-4">Dialectcorrectie</td>
								<td class="py-2 pr-4">Parijs, Frankrijk</td>
								<td class="py-2 pr-4">
									<a
										href="https://legal.mistral.ai/terms/data-processing-addendum"
										target="_blank"
										rel="noopener noreferrer"
										class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
									>
										Automatisch via ToS
									</a>
								</td>
								<td class="py-2">Nee (opt-in)</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-xs text-white/50">
					In lokale modus worden geen subverwerkers ingeschakeld. Alle data blijft op je apparaat.
				</p>
			</section>

			<!-- 7. Beveiliging -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">7. Beveiligingsmaatregelen</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
							Technisch
						</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Alle communicatie via HTTPS/TLS 1.2+
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Geen persistente opslag van audio of tekst
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Automatische PII-redactie in API-modus
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Transcriptie-inhoud wordt nooit gelogd
							</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
							Organisatorisch
						</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Toegang beperkt tot geautoriseerd personeel
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Geheimhoudingsverklaring voor medewerkers
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Incidentprocedure voor datalekken
							</li>
						</ul>
					</div>
				</div>
			</section>

			<!-- 8. Rechten betrokkenen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">8. Rechten van betrokkenen</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Recht</th>
								<th class="pb-2 pr-4 font-medium">Artikel AVG</th>
								<th class="pb-2 font-medium">Toelichting</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Inzage</td>
								<td class="py-2 pr-4">Art. 15</td>
								<td class="py-2">Opvragen welke gegevens verwerkt worden</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Rectificatie</td>
								<td class="py-2 pr-4">Art. 16</td>
								<td class="py-2">Onjuiste gegevens laten corrigeren</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Wissing</td>
								<td class="py-2 pr-4">Art. 17</td>
								<td class="py-2">Verwijdering verzoeken</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Beperking</td>
								<td class="py-2 pr-4">Art. 18</td>
								<td class="py-2">Verwerking laten beperken</td>
							</tr>
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4 font-medium text-white/70">Overdraagbaarheid</td>
								<td class="py-2 pr-4">Art. 20</td>
								<td class="py-2">Gegevens in machine-leesbaar formaat</td>
							</tr>
							<tr>
								<td class="py-2 pr-4 font-medium text-white/70">Bezwaar</td>
								<td class="py-2 pr-4">Art. 21</td>
								<td class="py-2">Bezwaar maken tegen verwerking</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-white/60">
					<p class="mb-1 font-medium text-neon/80">In de praktijk</p>
					<p>
						Omdat BABL geen persoonsgegevens persistent opslaat, zijn de meeste rechten automatisch
						geborgd: na de sessie is er niets meer om in te zien, te corrigeren of te verwijderen.
					</p>
				</div>
			</section>

			<!-- 9. Datalekken -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">9. Datalekprocedure</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						<div>
							Melding aan verantwoordelijke <span class="text-white/80">binnen 24 uur</span> na ontdekking
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						<div>Melding bevat: aard, categorieën betrokkenen, gevolgen en genomen maatregelen</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60"></span>
						<div>
							Verantwoordelijke meldt aan Autoriteit Persoonsgegevens
							<span class="text-white/80">binnen 72 uur</span> (art. 33 AVG)
						</div>
					</li>
				</ul>
			</section>

			<!-- 10. Geen doorgifte buiten EU -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">10. Geen doorgifte buiten de EU</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Persoonsgegevens worden niet doorgegeven buiten de Europese Economische Ruimte (EER). Alle
					subverwerkers verwerken data uitsluitend binnen de EU:
				</p>
				<ul class="mt-3 space-y-1.5 text-sm text-white/60">
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						AssemblyAI — Dublin, Ierland
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						Mistral AI — Parijs, Frankrijk
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						Lokale modus — apparaat van de gebruiker
					</li>
				</ul>
			</section>

			<!-- 11. EU AI Act -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">11. EU AI Act compliance</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Risicoklasse</span> — Beperkt risico (limited risk).
							Niet hoog-risico of verboden.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Transparantie</span> — Gebruikers worden geïnformeerd
							dat AI wordt ingezet. Modellen en herkomst worden vermeld.
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/60"></span>
						<div>
							<span class="font-medium text-white/80">Keuzevrijheid</span> — Gebruiker kiest tussen lokale
							en API-verwerking.
						</div>
					</li>
				</ul>
			</section>

			<!-- 12. Audits en duur -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">12. Audits, duur en beëindiging</h2>
				<ul class="space-y-2 text-sm text-white/70">
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							De verantwoordelijke mag <span class="text-white/80">audits</span> uitvoeren om naleving
							te controleren (aankondiging minimaal 14 dagen vooraf)
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							Bij beëindiging worden alle persoonsgegevens
							<span class="text-white/80">binnen 30 dagen gewist</span> of geretourneerd
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon/60"></span>
						<div>
							<span class="text-white/80">Nederlands recht</span> is van toepassing op deze overeenkomst
						</div>
					</li>
				</ul>
			</section>

			<!-- Volledige versie -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Volledige verwerkingsovereenkomst</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Dit is een samenvatting van de verwerkingsovereenkomst. De volledige juridische tekst met
					alle artikelen, definities en ondertekeningsvelden is beschikbaar als download.
				</p>
				<div class="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
					<p>
						Neem contact op via <span class="text-white/55">[CONTACT EMAIL]</span> voor de volledige verwerkingsovereenkomst
						of om een getekend exemplaar aan te vragen.
					</p>
				</div>
			</section>
		</div>

		<footer class="mt-10 text-center animate-fade-in">
			<div class="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
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
				<a href="/voorwaarden" class="hover:text-white/70 transition-colors"> Voorwaarden </a>
				<span class="text-white/10">|</span>
				<a href="/cookies" class="hover:text-white/70 transition-colors"> Cookies </a>
				<span class="text-white/10">|</span>
				<a href="/about" class="hover:text-white/70 transition-colors"> Over BABL </a>
			</div>
		</footer>
	</div>
</div>
