<script lang="ts">
	import {
		MODEL_FAMILIES,
		MODEL_FAMILY_LABELS,
		MODEL_FAMILY_DESCRIPTIONS,
		MODEL_RAM_INFO
	} from '$lib/stores/setup-wizard.svelte';

	const MODEL_ICONS: Record<string, string> = {
		qwen3: '/qwen.png',
		gemma3: '/gemma.png',
		mistral: '/mistral.png',
		phi4: '/phi.png',
		llama3: '/meta.png'
	};
</script>

<svelte:head>
	<title>Ondersteunde modellen — BABL</title>
</svelte:head>

<div class="bg-dark-gradient min-h-screen">
	<div class="floating-orb orb-violet"></div>
	<div class="floating-orb orb-indigo"></div>

	<div class="mx-auto max-w-4xl px-4 py-6 sm:py-16">
		<a
			href="/about"
			class="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Terug naar Over BABL
		</a>

		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Ondersteunde modellen</h1>
		<p class="text-sm text-white/50 mb-8 max-w-2xl">
			BABL werkt met meerdere open-source taalmodellen via
			<a
				href="https://ollama.com"
				target="_blank"
				rel="noopener"
				class="underline hover:text-white/70">Ollama</a
			>. Je kiest zelf welk model het beste past bij jouw hardware en taalbehoeften. Hieronder een
			overzicht van alle ondersteunde modellen met hun systeemvereisten.
		</p>

		<!-- Legend -->
		<div class="glass rounded-xl p-4 mb-6">
			<h2 class="text-sm font-medium text-white/70 mb-2">Grootte-varianten</h2>
			<div class="flex flex-wrap gap-4 text-xs text-white/50">
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2 w-2 rounded-full bg-emerald-400/60"></span>
					<span><strong class="text-white/70">Light</strong> — snel, laag geheugengebruik</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2 w-2 rounded-full bg-amber-400/60"></span>
					<span
						><strong class="text-white/70">Medium</strong> — balans tussen kwaliteit en snelheid</span
					>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="inline-block h-2 w-2 rounded-full bg-rose-400/60"></span>
					<span
						><strong class="text-white/70">Heavy</strong> — beste kwaliteit, meer geheugen nodig</span
					>
				</div>
			</div>
		</div>

		<!-- Model cards -->
		<div class="space-y-4">
			{#each Object.entries(MODEL_FAMILIES) as [familyId, variants]}
				{@const label = MODEL_FAMILY_LABELS[familyId]}
				{@const description = MODEL_FAMILY_DESCRIPTIONS[familyId]}
				{@const ramInfo = MODEL_RAM_INFO[familyId]}
				<div class="glass rounded-2xl p-5 sm:p-6">
					<div class="flex items-start justify-between gap-3 mb-4">
						<div class="flex items-start gap-3">
							{#if MODEL_ICONS[familyId]}
								<img
									src={MODEL_ICONS[familyId]}
									alt=""
									class="h-8 w-8 shrink-0 rounded-lg mt-0.5"
								/>
							{/if}
							<div>
								<h2 class="text-lg font-semibold text-white">{label}</h2>
								<p class="text-sm text-white/50 mt-0.5">{description}</p>
							</div>
						</div>
						{#if familyId === 'qwen3'}
							<span
								class="shrink-0 rounded-full bg-neon/20 px-2.5 py-0.5 text-xs font-medium text-neon"
							>
								Aanbevolen
							</span>
						{/if}
					</div>

					<!-- Variants table -->
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-white/10 text-left text-xs text-white/40">
									<th class="pb-2 pr-4 font-medium">Variant</th>
									<th class="pb-2 pr-4 font-medium">Model</th>
									<th class="pb-2 pr-4 font-medium">Opslag</th>
									<th class="pb-2 font-medium">RAM nodig</th>
								</tr>
							</thead>
							<tbody class="text-white/70">
								{#each Object.entries(variants) as [size, modelName]}
									{@const ram = ramInfo?.[size]}
									<tr class="border-b border-white/5 last:border-0">
										<td class="py-2 pr-4">
											<span class="inline-flex items-center gap-1.5">
												<span
													class="h-2 w-2 rounded-full {size === 'light'
														? 'bg-emerald-400/60'
														: size === 'medium'
															? 'bg-amber-400/60'
															: 'bg-rose-400/60'}"
												></span>
												<span class="capitalize">{size}</span>
											</span>
										</td>
										<td class="py-2 pr-4 font-mono text-xs text-white/50">{modelName}</td>
										<td class="py-2 pr-4 text-xs">{ram?.storage ?? '—'}</td>
										<td class="py-2 text-xs">{ram?.ram ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		</div>

		<!-- Tips section -->
		<div class="glass rounded-2xl p-5 sm:p-6 mt-6">
			<h2 class="text-base font-semibold text-white/70 mb-3 flex items-center gap-2">
				<svg
					class="h-4 w-4 text-amber-400/70"
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
				Tips voor het kiezen
			</h2>
			<ul class="space-y-2 text-sm text-white/50">
				<li class="flex items-start gap-2">
					<span class="mt-1 text-neon/60">&#8226;</span>
					<span
						><strong class="text-white/70">8 GB RAM of minder:</strong> Kies een <em>light</em> variant
						(Qwen 3 1.7b aanbevolen)</span
					>
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-1 text-neon/60">&#8226;</span>
					<span
						><strong class="text-white/70">16 GB RAM:</strong> <em>Medium</em> varianten draaien soepel
						(Qwen 3 4b aanbevolen)</span
					>
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-1 text-neon/60">&#8226;</span>
					<span
						><strong class="text-white/70">32 GB RAM of meer:</strong> Je kunt <em>heavy</em> varianten
						gebruiken voor beste kwaliteit</span
					>
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-1 text-neon/60">&#8226;</span>
					<span
						><strong class="text-white/70">Nederlands:</strong> Qwen 3 en Gemma 3 scoren het best op Nederlandse
						tekst</span
					>
				</li>
			</ul>
		</div>

		<!-- How to change model -->
		<div class="glass rounded-2xl p-5 sm:p-6 mt-4">
			<h2 class="text-base font-semibold text-white/70 mb-3">Model wijzigen</h2>
			<p class="text-sm text-white/50">
				Je kunt het actieve model wijzigen via de instellingen-wizard op de
				<a href="/transcribe" class="underline hover:text-white/70">hoofdpagina</a>. Klik op
				<em>"Tekst verbeteren instellen (Ollama)"</em> en kies een ander model en grootte.
			</p>
		</div>
	</div>
</div>
