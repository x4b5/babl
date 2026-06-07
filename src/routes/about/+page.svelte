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
				<h2 class="mb-3 text-lg font-semibold text-white/90 flex items-center gap-2">
					<svg
						class="h-5 w-5 shrink-0 text-neon/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
					Wat is BABL?
				</h2>
				<p class="text-sm leading-relaxed text-white/60">
					BABL draait om één woord: <span class="text-white/80 font-medium">lokaal</span>. Lokaal,
					omdat je spraak zo veel mogelijk op je eigen apparaat wordt verwerkt — zonder dat je data
					de deur uit gaat. En lokaal, omdat BABL is gebouwd voor de lokale taal: het Limburgs.
				</p>
				<p class="mt-3 text-sm leading-relaxed text-white/60">
					Spreek in dialect, en BABL zet het om naar leesbaar Nederlands. Of het nu een interview
					is, een vergadering, een persoonlijke notitie of een verslag — jij praat zoals je praat,
					BABL probeert de rest te doen.
				</p>
				<p class="mt-3 text-sm leading-relaxed text-white/60">
					Gemaakt voor iedereen die in het Limburgs spreekt maar in het Nederlands wil schrijven:
					journalisten, studenten, onderzoekers, mantelzorgers, of gewoon iemand die een gesproken
					notitie wil omzetten naar tekst.
				</p>
			</section>

			<!-- 2. Hoe werkt het? -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90 flex items-center gap-2">
					<svg
						class="h-5 w-5 shrink-0 text-neon/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Hoe werkt het?
				</h2>
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
							<p class="text-sm font-medium text-white/70">Polijsten</p>
							<p class="text-xs text-white/50">
								De ruwe transcriptie wordt vervolgens gepolijst: Limburgse woorden en zinsbouw
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
						Limburgs niet als aparte taal. BABL werkt hier omheen: Whisper staat ingesteld op
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
						Mistral) leest de ruwe tekst en probeert er leesbaar Nederlands van te maken. Het
						verwijdert herhalingen, herstelt zinsbouw en polijst eventuele fouten — zodat je een
						leesbaar verslag overhoudt van wat er gezegd is.
					</p>
				</div>

				<div class="mt-4 border-t border-white/10 pt-4">
					<h3 class="mb-2 text-sm font-medium text-amber-400/80">Wat BABL niet goed kan</h3>
					<ul class="space-y-1.5 text-xs text-white/50">
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> Whisper kent het Limburgs niet als aparte taal
							— het valt terug op Nederlands met dialecthints. Bij sterk accent, snel spreken of veel
							achtergrondlawaai maakt het fouten.
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> De polijststap kan woorden verkeerd vertalen of
							betekenis veranderen. Controleer het resultaat altijd.
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> Korte opnames (&lt;5 seconden) geven onbetrouwbare
							resultaten.
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> BABL is experimenteel en geen vervanging voor professionele
							transcriptie.
						</li>
					</ul>
				</div>
			</section>

			<!-- 3. Lokaal vs API -->
			<section id="voor-en-nadelen" class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">
					Op de computer (<img
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
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Op de computer</h3>
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
								<li class="flex items-start gap-2">
									<span class="text-amber-400/60">−</span> Werkt niet op telefoon of tablet
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
									<span class="text-neon/60">+</span> Doorgaans sneller (verwerking op krachtige servers)
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
						<div class="mb-3 space-y-1.5 text-xs border-t border-white/10 pt-3">
							<p class="font-medium text-indigo-400/70">Waarom uitsluitend EU-servers?</p>
							<ul class="space-y-1 text-white/50">
								<li class="flex items-start gap-2">
									<span class="text-indigo-400/60">1.</span> De AVG (GDPR) geldt volledig binnen de EU
									— je data valt onder Europese privacywetgeving.
								</li>
								<li class="flex items-start gap-2">
									<span class="text-indigo-400/60">2.</span> De Amerikaanse CLOUD Act geeft de VS toegang
									tot data bij Amerikaanse aanbieders, ook als die fysiek in Europa staat. Door Europese
									diensten te kiezen (AssemblyAI Dublin, Mistral Parijs) vermijden we dit risico.
								</li>
							</ul>
							<p class="mt-1.5 text-white/40 italic">
								Als de data de deur verlaat, blijft het in de EU.
							</p>
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
								Audio wordt na verwerking verwijderd door de dienstverlener (zie AssemblyAI DPA)
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

			<!-- 5. Waar blijft je data? -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Waar blijft je data?</h2>
				<p class="mb-4 text-sm text-white/60">
					Korte versie: nergens. BABL slaat niets op op een server.
				</p>
				<div class="space-y-3">
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Tijdens het gebruik</h3>
						<p class="mt-1 text-xs leading-relaxed text-white/50">
							Opnames en tekst bestaan alleen in je browsersessie — het tijdelijke werkgeheugen van
							je browser. Technisch heet dit
							<a
								href="/begrippen#indexeddb"
								class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
							>
								IndexedDB</a
							>: een soort kladblok dat alleen op jouw computer staat.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Na het sluiten</h3>
						<p class="mt-1 text-xs leading-relaxed text-white/50">
							Sluit je de browsertab? Dan is alles definitief verdwenen. Audio, transcriptie,
							gepolijste tekst — niets blijft bewaard. Er is geen account, geen cloud-opslag, geen
							manier om het terug te halen.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Lokaal vs API</h3>
						<p class="mt-1 text-xs leading-relaxed text-white/50">
							<span class="text-neon/70">Lokale modus:</span> data verlaat je computer niet. Alles
							wordt verwerkt door programma's die op jouw machine draaien.<br />
							<span class="text-indigo-400/70">API-modus:</span> audio wordt naar EU-servers gestuurd
							voor verwerking en direct daarna verwijderd door de aanbieder. Er wordt niets bewaard.
						</p>
					</div>
				</div>
			</section>

			<!-- 6. Technologie onder de motorkap -->
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
							Ollama is een programma dat AI-modellen op je eigen computer laat draaien, zonder
							internet. Vergelijk het met een rekenmachine die op je bureau staat in plaats van in
							de cloud. Gemma is het taalmodel dat via Ollama draait — compact genoeg voor een
							gewone laptop (8 GB werkgeheugen volstaat).
						</p>
						<p class="mt-1.5 text-xs text-white/40">
							Ollama is optioneel: als je API-modus kiest, heb je het niet nodig. Dan polijst
							Mistral AI (op EU-servers) je tekst in plaats van Gemma op je computer.
						</p>
						<p class="mt-1.5">
							<a
								href="/begrippen#ollama"
								class="text-xs text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
							>
								Meer uitleg &rarr;
							</a>
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
						<p class="mt-1.5 text-xs text-white/30">
							<a
								href="https://www.assemblyai.com/security"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>EU Data Residency & Security</a
							>
							·
							<a
								href="https://www.assemblyai.com/legal/data-processing-addendum"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>DPA</a
							>
							·
							<a
								href="https://www.assemblyai.com/docs/speech-to-text/pii-redaction"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>PII-redactie docs</a
							>
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
							in API-modus voor het polijsten van dialect.
						</p>
						<p class="mt-1.5 text-xs text-white/30">
							<a
								href="https://mistral.ai/trust/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>Privacy & Trust</a
							>
						</p>
					</div>
				</div>
			</section>

			<!-- 7. Ondersteunde dialecten -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Ondersteunde dialecten</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL ondersteunt vijf Limburgse dialectvarianten. Elke variant heeft een eigen
					woordenlijst (glossary) en voorbeeldzinnen die het AI-model helpen correct te vertalen.
				</p>
				<div class="space-y-3">
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Algemeen Limburgs</h3>
						<p class="mt-1 text-xs text-white/40">
							De brede variant die de meeste Limburgse sprekers herkennen. Geschikt als je niet
							precies weet welk lokaal dialect je spreekt, of als je een mix spreekt.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Mestreechs</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Maastricht en directe omgeving. Kenmerken: "iech" (ik), "sjoen"
							(mooi), "kalle" (praten), "dök" (vaak). Sterk beïnvloed door het Frans en Waals.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Zittesj</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Sittard en omgeving. Kenmerken: "richtig" (juist), "zusamme" (samen),
							"bitte" (alsjeblieft), "plötzlich" (plotseling). Meer Duits-georiënteerd dan
							zuidelijker varianten.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Venloos</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Venlo en Noord-Limburg. Kenmerken: "gans" (heel), "ouch" (ook),
							"mótte" (moeten), "drök" (druk). Meer verwant aan het Brabants en Kleefs.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Kirchroeadsj</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Kerkrade en de Oostelijke Mijnstreek. Kenmerken: "d'r" (de/het),
							"junt" (gaan), "tsimmer" (kamer), "uvver" (over). Sterk Ripuarisch (verwant aan het
							Kölsch). Het meest afwijkend van standaard Nederlands.
						</p>
					</div>
				</div>
				<p class="mt-4 text-xs text-white/40">
					Mis je jouw dialect? BABL is een experimenteel project dat continu wordt uitgebreid.
					Nieuwe varianten worden toegevoegd op basis van vraag en beschikbare taaldata.
				</p>
			</section>

			<!-- 8. Tips voor het beste resultaat -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Tips voor het beste resultaat</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL is experimenteel — het resultaat hangt af van hoe je het gebruikt. Met deze tips haal
					je het meeste eruit:
				</p>
				<div class="space-y-3">
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							1
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Spreek rustig en duidelijk</p>
							<p class="text-xs text-white/50">
								Geef het model de tijd om elk woord te herkennen. Snel spreken of mompelen leidt tot
								meer fouten — zeker bij dialectwoorden.
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
							<p class="text-sm font-medium text-white/70">Neem op in een stille ruimte</p>
							<p class="text-xs text-white/50">
								Achtergrondlawaai (TV, verkeer, andere stemmen) verstoort de herkenning. Hoe stiller
								de omgeving, hoe beter het resultaat.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							3
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Kies het juiste dialect</p>
							<p class="text-xs text-white/50">
								Selecteer de variant die het dichtst bij jouw spraak ligt. "Algemeen Limburgs" is
								een veilige keuze als je twijfelt.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							4
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Neem minimaal 10 seconden op</p>
							<p class="text-xs text-white/50">
								Korte opnames (&lt;5 sec) geven onbetrouwbare resultaten. Het model heeft context
								nodig om woorden goed te herkennen.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							5
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Controleer altijd het resultaat</p>
							<p class="text-xs text-white/50">
								BABL toont de ruwe transcriptie naast het gepolijste resultaat. Vergelijk ze — soms
								vertaalt het model een woord verkeerd of voegt het iets toe. Jij blijft de
								eindredacteur.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<div
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon/80"
						>
							6
						</div>
						<div>
							<p class="text-sm font-medium text-white/70">Gebruik "Medium" bij moeilijk dialect</p>
							<p class="text-xs text-white/50">
								De kwaliteitsmodus "Medium" gebruikt een groter AI-model dat beter omgaat met sterk
								dialect, ongebruikelijke woorden en complexe zinnen. Het is langzamer, maar
								nauwkeuriger.
							</p>
						</div>
					</div>
				</div>
			</section>

			<!-- 9. Toegankelijkheid -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90">Toegankelijkheid</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL is ontworpen om voor zo veel mogelijk mensen bruikbaar te zijn:
				</p>
				<ul class="space-y-2 text-sm text-white/60">
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span>
							<span class="text-white/80">Toetsenbordnavigatie</span> — alle knoppen en elementen zijn
							bereikbaar met Tab en Enter. De spacebar start en stopt de opname.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span>
							<span class="text-white/80">Verminderde beweging</span> — als je in je systeeminstellingen
							"verminder beweging" hebt aanstaan, worden animaties uitgeschakeld.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span>
							<span class="text-white/80">Schermlezers</span> — knoppen en statusmeldingen hebben ARIA-labels
							zodat schermlezers (zoals VoiceOver) de interface kunnen voorlezen.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span>
							<span class="text-white/80">Contrast</span> — tekst en interactieve elementen voldoen aan
							WCAG AA-contrastvereisten tegen de donkere achtergrond.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
						<span>
							<span class="text-white/80">Mobiel</span> — de interface past zich aan voor kleinere schermen.
							In API-modus werkt BABL volledig op telefoon en tablet.
						</span>
					</li>
				</ul>
			</section>

			<!-- 10. Open source & contact -->
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
				<span class="text-white/10">|</span>
				<a href="/begrippen" class="hover:text-white/60 transition-colors">Begrippen</a>
				<span class="text-white/10">|</span>
				<a href="/faq" class="hover:text-white/60 transition-colors">FAQ</a>
			</div>
		</footer>
	</div>
</div>
