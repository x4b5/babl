<svelte:head>
	<title>Over BABL — Privacy, technologie & transparantie</title>
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
			<h1 class="text-2xl font-semibold text-white/90">Over BABL</h1>
			<p class="mt-2 text-sm text-white/40">Privacy, technologie & transparantie</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- 1. Wat is BABL? -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Wat is BABL?</h2>
				<p class="text-sm leading-relaxed text-white/60">
					BABL draait om één woord: <span class="text-white/80 font-medium">lokaal</span>. Lokaal,
					omdat je spraak zo veel mogelijk op je eigen apparaat wordt verwerkt — zonder dat je data
					de deur uit gaat. En lokaal, omdat BABL is gebouwd voor de lokale taal: het Limburgs.
				</p>
				<p class="mt-3 text-sm leading-relaxed text-white/60">
					Spreek in dialect, en BABL zet het om naar leesbaar Nederlands. Of het nu een interview
					is, een vergadering, een persoonlijke notitie of een verslag — jij praat zoals je praat,
					BABL doet de rest.
				</p>
				<p class="mt-3 text-sm leading-relaxed text-white/60">
					Gemaakt voor iedereen die in het Limburgs spreekt maar in het Nederlands wil schrijven:
					journalisten, studenten, onderzoekers, mantelzorgers, of gewoon iemand die een gesproken
					notitie wil omzetten naar tekst.
				</p>
			</section>

			<!-- 2. Hoe werkt het? -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Hoe werkt het?</h2>
				<p class="mb-4 text-sm text-white/60">
					Het proces bestaat uit twee stappen. Je kunt voor elke stap apart kiezen of die op je
					eigen computer draait of via een online dienst.
				</p>
				<div class="space-y-3">
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							1
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Spraakherkenning</p>
							<p class="text-xs text-white/50">
								Je spreekt in de microfoon of uploadt een audiobestand. BABL zet de spraak om naar
								tekst — inclusief dialectwoorden, precies zoals je ze uitspreekt.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							2
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Dialectcorrectie</p>
							<p class="text-xs text-white/50">
								De ruwe transcriptie wordt vervolgens gecorrigeerd: Limburgse woorden en zinsbouw
								worden omgezet naar standaard Nederlands. Je ziet beide versies en kunt het
								resultaat bewerken.
							</p>
						</div>
					</div>
				</div>

				<div class="mt-4 border-t border-white/10 pt-4">
					<h3 class="mb-2 text-sm font-medium text-white/70">Waarom werkt dit voor Limburgs?</h3>
					<p class="text-xs leading-relaxed text-white/50">
						Whisper is getraind op miljoenen uren spraak in meer dan 90 talen, maar kent het
						Limburgs niet als aparte taal. BABL lost dit slim op: Whisper staat ingesteld op
						Nederlands, zodat het Limburgse spraak direct probeert om te zetten naar Nederlandse
						woorden. Iemand zegt "naor de merret" en Whisper schrijft "naar de markt". Daarnaast
						krijgt Whisper voorbeeldzinnen in dialect mee en een lijst van honderden Limburgse
						woorden, zodat het de dialectuitspraak beter herkent en naar het juiste Nederlandse
						woord kan mappen.
					</p>
					<p class="mt-2 text-xs leading-relaxed text-white/50">
						Het resultaat is een ruwe transcriptie die al grotendeels in het Nederlands staat — maar
						nog niet perfect is. Gesproken taal bevat herhalingen, halve zinnen en soms woorden die
						Whisper verkeerd verstaat. Daarom volgt een tweede stap: een taalmodel (Gemma of
						Mistral) leest de ruwe tekst en maakt er vloeiend, correct Nederlands van. Het
						verwijdert herhalingen, herstelt zinsbouw en corrigeert eventuele fouten — zodat je een
						leesbaar verslag overhoudt van wat er gezegd is.
					</p>
				</div>
			</section>

			<!-- 3. Lokaal vs API -->
			<section id="voor-en-nadelen" class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">
					Op dit apparaat (<img
						src="/openai.png"
						alt=""
						class="inline h-4 w-4 -mt-0.5 rounded-full"
					/>
					Whisper) vs via internet (<img
						src="/assemblyai.png"
						alt=""
						class="inline h-4 w-4 -mt-0.5"
					/> AssemblyAI)
				</h2>
				<p class="mb-4 text-sm text-white/60">
					Het bijzondere aan BABL is dat je per stap zelf kiest hoe de verwerking gebeurt. Twee
					opties, elk met eigen voor- en nadelen:
				</p>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Op dit apparaat</h3>
						<p class="mb-3 text-xs text-white/50">
							Alles gebeurt op je eigen computer, niets verlaat je huis.
						</p>
						<div class="mb-3 space-y-1.5 text-xs">
							<p class="font-medium text-neon/70">Voordelen</p>
							<ul class="space-y-1 text-white/50">
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Maximale privacy — geen data naar buiten
								</li>
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Geen kosten per gebruik
								</li>
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Werkt zonder internet
								</li>
							</ul>
						</div>
						<div class="mb-3 space-y-1.5 text-xs">
							<p class="font-medium text-amber-400/70">Nadelen</p>
							<ul class="space-y-1 text-white/50">
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Langzamer (afhankelijk van je hardware)
								</li>
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Vereist installatie (Whisper + Ollama)
								</li>
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Vereist minimaal 8 GB werkgeheugen
								</li>
							</ul>
						</div>
						<div class="space-y-1.5 text-xs border-t border-white/10 pt-3">
							<p class="font-medium text-white/50">AVG & AI Act</p>
							<ul class="space-y-1 text-white/40">
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
									Geen derden betrokken, geen verwerkersovereenkomst nodig
								</li>
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
									Geen extra AI Act-verplichtingen
								</li>
							</ul>
						</div>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">Via internet</h3>
						<p class="mb-3 text-xs text-white/50">
							Verwerking door externe servers, maar uitsluitend binnen de EU.
						</p>
						<div class="mb-3 space-y-1.5 text-xs">
							<p class="font-medium text-neon/70">Voordelen</p>
							<ul class="space-y-1 text-white/50">
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Sneller en nauwkeuriger
								</li>
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Geen installatie nodig, werkt direct
								</li>
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Werkt op elk apparaat
								</li>
								<li class="flex items-start gap-2">
									<span class="text-neon/60">+</span> Ingebouwde PII-redactie: namen, telefoonnummers
									en medische gegevens worden automatisch verwijderd uit de transcriptie
								</li>
							</ul>
						</div>
						<div class="mb-3 space-y-1.5 text-xs">
							<p class="font-medium text-amber-400/70">Nadelen</p>
							<ul class="space-y-1 text-white/50">
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Kost geld per gebruik
								</li>
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Audio/tekst wordt naar EU-servers gestuurd
								</li>
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Vereist internetverbinding
								</li>
							</ul>
						</div>
						<div class="space-y-1.5 text-xs border-t border-white/10 pt-3">
							<p class="font-medium text-white/50">AVG & AI Act</p>
							<ul class="space-y-1 text-white/40">
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
									Verwerkers in EU: AssemblyAI (Dublin), Mistral (Parijs)
								</li>
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
									Verwerkersovereenkomsten van toepassing
								</li>
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
									AI Act: AI-gegenereerde output, transparantie gewaarborgd
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<!-- 4. BABL in gesprekken -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">BABL gebruiken in gesprekken</h2>
				<p class="mb-4 text-sm text-white/60">
					Wil je BABL inzetten tijdens een gesprek met iemand anders? Dan neem je ook de stem van je
					gesprekspartner op. Dat is persoonsdata — daar horen spelregels bij.
				</p>
				<div class="space-y-3">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Wat moet je doen?</h3>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								<span
									><span class="text-white/80">Toestemming vragen</span> — vooraf, expliciet. De ander
									moet vrijwillig "ja" kunnen zeggen.</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								<span
									><span class="text-white/80">Uitleggen waarvoor</span> — vertel dat je het gesprek opneemt
									om er een verslag van te maken.</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								<span
									><span class="text-white/80">Verwerking benoemen</span> — lokaal (niets verlaat je computer)
									of via EU-servers (audio wordt na verwerking verwijderd).</span
								>
							</li>
						</ul>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<p class="mb-2 text-sm font-medium text-white/70">Voorbeeldzin</p>
						<p class="text-sm italic text-white/50">
							"Ik wil dit gesprek opnemen om er een verslag van te maken. Ik gebruik daarvoor een
							tool die de spraak omzet naar tekst. Alles blijft op mijn laptop / de audio wordt via
							beveiligde EU-servers verwerkt en daarna verwijderd. Vind je dat goed?"
						</p>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">Zakelijk gebruik</h3>
						<p class="mb-3 text-sm text-white/60">
							Gebruik je BABL voor werk (journalistiek, zorg, onderzoek, vergaderingen)? Dan ben jij
							<span class="text-white/80">verwerkingsverantwoordelijke</span> onder de AVG. Dat betekent:
						</p>
						<ul class="space-y-1.5 text-sm text-white/60">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								<span
									><span class="text-white/80">Aantoonbare toestemming</span> — mondeling kan, maar schriftelijk
									is sterker (bijv. een e-mail of formulier vooraf)</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								<span
									><span class="text-white/80">Informatieplicht</span> — wijs je gesprekspartner op hun
									AVG-rechten (inzage, rectificatie, verwijdering)</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								<span
									><span class="text-white/80">Verwerkingsregister</span> — houd bij welke verwerkingen
									je uitvoert, met welk doel en welke rechtsgrond</span
								>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								<span
									><span class="text-white/80">API-modus = sub-verwerkers</span> — dan gelden de
									verwerkingsovereenkomsten met AssemblyAI (Dublin) en Mistral (Parijs). Zie onze
									<a
										href="/verwerkingsovereenkomst"
										class="text-indigo-400/70 underline decoration-indigo-400/30 underline-offset-2 hover:text-indigo-400 transition-colors"
									>
										verwerkingsovereenkomst
									</a></span
								>
							</li>
						</ul>
						<p class="mt-3 text-xs text-white/40">
							Tip: kies lokale modus om verwerking door derden te vermijden. Laat je aanpak bij
							twijfel toetsen door een privacy-specialist.
						</p>
					</div>
				</div>
			</section>

			<!-- 5. Privacy-bewuste verwerking -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Privacy-bewuste verwerking</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL is ontworpen met privacy als uitgangspunt. Hieronder lees je hoe BABL voldoet aan de
					AVG (GDPR) en de EU AI Act.
				</p>
				<div class="grid gap-6 md:grid-cols-2">
					<div>
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
							AVG / GDPR
						</h3>
						<ul class="space-y-1.5 text-xs text-white/40">
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
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-neon/80">
							EU AI Act
						</h3>
						<ul class="space-y-1.5 text-xs text-white/40">
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
								Modellen: Whisper + Ollama/Gemma (lokaal), AssemblyAI + Mistral (EU-servers)
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
			</section>

			<!-- 5. Technologie onder de motorkap -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Technologie onder de motorkap</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL combineert verschillende AI-modellen. Hier een kort overzicht voor wie meer wil
					weten:
				</p>
				<div class="space-y-3">
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70 flex items-center gap-1.5">
							<img src="/openai.png" alt="" class="h-4 w-4 rounded-full" />
							<a
								href="https://github.com/openai/whisper"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/50 transition-colors"
								>Whisper</a
							>
						</h3>
						<p class="mt-1 text-xs text-white/40">
							Open-source spraakherkenningsmodel ontwikkeld door OpenAI. Ondersteunt meer dan 90
							talen en dialecten. Wordt bij lokale modus direct op je eigen computer gedraaid.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70 flex items-center gap-1.5">
							<img src="/ollama.png" alt="" class="h-4 w-4" />
							<a
								href="https://ollama.com"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/50 transition-colors"
								>Ollama</a
							> / Gemma
						</h3>
						<p class="mt-1 text-xs text-white/40">
							Open-source taalmodel dat lokaal draait via Ollama (een tool die AI-modellen op je
							eigen computer laat draaien). Gemma is een compact maar krachtig model van Google,
							geschikt voor tekstcorrectie.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70 flex items-center gap-1.5">
							<img src="/assemblyai.png" alt="" class="h-4 w-4" />
							<a
								href="https://www.assemblyai.com"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/50 transition-colors"
								>AssemblyAI</a
							>
						</h3>
						<p class="mt-1 text-xs text-white/40">
							Professionele spraakherkenningsdienst met SOC 2 Type 2 certificering — dat betekent
							dat een onafhankelijke auditor heeft gecontroleerd dat AssemblyAI je data veilig
							verwerkt en opslaat. Datacenter in Dublin, Ierland (EU Data Residency). PII-redactie
							is standaard ingeschakeld: persoonsnamen, telefoonnummers, e-mailadressen,
							geboortedatums en medische gegevens worden automatisch uit de transcriptie verwijderd.
							Wordt gebruikt in API-modus voor transcriptie.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70 flex items-center gap-1.5">
							<img src="/mistral.png" alt="" class="h-4 w-4" />
							<a
								href="https://mistral.ai"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/50 transition-colors"
								>Mistral AI</a
							>
						</h3>
						<p class="mt-1 text-xs text-white/40">
							Europees AI-bedrijf gevestigd in Parijs. Alle servers staan in de EU. Wordt gebruikt
							in API-modus voor dialectcorrectie.
						</p>
					</div>
				</div>
			</section>

			<!-- 6. Open source & contact -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Open source & contact</h2>
				<p class="text-sm leading-relaxed text-white/60">
					BABL is een experimenteel project. Heb je vragen, suggesties of wil je bijdragen? Neem
					contact op:
				</p>
				<div class="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
					<p>
						<span class="text-white/40">[CONTACT EMAIL]</span>
					</p>
				</div>
			</section>
		</div>

		<footer class="mt-10 text-center animate-fade-in">
			<div class="flex items-center justify-center gap-4 text-sm text-white/30">
				<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
				<span class="text-white/10">|</span>
				<a href="/cookies" class="hover:text-white/60 transition-colors">Cookies</a>
				<span class="text-white/10">|</span>
				<a href="/voorwaarden" class="hover:text-white/60 transition-colors">Voorwaarden</a>
			</div>
		</footer>
	</div>
</div>
