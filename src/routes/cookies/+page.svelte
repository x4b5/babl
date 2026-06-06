<svelte:head>
	<title>Cookiebeleid — BABL</title>
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
			<h1 class="text-2xl font-semibold text-white">Cookiebeleid</h1>
			<p class="mt-2 text-sm text-white/55">Laatste update: juni 2025</p>
		</header>

		<div class="space-y-6 animate-fade-in">
			<!-- Wat zijn cookies -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Wat zijn cookies?</h2>
				<p class="text-sm leading-relaxed text-white/70">
					Cookies zijn kleine tekstbestanden die door je browser worden opgeslagen wanneer je een
					website bezoekt. Ze helpen de website om te functioneren en om anonieme
					gebruiksstatistieken te verzamelen. BABL gebruikt alleen strikt noodzakelijke en
					analytische cookies — geen advertentie- of marketingcookies.
				</p>
			</section>

			<!-- Strikt noodzakelijk -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Strikt noodzakelijke cookies</h2>
				<p class="mb-4 text-sm text-white/70">
					Deze cookies zijn nodig om BABL te laten werken. Ze worden altijd geplaatst en vereisen
					geen toestemming.
				</p>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Naam</th>
								<th class="pb-2 pr-4 font-medium">Doel</th>
								<th class="pb-2 pr-4 font-medium">Opslag</th>
								<th class="pb-2 font-medium">Duur</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4">
									<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">babl_session</code>
								</td>
								<td class="py-2 pr-4">Authenticatie (sessie-identificatie)</td>
								<td class="py-2 pr-4">Cookie</td>
								<td class="py-2">30 dagen</td>
							</tr>
							<tr>
								<td class="py-2 pr-4">
									<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">babl_consent</code>
								</td>
								<td class="py-2 pr-4">Onthoudt je cookiekeuze</td>
								<td class="py-2 pr-4">localStorage</td>
								<td class="py-2">Permanent (tot verwijdering)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Analytische cookies -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Analytische cookies</h2>
				<p class="mb-4 text-sm text-white/70">
					Deze cookies worden alleen geplaatst als je daarvoor toestemming geeft. Ze worden gebruikt
					om anonieme gebruiksstatistieken te verzamelen via PostHog (EU-endpoint).
				</p>
				<div class="mb-4 rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-white/60">
					<ul class="space-y-1.5">
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
							Data wordt gehost op EU-servers (<code
								class="rounded bg-white/10 px-1.5 py-0.5 text-xs">eu.posthog.com</code
							>)
						</li>
					</ul>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/10 text-left text-xs text-white/55">
								<th class="pb-2 pr-4 font-medium">Naam</th>
								<th class="pb-2 pr-4 font-medium">Doel</th>
								<th class="pb-2 pr-4 font-medium">Opslag</th>
								<th class="pb-2 font-medium">Duur</th>
							</tr>
						</thead>
						<tbody class="text-white/60">
							<tr class="border-b border-white/5">
								<td class="py-2 pr-4">
									<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs">ph_*</code>
								</td>
								<td class="py-2 pr-4">PostHog anonieme sessie-identificatie</td>
								<td class="py-2 pr-4">Cookie + localStorage</td>
								<td class="py-2">1 jaar</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Toestemming beheren -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Toestemming beheren</h2>
				<p class="text-sm text-white/70">
					Je kunt je cookiekeuze op elk moment wijzigen via de knop "Cookie-instellingen" in de
					privacy-sectie onderaan de transcriptiepagina. Je kunt ook alle lokale data exporteren of
					verwijderen via diezelfde sectie.
				</p>
			</section>

			<!-- Meer informatie -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white">Meer informatie</h2>
				<p class="text-sm text-white/70">
					Lees onze
					<a
						href="/privacy"
						class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
					>
						privacyverklaring
					</a>
					voor meer details over hoe we met je gegevens omgaan, of bekijk de
					<a
						href="/voorwaarden"
						class="text-neon/70 underline decoration-neon/30 underline-offset-2 hover:text-neon transition-colors"
					>
						gebruiksvoorwaarden
					</a>.
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
				<a href="/privacy" class="hover:text-white/70 transition-colors"> Privacy </a>
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
