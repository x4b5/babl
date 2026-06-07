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
				<h2 class="mb-4 text-lg font-semibold text-white/90">Privacy & wetgeving</h2>
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
				</dl>
			</section>

			<!-- 2. Certificeringen -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90">Certificeringen</h2>
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
				<h2 class="mb-4 text-lg font-semibold text-white/90">Technologie</h2>
				<dl class="space-y-4">
					<div id="indexeddb">
						<dt class="text-sm font-medium text-white/80">IndexedDB</dt>
						<dd class="mt-1 text-xs leading-relaxed text-white/50">
							Een soort kladblok in je browser waar websites tijdelijk data kunnen bewaren. Het
							staat alleen op jouw computer, niet op een server. BABL gebruikt dit om audio
							tijdelijk vast te houden tijdens verwerking. Sluit je de tab? Dan is alles weg.
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
				</dl>
			</section>

			<!-- 4. Kwaliteitsmeting -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-4 text-lg font-semibold text-white/90">Kwaliteitsmeting</h2>
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
				<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
			</div>
		</footer>
	</div>
</div>
