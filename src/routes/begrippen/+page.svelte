<svelte:head>
	<title>Begrippen — BABL</title>
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
			<h1 class="text-2xl font-semibold text-white/90">Begrippen</h1>
			<p class="mt-2 text-sm text-white/40">Technische termen uitgelegd in gewone taal</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- 1. Privacy & wetgeving -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Privacy & wetgeving
				</h2>
				<dl class="space-y-4">
					<div id="avg">
						<dt class="text-sm font-medium text-white/80">AVG / GDPR</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							De Europese privacywet die regelt hoe bedrijven en organisaties met persoonsgegevens
							moeten omgaan. AVG is de Nederlandse naam, GDPR de Engelse. Geldt voor iedereen die
							data van EU-burgers verwerkt.
						</dd>
					</div>
					<div id="cloud-act">
						<dt class="text-sm font-medium text-white/80">CLOUD Act</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een Amerikaanse wet die de VS toegang geeft tot data bij Amerikaanse bedrijven, ook
							als die data fysiek in Europa staat. Daarom kiest BABL voor Europese dienstverleners.
						</dd>
					</div>
					<div id="pii">
						<dt class="text-sm font-medium text-white/80">
							PII (Personally Identifiable Information)
						</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Alle informatie waarmee je een persoon kunt identificeren: naam, telefoonnummer,
							e-mailadres, geboortedatum, etc. BABL kan PII automatisch verwijderen uit
							transcripties (in API-modus).
						</dd>
					</div>
					<div id="verwerkingsovereenkomst">
						<dt class="text-sm font-medium text-white/80">Verwerkingsovereenkomst (DPA)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een contract tussen jou en een dienstverlener dat vastlegt hoe zij met jouw data
							omgaan. Verplicht onder de AVG wanneer een ander partij jouw persoonsgegevens
							verwerkt.
						</dd>
					</div>
					<div id="subverwerker">
						<dt class="text-sm font-medium text-white/80">Subverwerker</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een partij die namens een verwerker data verwerkt. Voorbeeld: als BABL jouw audio
							doorstuurt naar AssemblyAI, dan is AssemblyAI een subverwerker.
						</dd>
					</div>
					<div id="opt-in">
						<dt class="text-sm font-medium text-white/80">Opt-in</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Je moet actief toestemming geven voordat iets gebeurt. Geen vooraf aangevinkte vakjes.
							Bij BABL kies je zelf of je lokaal of via API werkt — niets wordt automatisch naar
							buiten gestuurd.
						</dd>
					</div>
					<div id="eu-ai-act">
						<dt class="text-sm font-medium text-white/80">EU AI Act</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							De Europese wet die regelt hoe AI-systemen mogen worden ingezet. Vergelijkbaar met de
							AVG, maar dan voor kunstmatige intelligentie. BABL valt in de categorie "beperkt
							risico" (limited risk) omdat het geen autonome beslissingen neemt over personen en
							niet onder de hoog-risico categorieën valt (Art. 6, Bijlage III).
						</dd>
					</div>
					<div id="data-residency">
						<dt class="text-sm font-medium text-white/80">Data residency (datalocatie)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							De fysieke plek waar je data wordt opgeslagen en verwerkt. BABL in API-modus gebruikt
							alleen servers in de EU (Dublin voor transcriptie, EU-regio voor polijsten). In lokale
							modus verlaat je data je computer niet.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 2. Certificeringen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
						/>
					</svg>
					Certificeringen
				</h2>
				<dl class="space-y-4">
					<div id="soc2">
						<dt class="text-sm font-medium text-white/80">SOC 2 Type II</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een onafhankelijke audit die bewijst dat een bedrijf data veilig verwerkt en opslaat.
							"Type II" betekent dat dit over een langere periode is gecontroleerd, niet alleen op
							een enkel moment. AssemblyAI heeft deze certificering.
						</dd>
					</div>
					<div id="iso27001">
						<dt class="text-sm font-medium text-white/80">ISO 27001</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een internationale standaard voor informatiebeveiliging. Bedrijven met dit certificaat
							hebben een gestructureerd systeem om data te beschermen tegen lekken, hacks en fouten.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 3. Technologie -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
						/>
					</svg>
					Technologie
				</h2>
				<dl class="space-y-4">
					<div id="indexeddb">
						<dt class="text-sm font-medium text-white/80">IndexedDB</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een database in je browser waar websites lokaal data kunnen bewaren. Het staat alleen
							op jouw computer, niet op een server. BABL slaat hier maximaal 3 audio-opnames op.
							IndexedDB blijft bewaard als je de tab sluit — pas als je je browserdata wist of de
							opnames handmatig verwijdert, zijn ze weg.
						</dd>
					</div>
					<div id="sse">
						<dt class="text-sm font-medium text-white/80">SSE (Server-Sent Events)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een techniek waarmee een server stukje voor stukje informatie naar je browser stuurt.
							BABL gebruikt dit zodat je de transcriptie en polijsting woord voor woord ziet
							verschijnen, in plaats van te wachten tot alles klaar is.
						</dd>
					</div>
					<div id="api">
						<dt class="text-sm font-medium text-white/80">
							API (Application Programming Interface)
						</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een gestandaardiseerde manier voor programma's om met elkaar te communiceren. Als BABL
							in "API-modus" staat, stuurt het je audio naar een externe dienst (AssemblyAI) en
							krijgt tekst terug.
						</dd>
					</div>
					<div id="ollama">
						<dt class="text-sm font-medium text-white/80">Ollama</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een programma dat AI-modellen op je eigen computer laat draaien, zonder internet.
							Vergelijk het met een rekenmachine die op je bureau staat in plaats van in de cloud.
							Het is optioneel — als je API-modus kiest, heb je Ollama niet nodig.
						</dd>
					</div>
					<div id="lora">
						<dt class="text-sm font-medium text-white/80">LoRA (Low-Rank Adaptation)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een techniek om een AI-model bij te trainen zonder het hele model opnieuw te hoeven
							trainen. Alsof je een boek een extra hoofdstuk geeft in plaats van het hele boek te
							herschrijven. Kan in de toekomst worden gebruikt om BABL beter Limburgs te leren.
						</dd>
					</div>
					<div id="websocket">
						<dt class="text-sm font-medium text-white/80">WebSocket</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een open verbinding tussen je browser en een server waardoor ze continu heen en weer
							kunnen praten. Vergelijk het met een telefoongesprek (altijd verbonden) in plaats van
							brieven sturen (steeds opnieuw verbinding maken). BABL gebruikt dit voor real-time
							live transcriptie.
						</dd>
					</div>
					<div id="wav">
						<dt class="text-sm font-medium text-white/80">WAV (audioformaat)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een ongecomprimeerd audioformaat — alle geluidsinformatie blijft bewaard, niets wordt
							weggegooid. BABL converteert je microfoon-opname naar WAV (16kHz, mono) omdat
							spraakherkenning daar het beste mee werkt.
						</dd>
					</div>
					<div id="apple-silicon">
						<dt class="text-sm font-medium text-white/80">Apple Silicon / MLX</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Apple Silicon is de chip in nieuwere Macs (M1, M2, M3, M4). MLX is een rekenprogramma
							van Apple dat AI-modellen snel laat draaien op die chip. BABL gebruikt mlx-whisper
							zodat transcriptie lokaal snel werkt op een Mac.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 4. Spraak & AI -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
						/>
					</svg>
					Spraak & AI
				</h2>
				<dl class="space-y-4">
					<div id="stt">
						<dt class="text-sm font-medium text-white/80">STT (Speech-to-Text)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het omzetten van gesproken woorden naar geschreven tekst. De kern van wat BABL doet:
							je spreekt Limburgs, en het systeem maakt er leesbare tekst van.
						</dd>
					</div>
					<div id="transcriptie">
						<dt class="text-sm font-medium text-white/80">Transcriptie</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Stap 1 in BABL: je spraak wordt letterlijk omgezet naar tekst. Dit is nog "ruw" —
							dialectwoorden staan er precies in zoals je ze uitspreekt. Whisper doet dit werk.
						</dd>
					</div>
					<div id="polijsten">
						<dt class="text-sm font-medium text-white/80">Polijsten</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Stap 2 in BABL: de ruwe transcriptie wordt herschreven naar standaard Nederlands.
							Dialectwoorden worden vertaald, grammatica wordt gecorrigeerd. Een AI-taalmodel
							(Ollama of Mistral) doet dit werk.
						</dd>
					</div>
					<div id="whisper">
						<dt class="text-sm font-medium text-white/80">Whisper</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een spraakherkenningsmodel van OpenAI dat audio omzet naar tekst. Het "luistert" naar
							je opname en schrijft op wat het hoort. BABL gebruikt het large-v3 model voor de beste
							kwaliteit bij dialect.
						</dd>
					</div>
					<div id="llm">
						<dt class="text-sm font-medium text-white/80">LLM (Large Language Model)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een groot taalmodel — een AI die is getraind op enorme hoeveelheden tekst en daardoor
							taal "begrijpt". BABL gebruikt een LLM om dialecttekst om te zetten naar standaard
							Nederlands.
						</dd>
					</div>
					<div id="token">
						<dt class="text-sm font-medium text-white/80">Token</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een stukje tekst waar een AI-model mee werkt — meestal een woord of woorddeel. Het
							woord "fietsenstalling" kan bijvoorbeeld 3 tokens zijn: "fietsen", "stal", "ling".
							BABL toont de polijsting token voor token zodat je het resultaat ziet verschijnen.
						</dd>
					</div>
					<div id="prompt">
						<dt class="text-sm font-medium text-white/80">Prompt</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							De instructie die je aan een AI-model geeft. Bij BABL is dat bijvoorbeeld: "Vertaal
							deze Limburgse tekst naar standaard Nederlands, behoud de betekenis." Je ziet de
							prompt niet, maar het stuurt het polijstresultaat.
						</dd>
					</div>
					<div id="few-shot">
						<dt class="text-sm font-medium text-white/80">Few-shot learning</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een techniek waarbij je de AI een paar voorbeelden geeft van wat je wilt. "Als ik
							'sjoen' zeg, bedoel ik 'mooi'." BABL stuurt dialectvoorbeelden mee zodat het model
							beter begrijpt hoe het moet vertalen.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 5. Kwaliteitsmeting -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					Kwaliteitsmeting
				</h2>
				<dl class="space-y-4">
					<div id="wer">
						<dt class="text-sm font-medium text-white/80">WER (Word Error Rate)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het percentage woorden dat de spraakherkenning fout heeft. Een WER van 10% betekent
							dat 1 op de 10 woorden niet klopt. Hoe lager, hoe beter.
						</dd>
					</div>
					<div id="cer">
						<dt class="text-sm font-medium text-white/80">CER (Character Error Rate)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Hetzelfde als WER, maar dan per letter in plaats van per woord. Nuttig bij talen met
							samengestelde woorden, waar een fout woord soms maar een letter verschil heeft.
						</dd>
					</div>
					<div id="hallucinatie">
						<dt class="text-sm font-medium text-white/80">Hallucinatie</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Wanneer een AI-model iets verzint dat niet in de bron staat. Bij spraakherkenning:
							woorden "horen" die er niet zijn. Bij polijsten: tekst toevoegen die je niet hebt
							gezegd. BABL toont altijd de ruwe transcriptie naast het gepolijste resultaat zodat je
							dit kunt controleren.
						</dd>
					</div>
					<div id="confidence-score">
						<dt class="text-sm font-medium text-white/80">Confidence score (betrouwbaarheid)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een getal (0–100%) dat aangeeft hoe zeker het model is van zijn resultaat. AssemblyAI
							geeft per woord een confidence score. Hoe hoger, hoe waarschijnlijker dat het woord
							correct is herkend.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 6. Dialect & taal -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					Dialect & taal
				</h2>
				<dl class="space-y-4">
					<div id="dialect">
						<dt class="text-sm font-medium text-white/80">Dialect</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een regionale variant van een taal met eigen woorden, klanken en grammatica. Limburgs
							is geen "fout Nederlands" maar een erkende streektaal met meerdere varianten
							(Mestreechs, Zittesj, Venloos, Kirchroeadsj).
						</dd>
					</div>
					<div id="code-switching">
						<dt class="text-sm font-medium text-white/80">Code-switching</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het wisselen tussen twee talen of dialecten binnen een zin of gesprek. Veel Limburgers
							doen dit automatisch — een zin begint in dialect en eindigt in Nederlands. BABL kan
							hiermee omgaan bij het polijsten.
						</dd>
					</div>
					<div id="glossary">
						<dt class="text-sm font-medium text-white/80">Glossary (woordenlijst)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een vertaallijst van dialectwoorden naar standaard Nederlands. BABL heeft per
							dialectvariant een glossary ingebouwd (bijv. "sjoen" → "mooi", "hoes" → "huis") zodat
							het AI-model weet hoe het moet vertalen.
						</dd>
					</div>
					<div id="normalisatie">
						<dt class="text-sm font-medium text-white/80">Normalisatie</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het omzetten van variërende schrijfwijzen naar een standaardvorm. "Sjoen", "sjön" en
							"sjun" betekenen allemaal "mooi" — normalisatie zorgt dat ze allemaal als hetzelfde
							woord worden herkend.
						</dd>
					</div>
					<div id="streektaal">
						<dt class="text-sm font-medium text-white/80">Streektaal</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een taal die in een bepaalde regio wordt gesproken en daar historisch geworteld is.
							Limburgs is sinds 1997 officieel erkend als streektaal onder het Europees Handvest
							voor regionale talen.
						</dd>
					</div>
					<div id="tonaliteit">
						<dt class="text-sm font-medium text-white/80">Tonaliteit (sleeptoon / stoottoon)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Limburgs is een van de weinige West-Europese talen met toonverschillen: hetzelfde
							woord krijgt een andere betekenis door de melodie (sleeptoon vs stoottoon). Dit maakt
							spraakherkenning extra uitdagend.
						</dd>
					</div>
				</dl>
			</section>

			<!-- 7. Verwerking & architectuur -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90 flex items-center gap-2">
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
					Verwerking & architectuur
				</h2>
				<dl class="space-y-4">
					<div id="lokale-modus">
						<dt class="text-sm font-medium text-white/80">Lokale modus</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Alles draait op je eigen computer: Whisper voor transcriptie, Ollama voor polijsten.
							Er gaat geen data het internet op. Ideaal voor gevoelige gesprekken of als je geen
							internetverbinding hebt.
						</dd>
					</div>
					<div id="api-modus">
						<dt class="text-sm font-medium text-white/80">API-modus</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Je audio wordt versleuteld naar EU-servers gestuurd (AssemblyAI in Dublin, Mistral in
							EU) voor verwerking. Sneller en nauwkeuriger dan lokaal, maar vereist internet en
							vertrouwen in de dienstverlener.
						</dd>
					</div>
					<div id="streaming">
						<dt class="text-sm font-medium text-white/80">Streaming</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het stukje voor stukje verwerken en tonen van resultaten, in plaats van te wachten tot
							alles klaar is. Bij BABL zie je woorden verschijnen terwijl ze worden verwerkt — alsof
							iemand in real-time meetype.
						</dd>
					</div>
					<div id="chunking">
						<dt class="text-sm font-medium text-white/80">Chunking</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het opdelen van een groot stuk tekst of audio in kleinere blokken voor verwerking.
							BABL knipt lange teksten in stukken van maximaal 400 woorden zodat het AI-model elk
							stuk goed kan verwerken.
						</dd>
					</div>
					<div id="downsampling">
						<dt class="text-sm font-medium text-white/80">Downsampling</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het verlagen van de kwaliteit/frequentie van een audiosignaal. Je microfoon neemt op
							in hoge kwaliteit (48kHz), maar Whisper werkt het beste met 16kHz mono. BABL
							converteert automatisch — je merkt er niets van.
						</dd>
					</div>
					<div id="encryptie">
						<dt class="text-sm font-medium text-white/80">Encryptie (versleuteling)</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Het onleesbaar maken van data tijdens verzending, zodat alleen de ontvanger het kan
							lezen. BABL stuurt audio in API-modus altijd via HTTPS (versleuteld) — alsof je een
							brief in een kluis verstuurt in plaats van op een briefkaart.
						</dd>
					</div>
				</dl>
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
				<a href="/faq" class="hover:text-white/60 transition-colors">FAQ</a>
				<span class="text-white/10">|</span>
				<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
			</div>
		</footer>
	</div>
</div>
