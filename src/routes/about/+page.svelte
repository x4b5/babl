<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<svelte:head>
	<title>Over BABL — Privacy, technologie & transparantie</title>
</svelte:head>

<div class="fixed top-6 right-6 z-50 flex items-center gap-2">
	<ThemeToggle />
	<a
		href="/"
		class="glass rounded-full px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-2"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
		</svg>
		Terug
	</a>
</div>

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

			<!-- 2. Wat kun je ermee? (Use cases) -->
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
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					Wat kun je ermee?
				</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL is gebouwd voor iedereen die in dialect spreekt en leesbare tekst nodig heeft. Vier
					voorbeelden:
				</p>
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-4 w-4 text-neon/80"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
									/>
								</svg>
							</div>
							<h3 class="text-sm font-medium text-white/80">Journalist</h3>
						</div>
						<p class="text-xs text-white/50">
							Interview in dialect opnemen, omzetten naar leesbaar verslag voor publicatie.
						</p>
						<p class="mt-2 text-xs text-white/30">Relevant: sprekersherkenning, verslaglegging</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-4 w-4 text-neon/80"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
							</div>
							<h3 class="text-sm font-medium text-white/80">Mantelzorger</h3>
						</div>
						<p class="text-xs text-white/50">
							Gesprek met arts vastleggen, verslag maken om met familie te delen.
						</p>
						<p class="mt-2 text-xs text-white/30">Relevant: samenvatting, PII-redactie (API)</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-4 w-4 text-neon/80"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
							</div>
							<h3 class="text-sm font-medium text-white/80">Student</h3>
						</div>
						<p class="text-xs text-white/50">
							College of werkgroep opnemen, samenvatting genereren voor studie.
						</p>
						<p class="mt-2 text-xs text-white/30">Relevant: samenvatting, live transcriptie</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-4 w-4 text-neon/80"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<h3 class="text-sm font-medium text-white/80">Vergadering</h3>
						</div>
						<p class="text-xs text-white/50">
							Werkoverleg vastleggen met sprekersherkenning, notulen genereren.
						</p>
						<p class="mt-2 text-xs text-white/30">Relevant: speaker labels, verslaglegging</p>
					</div>
				</div>
			</section>

			<!-- 3. Hoe werkt het? -->
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
							<p class="text-sm font-medium text-white/70">Polijsten & opmaken</p>
							<p class="text-xs text-white/50">
								De ruwe transcriptie wordt vervolgens gepolijst en opgemaakt: Limburgse woorden en
								zinsbouw worden omgezet naar standaard Nederlands, en het resultaat wordt
								geformateerd als leesbaar verslag. Je ziet beide versies en kunt het resultaat
								bewerken.
							</p>
						</div>
					</div>
				</div>

				<!-- Flow diagram -->
				<div class="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
					<p class="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
						Visueel overzicht
					</p>
					<!-- Desktop: horizontal flow -->
					<div class="hidden sm:flex items-center justify-between gap-2">
						<div class="flex flex-col items-center gap-1">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-5 w-5 text-neon/80"
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
							</div>
							<span class="text-xs text-white/50">Microfoon</span>
						</div>
						<svg
							class="h-4 w-4 shrink-0 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg
						>
						<div class="flex flex-col items-center gap-1">
							<span class="text-xs text-neon/60 flex items-center gap-1"
								><img src="/openai.png" alt="" class="h-3 w-3 rounded-full" /> Whisper</span
							>
							<span class="text-xs text-indigo-400/60 flex items-center gap-1"
								><img src="/assemblyai.png" alt="" class="h-3 w-3" /> AssemblyAI</span
							>
						</div>
						<svg
							class="h-4 w-4 shrink-0 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg
						>
						<div class="flex flex-col items-center gap-1">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10"
							>
								<svg
									class="h-5 w-5 text-white/50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<span class="text-xs text-white/50">Ruwe tekst</span>
						</div>
						<svg
							class="h-4 w-4 shrink-0 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg
						>
						<div class="flex flex-col items-center gap-1">
							<span class="text-xs text-neon/60 flex items-center gap-1"
								><img src="/ollama.png" alt="" class="h-3 w-3" /> Ollama</span
							>
							<span class="text-xs text-indigo-400/60 flex items-center gap-1"
								><img src="/mistral.png" alt="" class="h-3 w-3" /> Mistral</span
							>
						</div>
						<svg
							class="h-4 w-4 shrink-0 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg
						>
						<div class="flex flex-col items-center gap-1">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10 border border-neon/20"
							>
								<svg
									class="h-5 w-5 text-neon"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<span class="text-xs text-neon/70">Gepolijst & opgemaakt</span>
						</div>
					</div>
					<!-- Mobile: vertical flow -->
					<div class="flex sm:hidden flex-col items-center gap-2">
						<div class="flex items-center gap-3 w-full">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<svg
									class="h-4 w-4 text-neon/80"
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
							</div>
							<span class="text-xs text-white/50">Microfoon</span>
						</div>
						<svg
							class="h-3 w-3 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7" /></svg
						>
						<div class="flex items-center gap-3 w-full">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<img src="/openai.png" alt="Whisper" class="h-4 w-4 rounded-full" />
							</div>
							<span class="text-xs flex items-center gap-1.5"
								><img src="/openai.png" alt="" class="h-3 w-3 rounded-full" /><span
									class="text-neon/60">Whisper</span
								>
								<span class="text-white/30">/</span>
								<img src="/assemblyai.png" alt="" class="h-3 w-3" /><span class="text-indigo-400/60"
									>AssemblyAI</span
								></span
							>
						</div>
						<svg
							class="h-3 w-3 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7" /></svg
						>
						<div class="flex items-center gap-3 w-full">
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10"
							>
								<svg
									class="h-4 w-4 text-white/50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<span class="text-xs text-white/50">Ruwe tekst</span>
						</div>
						<svg
							class="h-3 w-3 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7" /></svg
						>
						<div class="flex items-center gap-3 w-full">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
								<img src="/ollama.png" alt="Ollama" class="h-4 w-4" />
							</div>
							<span class="text-xs flex items-center gap-1.5"
								><img src="/ollama.png" alt="" class="h-3 w-3" /><span class="text-neon/60"
									>Ollama</span
								>
								<span class="text-white/30">/</span>
								<img src="/mistral.png" alt="" class="h-3 w-3" /><span class="text-indigo-400/60"
									>Mistral</span
								></span
							>
						</div>
						<svg
							class="h-3 w-3 text-white/20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7" /></svg
						>
						<div class="flex items-center gap-3 w-full">
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10 border border-neon/20"
							>
								<svg
									class="h-4 w-4 text-neon"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<span class="text-xs text-neon/70">Gepolijst & opgemaakt</span>
						</div>
					</div>
					<div class="mt-3 flex items-center gap-4 text-xs text-white/30">
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded-full bg-neon/50"></span> Lokaal</span
						>
						<span class="flex items-center gap-1"
							><span class="inline-block h-2 w-2 rounded-full bg-indigo-400/50"></span> API</span
						>
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
						Whisper verkeerd verstaat. Daarom volgt een tweede stap: een taalmodel leest de ruwe
						tekst en probeert er leesbaar Nederlands van te maken. Het verwijdert herhalingen,
						herstelt zinsbouw, polijst eventuele fouten en maakt de tekst op als verslag — zodat je
						een leesbaar resultaat overhoudt van wat er gezegd is.
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
							<span class="text-amber-400/60">!</span> De polijs- en opmaakstap kan woorden verkeerd vertalen
							of betekenis veranderen. Controleer het resultaat altijd.
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> Korte opnames (&lt;5 seconden) geven onbetrouwbare
							resultaten. Spraakherkenning heeft context nodig om woorden goed te interpreteren — bij
							te weinig audio mist het model de omringende zinnen die helpen om onduidelijke klanken te
							ontcijferen. Ook kan het model bij korte fragmenten gaan "hallucineren": het vult ontbrekende
							context zelf in met tekst die niet is uitgesproken.
						</li>
						<li class="flex items-start gap-2">
							<span class="text-amber-400/60">!</span> BABL is experimenteel en geen vervanging voor professionele
							transcriptie.
						</li>
					</ul>
				</div>
			</section>

			<!-- 4. Wat kan BABL? (Features) -->
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
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/>
					</svg>
					Wat kan BABL?
				</h2>
				<p class="mb-4 text-sm text-white/60">
					Naast transcriptie en polijsten heeft BABL een reeks extra features die je werkflow
					verbeteren:
				</p>
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Pauze/hervat</h3>
						</div>
						<p class="text-xs text-white/50">
							Opname pauzeren en hervatten zonder opnieuw te beginnen.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Sprekersherkenning</h3>
						</div>
						<p class="text-xs text-white/50">
							Automatisch herkennen wie er spreekt (Spreker A, B, C...) met kleuren en aanpasbare
							namen.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Verslaglegging</h3>
						</div>
						<p class="text-xs text-white/50">
							Keuze uit samenvatting (kort) of uitgebreid verslag (derde persoon met
							sprekerattributie).
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-amber-400/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Lage-zekerheid correctie</h3>
						</div>
						<p class="text-xs text-white/50">
							Woorden waar het model onzeker over is worden gemarkeerd. Je kunt ze inline
							corrigeren.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Live transcriptie</h3>
						</div>
						<p class="text-xs text-white/50">
							Tekst verschijnt terwijl je spreekt. API: real-time, lokaal: ~5s vertraging.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-indigo-400/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">PII-redactie</h3>
						</div>
						<p class="text-xs text-white/50">
							In API-modus worden namen, telefoonnummers en medische gegevens automatisch
							verwijderd.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Dialectkeuze</h3>
						</div>
						<p class="text-xs text-white/50">
							5 Limburgse varianten met eigen woordenlijst en voorbeeldzinnen.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="h-4 w-4 shrink-0 text-neon/70"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							<h3 class="text-sm font-medium text-white/80">Audio download</h3>
						</div>
						<p class="text-xs text-white/50">Opname downloaden als backup voordat je stopt.</p>
					</div>
				</div>
			</section>

			<!-- 5. Lokaal vs API -->
			<section id="voor-en-nadelen" class="glass-strong rounded-2xl p-6">
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
							d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
						/>
					</svg>
					<span
						>Op de computer (<img
							src="/openai.png"
							alt=""
							class="inline h-4 w-4 -mt-0.5 rounded-full"
						/>
						Whisper) vs via internet (<img
							src="/assemblyai.png"
							alt=""
							class="inline h-4 w-4 -mt-0.5"
						/> AssemblyAI)</span
					>
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
									<span class="text-neon/60">+</span> Ingebouwde
									<a
										href="https://www.assemblyai.com/docs/speech-to-text/pii-redaction"
										target="_blank"
										rel="noopener noreferrer"
										class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
										>PII-redactie</a
									>: namen, telefoonnummers en medische gegevens worden automatisch verwijderd uit
									de transcriptie
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
									Verwerkersovereenkomsten van toepassing (<a
										href="https://www.assemblyai.com/legal/data-processing-addendum"
										target="_blank"
										rel="noopener noreferrer"
										class="text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
										>AssemblyAI</a
									>,
									<a
										href="https://mistral.ai/terms/#data-processing-agreement"
										target="_blank"
										rel="noopener noreferrer"
										class="text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
										>Mistral</a
									>)
								</li>
								<li class="flex items-start gap-2">
									<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
									Hosting: Vercel met serververwerking in Frankfurt (EU) — ook de doorgifte van audio
									en tekst loopt via Europese servers
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

			<!-- 6. Kosten -->
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
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Kosten
				</h2>
				<div class="space-y-4">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Lokale modus</h3>
						<p class="text-sm text-white/60">
							<span class="text-neon/70 font-medium">Gratis</span> — je gebruikt je eigen hardware. Geen
							abonnement, geen kosten per gebruik.
						</p>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">API-modus (indicatief)</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-left text-xs text-white/40">
										<th class="pb-2 pr-4 font-medium">Onderdeel</th>
										<th class="pb-2 font-medium">Kosten</th>
									</tr>
								</thead>
								<tbody class="text-white/60">
									<tr class="border-t border-white/5">
										<td class="py-2 pr-4"
											><a
												href="https://www.assemblyai.com/pricing"
												target="_blank"
												rel="noopener noreferrer"
												class="underline decoration-white/20 underline-offset-2 hover:text-white/80 transition-colors"
												>Transcriptie (AssemblyAI)</a
											></td
										>
										<td class="py-2">~&euro;0,16 per uur audio</td>
									</tr>
									<tr class="border-t border-white/5">
										<td class="py-2 pr-4"
											><a
												href="https://mistral.ai/products/pricing"
												target="_blank"
												rel="noopener noreferrer"
												class="underline decoration-white/20 underline-offset-2 hover:text-white/80 transition-colors"
												>Polijsten (Mistral Large)</a
											></td
										>
										<td class="py-2">~&euro;0,05 per verslag</td>
									</tr>
									<tr class="border-t border-white/10 font-medium">
										<td class="py-2 pr-4 text-white/80">Typisch totaal per uur</td>
										<td class="py-2 text-white/80">~&euro;0,21</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p class="mt-3 text-xs text-white/30 italic">
							Prijzen zijn indicatief en gebaseerd op tarieven van juni 2025. BABL toont de
							geschatte kosten live tijdens opname.
						</p>
					</div>
				</div>
			</section>

			<!-- 7. BABL in gesprekken -->
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
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					BABL gebruiken in gesprekken
				</h2>
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

			<!-- 8. Privacy-bewuste verwerking -->
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
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
					Privacy-bewuste verwerking
				</h2>
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
								Persoonsgegevens (stemgeluid, gesproken inhoud) worden alleen tijdelijk verwerkt en niet
								permanent opgeslagen
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Audio wordt na verwerking verwijderd door de dienstverlener (<a
									href="https://www.assemblyai.com/legal/data-processing-addendum"
									target="_blank"
									rel="noopener noreferrer"
									class="text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
									>AssemblyAI DPA</a
								>)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Geen gebruikersprofielen of tracking (analytics via PostHog met
								<code class="text-[10px] bg-white/5 px-1 py-0.5 rounded"
									>person_profiles:&nbsp;'never'</code
								>)
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
								Classificatie: beperkt risico — geen autonome besluitvorming, geen hoog-risico toepassing
								(<a
									href="https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32024R1689"
									target="_blank"
									rel="noopener noreferrer"
									class="text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
									>Art.&nbsp;6 &amp; Bijlage&nbsp;III</a
								>)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Transparantie: AI-gegenereerde output is duidelijk gelabeld (<a
									href="https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32024R1689"
									target="_blank"
									rel="noopener noreferrer"
									class="text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
									>Art.&nbsp;50</a
								>)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Modellen: Whisper + Ollama (lokaal), AssemblyAI + Mistral (EU-servers)
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

			<!-- 9. Waar blijft je data? -->
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
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Waar blijft je data?
				</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL slaat niets op op een server. Audio-opnames worden tijdelijk lokaal bewaard in je
					browser (maximaal 3, daarna wordt de oudste verwijderd).
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
							Transcripties en gepolijste tekst verdwijnen als je de tab sluit. Audio-opnames
							blijven bewaard in IndexedDB (maximaal 3) totdat je ze handmatig verwijdert of je
							browserdata wist. Er is geen account, geen cloud-opslag, geen server-side backup.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Lokaal vs API</h3>
						<p class="mt-1 text-xs leading-relaxed text-white/50">
							<span class="text-neon/70">Lokale modus:</span> data verlaat je computer niet. Alles
							wordt verwerkt door programma's die op jouw machine draaien.<br />
							<span class="text-indigo-400/70">API-modus:</span> audio wordt naar EU-servers
							gestuurd voor verwerking en direct daarna verwijderd door de aanbieder (<a
								href="https://www.assemblyai.com/legal/data-processing-addendum"
								target="_blank"
								rel="noopener noreferrer"
								class="text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
								>DPA</a
							>). Er wordt niets bewaard.
						</p>
					</div>

					<!-- Data flow visual -->
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<p class="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Dataflow</p>
						<div class="space-y-3">
							<!-- Lokaal -->
							<div class="flex items-center gap-2">
								<span class="text-xs font-medium text-neon/70 w-14 shrink-0">Lokaal</span>
								<div class="flex items-center gap-1.5 flex-1">
									<div class="flex h-7 w-7 items-center justify-center rounded bg-neon/10">
										<svg
											class="h-3.5 w-3.5 text-neon/80"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<div class="flex-1 h-0.5 bg-neon/20 rounded relative">
										<div class="absolute inset-0 bg-neon/40 rounded animate-pulse"></div>
									</div>
									<div class="flex h-7 w-7 items-center justify-center rounded bg-neon/10">
										<svg
											class="h-3.5 w-3.5 text-neon/80"
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
									</div>
								</div>
								<span class="text-xs text-white/40 ml-1">alles blijft hier</span>
							</div>
							<!-- API -->
							<div class="flex items-center gap-2">
								<span class="text-xs font-medium text-indigo-400/70 w-14 shrink-0">API</span>
								<div class="flex items-center gap-1.5 flex-1">
									<div class="flex h-7 w-7 items-center justify-center rounded bg-indigo-500/10">
										<svg
											class="h-3.5 w-3.5 text-indigo-400/80"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<svg
										class="h-3 w-3 shrink-0 text-indigo-400/40"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M14 5l7 7m0 0l-7 7m7-7H3"
										/></svg
									>
									<div class="flex h-7 w-7 items-center justify-center rounded bg-indigo-500/10">
										<span class="text-xs">EU</span>
									</div>
									<svg
										class="h-3 w-3 shrink-0 text-indigo-400/40"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M14 5l7 7m0 0l-7 7m7-7H3"
										/></svg
									>
									<div class="flex h-7 w-7 items-center justify-center rounded bg-indigo-500/10">
										<svg
											class="h-3.5 w-3.5 text-indigo-400/80"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</div>
									<svg
										class="h-3 w-3 shrink-0 text-red-400/40"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/></svg
									>
								</div>
								<span class="text-xs text-white/40 ml-1">verwijderd</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 10. Technologie onder de motorkap -->
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
							d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
						/>
					</svg>
					Technologie onder de motorkap
				</h2>
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
							>
						</h3>
						<p class="mt-1 text-xs text-white/40">
							Ollama is een programma dat AI-modellen op je eigen computer laat draaien, zonder
							internet. Vergelijk het met een rekenmachine die op je bureau staat in plaats van in
							de cloud. BABL ondersteunt meerdere open-source taalmodellen — je kiest zelf welk
							model het beste past bij jouw hardware.
						</p>
						<p class="mt-1.5 text-xs text-white/40">
							Ollama is optioneel: als je API-modus kiest, heb je het niet nodig. Dan polijst en
							maakt Mistral AI (op EU-servers) je tekst op.
						</p>
						<p class="mt-1.5 flex items-center gap-3">
							<a
								href="/begrippen#ollama"
								class="text-xs text-neon/60 underline decoration-neon/20 underline-offset-2 hover:text-neon transition-colors"
							>
								Meer uitleg &rarr;
							</a>
							<a
								href="/modellen"
								class="text-xs text-indigo-400/60 underline decoration-indigo-400/20 underline-offset-2 hover:text-indigo-400 transition-colors"
							>
								Ondersteunde modellen &rarr;
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
							Europees AI-bedrijf gevestigd in Parijs met SOC 2 Type II en ISO 27001 certificering.
							Alle servers staan in de EU. Wordt gebruikt in API-modus voor het polijsten en opmaken
							van dialect.
						</p>
						<p class="mt-1.5 text-xs text-white/30">
							<a
								href="https://mistral.ai/trust/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>Privacy & Trust</a
							>
							·
							<a
								href="https://mistral.ai/terms/#data-processing-agreement"
								target="_blank"
								rel="noopener noreferrer"
								class="underline decoration-white/20 hover:decoration-white/40 transition-colors"
								>DPA</a
							>
						</p>
					</div>
				</div>
			</section>

			<!-- 11. Ondersteunde dialecten -->
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
							d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Ondersteunde dialecten
				</h2>
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
							Het dialect van Maastricht en directe omgeving. Beïnvloed door het Frans en Waals.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Zittesj</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Sittard en omgeving. Meer Duits-georiënteerd dan zuidelijker
							varianten.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Venloos</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Venlo en Noord-Limburg. Meer verwant aan het Brabants en Kleefs.
						</p>
					</div>
					<div class="rounded-xl border border-white/10 bg-white/5 p-4">
						<h3 class="text-sm font-medium text-white/70">Kirchroeadsj</h3>
						<p class="mt-1 text-xs text-white/40">
							Het dialect van Kerkrade en de Oostelijke Mijnstreek. Sterk Ripuarisch (verwant aan
							het Kölsch). Het meest afwijkend van standaard Nederlands.
						</p>
					</div>
				</div>
				<p class="mt-4 text-xs text-white/40">
					Mis je jouw dialect? BABL is een experimenteel project dat continu wordt uitgebreid.
					Nieuwe varianten worden toegevoegd op basis van vraag en beschikbare taaldata.
				</p>
			</section>

			<!-- 12. Tips voor het beste resultaat -->
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
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
					Tips voor het beste resultaat
				</h2>
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
								BABL toont de ruwe transcriptie naast het gepolijste en opgemaakte resultaat.
								Vergelijk ze — soms vertaalt het model een woord verkeerd of voegt het iets toe. Jij
								blijft de eindredacteur.
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

			<!-- 13. Toegankelijkheid -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90 flex items-center gap-2">
					<svg
						class="h-5 w-5 shrink-0 text-neon/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 8a1 1 0 100-2 1 1 0 000 2zm-2 3h4m-2 0v5m-2 0h4"
						/>
					</svg>
					Toegankelijkheid
				</h2>
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

			<!-- 14. Roadmap & experimenteel -->
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
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					Roadmap & experimenteel
				</h2>
				<p class="mb-4 text-sm text-white/60">
					BABL is een experimenteel project in actieve ontwikkeling. Sommige dingen werken goed,
					andere nog niet. Hier een eerlijk overzicht:
				</p>
				<div class="space-y-3">
					<div class="rounded-xl border border-neon/15 bg-neon/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-neon/80">Wat werkt goed</h3>
						<ul class="space-y-1.5 text-xs text-white/50">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Transcriptie van duidelijk gesproken Limburgs naar Nederlands
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Polijsten en opmaken van ruwe transcripties tot leesbare verslagen
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Sprekersherkenning bij meerdere gesprekspartners
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Live transcriptie in API-modus
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon/50"></span>
								Privacy-bewuste verwerking (lokaal of EU-only)
							</li>
						</ul>
					</div>
					<div class="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-amber-400/80">Bekende beperkingen</h3>
						<ul class="space-y-1.5 text-xs text-white/50">
							<li class="flex items-start gap-2">
								<span class="text-amber-400/60">!</span>
								Sterk accent of snel spreken leidt tot meer fouten
							</li>
							<li class="flex items-start gap-2">
								<span class="text-amber-400/60">!</span>
								Korte opnames (&lt;5 seconden) geven onbetrouwbare resultaten — het model heeft context
								nodig en kan bij te weinig audio gaan hallucineren
							</li>
							<li class="flex items-start gap-2">
								<span class="text-amber-400/60">!</span>
								Geen offline API-modus — API vereist internetverbinding
							</li>
							<li class="flex items-start gap-2">
								<span class="text-amber-400/60">!</span>
								Lokale modus werkt alleen op desktop met voldoende hardware
							</li>
						</ul>
					</div>
					<div class="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4">
						<h3 class="mb-2 text-sm font-semibold text-indigo-400/80">Wat we willen toevoegen</h3>
						<ul class="space-y-1.5 text-xs text-white/50">
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Meer dialecten (Brabants, Zeeuws, Fries)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Betere dialectherkenning bij sterk accent
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Export-opties (PDF, Word, ondertitelingsformaat)
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500/50"></span>
								Batch-verwerking (meerdere bestanden tegelijk)
							</li>
						</ul>
					</div>
				</div>
				<div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
					<p class="text-sm text-white/60">
						Mis je iets? Heb je een idee? Laat het ons weten — zie
						<span class="text-white/80">Open source & contact</span> hieronder.
					</p>
				</div>
			</section>

			<!-- 15. Open source & contact -->
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
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/>
					</svg>
					Open source & contact
				</h2>
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
			<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/30">
				<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
				<span class="text-white/10">|</span>
				<a href="/cookies" class="hover:text-white/60 transition-colors">Cookies</a>
				<span class="text-white/10">|</span>
				<a href="/voorwaarden" class="hover:text-white/60 transition-colors">Voorwaarden</a>
				<span class="text-white/10">|</span>
				<a href="/begrippen" class="hover:text-white/60 transition-colors">Begrippen</a>
				<span class="text-white/10">|</span>
				<a href="/faq" class="hover:text-white/60 transition-colors">FAQ</a>
				<span class="text-white/10">|</span>
				<a href="/tech-talk" class="hover:text-white/60 transition-colors">Tech Talk</a>
			</div>
		</footer>
	</div>
</div>
