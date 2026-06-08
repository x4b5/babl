<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let contentEl: HTMLDivElement | undefined = $state();

	function extractText(): string {
		if (!contentEl) return '';
		const clone = contentEl.cloneNode(true) as HTMLElement;
		// Remove SVG icons
		clone.querySelectorAll('svg').forEach((el) => el.remove());
		// Get text, clean up whitespace
		return (clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
	}

	function downloadTxt() {
		const text = `BABL — Tech Talk\nHoe BABL werkt onder de motorkap\n${'='.repeat(50)}\n\n${extractText()}`;
		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
		triggerDownload(blob, 'babl-tech-talk.txt');
	}

	function downloadDoc() {
		if (!contentEl) return;
		const html = `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>BABL — Tech Talk</title>
<style>
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 40px; }
  h1 { font-size: 24pt; color: #059669; margin-bottom: 4px; }
  h2 { font-size: 14pt; color: #1e293b; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 11pt; color: #374151; margin-top: 12px; }
  p { line-height: 1.6; margin: 6px 0; }
  code { font-family: Consolas, monospace; font-size: 10pt; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  td, th { border: 1px solid #e2e8f0; padding: 4px 8px; font-size: 10pt; text-align: left; }
  th { background: #f1f5f9; }
  .subtitle { color: #64748b; font-size: 10pt; margin-bottom: 24px; }
</style>
</head><body>
<h1>BABL — Tech Talk</h1>
<p class="subtitle">Hoe BABL werkt onder de motorkap</p>
${contentEl.innerHTML
	.replace(/<svg[\s\S]*?<\/svg>/g, '')
	.replace(/class="[^"]*"/g, '')
	.replace(/style="[^"]*"/g, '')}
</body></html>`;
		const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
		triggerDownload(blob, 'babl-tech-talk.doc');
	}

	function downloadPdf() {
		window.print();
	}

	function triggerDownload(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Tech Talk — Hoe BABL werkt onder de motorkap</title>
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
	<div class="floating-orb orb-fuchsia"></div>

	<div class="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:py-16">
		<header class="mb-10 text-center animate-fade-in">
			<a
				href="/"
				class="gradient-text mb-3 inline-block text-5xl font-normal tracking-tighter select-none hover:opacity-80 transition-opacity"
			>
				BABL
			</a>
			<h1 class="text-2xl font-semibold text-white/90">Tech Talk</h1>
			<p class="mt-2 text-sm text-white/40">Hoe BABL werkt onder de motorkap</p>

			<!-- Download buttons -->
			<div class="mt-5 flex items-center justify-center gap-3 print:hidden">
				<button
					onclick={downloadDoc}
					class="glass rounded-full px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
				>
					<svg
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Word
				</button>
				<button
					onclick={downloadPdf}
					class="glass rounded-full px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
				>
					<svg
						class="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
						/>
					</svg>
					PDF
				</button>
				<button
					onclick={downloadTxt}
					class="glass rounded-full px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
				>
					<svg
						class="h-3.5 w-3.5"
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
					Tekst
				</button>
			</div>
		</header>

		<div bind:this={contentEl} class="space-y-6 animate-fade-in">
			<!-- 1. De Pipeline -->
			<section class="glass-strong rounded-2xl p-6">
				<h2 class="mb-3 text-lg font-semibold text-white/90 flex items-center gap-2">
					<svg
						class="h-5 w-5 shrink-0 text-neon/70"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					De pipeline
				</h2>
				<p class="mb-4 text-sm leading-relaxed text-white/60">
					Elk stukje spraak doorloopt vier stappen. Bij elke stap kies je zelf: lokaal verwerken
					(alles op je eigen apparaat) of via een API (sneller, maar data reist naar een EU-server).
				</p>

				<!-- Pipeline flow diagram -->
				<div class="flex flex-col items-center gap-0">
					<!-- Microfoon -->
					<div class="rounded-lg bg-white/5 border border-white/10 px-5 py-3 text-center">
						<div class="text-xs text-white/40 mb-1">Browser</div>
						<div class="text-sm font-medium text-white/80">Microfoon / Bestand</div>
					</div>
					<div class="w-0.5 h-6 bg-white/10 mx-auto"></div>

					<!-- Splitsing -->
					<div class="w-full grid grid-cols-2 gap-3">
						<!-- Lokaal -->
						<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
							<div class="text-xs text-emerald-400/60 mb-1">Lokaal</div>
							<div class="text-sm font-medium text-emerald-400/80">MLX-Whisper</div>
							<div class="text-xs text-white/30 mt-1">large-v3, Apple Silicon</div>
						</div>
						<!-- API -->
						<div class="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-center">
							<div class="text-xs text-indigo-400/60 mb-1">API</div>
							<div class="text-sm font-medium text-indigo-400/80">AssemblyAI</div>
							<div class="text-xs text-white/30 mt-1">Universal-2, Dublin</div>
						</div>
					</div>
					<div class="w-0.5 h-6 bg-white/10 mx-auto"></div>

					<!-- Ruwe tekst -->
					<div class="rounded-lg bg-white/5 border border-white/10 px-5 py-3 text-center w-full">
						<div class="text-sm font-medium text-white/80">Ruwe transcriptie</div>
						<div class="text-xs text-white/30 mt-1">Dialect, ongepolijst</div>
					</div>
					<div class="w-0.5 h-6 bg-white/10 mx-auto"></div>

					<!-- Polijsten splitsing -->
					<div class="w-full grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
							<div class="text-xs text-emerald-400/60 mb-1">Lokaal</div>
							<div class="text-sm font-medium text-emerald-400/80">Ollama / Gemma3</div>
							<div class="text-xs text-white/30 mt-1">4B of 12B</div>
						</div>
						<div class="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-center">
							<div class="text-xs text-indigo-400/60 mb-1">API</div>
							<div class="text-sm font-medium text-indigo-400/80">Mistral AI</div>
							<div class="text-xs text-white/30 mt-1">small / large, EU</div>
						</div>
					</div>
					<div class="w-0.5 h-6 bg-white/10 mx-auto"></div>

					<!-- Resultaat -->
					<div class="rounded-lg bg-white/5 border border-white/10 px-5 py-3 text-center">
						<div class="text-sm font-medium text-white/80">Gepolijst Nederlands</div>
						<div class="text-xs text-white/30 mt-1">Leesbaar, gecorrigeerd</div>
					</div>
				</div>

				<div class="mt-4 flex items-center gap-4 text-xs text-white/30">
					<div class="flex items-center gap-1.5">
						<div class="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
						Lokaal (op jouw apparaat)
					</div>
					<div class="flex items-center gap-1.5">
						<div class="w-2.5 h-2.5 rounded-full bg-indigo-500/40"></div>
						API (EU datacenter)
					</div>
				</div>
			</section>

			<!-- 2. Audio Processing -->
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
							d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
						/>
					</svg>
					Audio processing
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Zodra je op de opnameknop drukt, vangt de browser je stem op via de
					<span class="font-mono text-xs text-white/50">MediaRecorder API</span>. De waveform die je
					ziet? Dat is de <span class="font-mono text-xs text-white/50">Web Audio API</span> die realtime
					de geluidsgolven tekent.
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Downsampling</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Whisper verwacht audio in 16kHz mono WAV formaat. De browser neemt op in hogere
							kwaliteit (meestal 44.1kHz of 48kHz stereo), dus BABL downsamplet naar 16kHz mono
							voordat de audio naar het model wordt gestuurd. Dit verkleint het bestand met ~80%.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Segmentering</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Lange opnames worden opgesplitst in segmenten van maximaal 30 seconden. Elk segment
							wordt apart naar Whisper gestuurd, en de resultaten worden achtereenvolgens gestreamd
							via SSE (Server-Sent Events).
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Live modus</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Bij live opname wordt audio incrementeel verwerkt. BABL stuurt alleen nieuwe chunks
							naar het model, met een overlap van 3 seconden voor context. Een
							<span class="font-mono text-white/40">offset</span> parameter zorgt dat alleen segmenten
							vanaf een bepaald tijdstip worden teruggegeven — zo voorkom je duplicaten in de output.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Bestandsupload</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Naast live opname kun je ook een audiobestand uploaden. Maximale bestandsgrootte:
							<span class="font-mono text-white/40">500 MB</span>. Het bestand wordt in chunks van
							8192 bytes naar de server gestreamd om RAM-gebruik laag te houden. Na transcriptie
							wordt het tijdelijke bestand automatisch opgeruimd.
						</p>
					</div>
				</div>

				<!-- Specificaties tabel -->
				<div class="mt-4 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-3">Specificaties</h3>
					<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
						<div class="text-white/40">Formaat naar Whisper</div>
						<div class="font-mono text-white/50">16kHz mono WAV</div>
						<div class="text-white/40">Segment duur</div>
						<div class="font-mono text-white/50">max 30 seconden</div>
						<div class="text-white/40">Max bestandsgrootte</div>
						<div class="font-mono text-white/50">500 MB</div>
						<div class="text-white/40">Upload chunk size</div>
						<div class="font-mono text-white/50">8192 bytes</div>
						<div class="text-white/40">Live overlap</div>
						<div class="font-mono text-white/50">3 seconden</div>
					</div>
				</div>
			</section>

			<!-- 3. Whisper Spraakherkenning -->
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
							d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
						/>
					</svg>
					Whisper spraakherkenning
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Whisper is OpenAI's spraakherkenningsmodel. BABL gebruikt de
					<span class="font-mono text-xs text-white/50">large-v3</span>
					variant via MLX (geoptimaliseerd voor Apple Silicon) of AssemblyAI's Universal-2 model.
				</p>

				<div class="rounded-lg bg-white/5 border border-white/10 p-4 mb-3">
					<h3 class="text-sm font-medium text-white/70 mb-2">De dialect-truc</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-3">
						Whisper is niet getraind op Limburgs dialect. Toch krijgen we goede resultaten door twee
						technieken te combineren:
					</p>
					<div class="space-y-2">
						<div class="flex items-start gap-2">
							<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
							<div>
								<span class="text-xs font-medium text-white/60">initial_prompt</span>
								<span class="text-xs text-white/40">
									— Een voorbeeldzin in de gekozen dialectregio als context. Dit stuurt Whisper
									richting het juiste taalniveau.
								</span>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
							<div>
								<span class="text-xs font-medium text-white/60">hotwords</span>
								<span class="text-xs text-white/40">
									— Veelvoorkomende dialectwoorden per regio die Whisper een hogere score geeft.
									Denk aan "geer", "hej", "veer", "waor".
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">5 dialectregio's</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-2">
						Elke regio heeft eigen dialectkenmerken, voorbeeldzinnen en hotwords:
					</p>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
						<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2 text-center">
							<div class="text-xs font-medium text-white/60">Maastrichts</div>
						</div>
						<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2 text-center">
							<div class="text-xs font-medium text-white/60">Venloos</div>
						</div>
						<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2 text-center">
							<div class="text-xs font-medium text-white/60">Sittards</div>
						</div>
						<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2 text-center">
							<div class="text-xs font-medium text-white/60">Heerlens</div>
						</div>
						<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2 text-center">
							<div class="text-xs font-medium text-white/60">Roermonds</div>
						</div>
					</div>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">Temperature cascade</h3>
					<p class="text-xs leading-relaxed text-white/50">
						Whisper probeert drie temperaturen achter elkaar:
						<span class="font-mono text-white/40">(0.0, 0.2, 0.4)</span>. Bij temperatuur 0 is het
						model heel zeker maar soms vastgelopen; bij hogere temperaturen wordt het creatiever.
						Het beste resultaat wint. Dit helpt vooral bij onduidelijke audio of onbekende woorden.
					</p>
				</div>

				<div class="mt-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
					<h3 class="text-sm font-medium text-indigo-400/70 mb-2">Hybrid modus (AssemblyAI)</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-3">
						In API-modus gebruikt BABL een slim trucje: AssemblyAI doet de initiële transcriptie en
						levert sprekertijdstempels. Vervolgens wordt per uitspraak
						<span class="font-medium text-white/60">opnieuw</span> getranscribeerd met lokale Whisper
						+ dialect-specifieke hints. Zo combineer je AssemblyAI's sprekersherkenning met Whisper's
						dialectkennis.
					</p>
					<div class="space-y-2">
						<div class="flex items-start gap-2">
							<div class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0"></div>
							<div>
								<span class="text-xs font-medium text-white/60">word_boost</span>
								<span class="text-xs text-white/40">
									— Dialectwoordenlijst meegegeven aan AssemblyAI met boost
									<span class="font-mono">"high"</span> voor betere herkenning.
								</span>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0"></div>
							<div>
								<span class="text-xs font-medium text-white/60">custom_spelling</span>
								<span class="text-xs text-white/40">
									— Regio-specifieke spellingvarianten zodat het model weet dat "geer" en "gier"
									hetzelfde woord zijn.
								</span>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0"></div>
							<div>
								<span class="text-xs font-medium text-white/60">PII-redactie</span>
								<span class="text-xs text-white/40">
									— Namen, telefoonnummers, e-mails, geboortedata en medische termen worden
									automatisch geredacteerd (bijv.
									<span class="font-mono">[PERSON_NAME]</span>).
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 4. Hallucinatie-detectie -->
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
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					Hallucinatie-detectie
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Whisper kan "hallucineren" — tekst verzinnen die niet is gezegd. Dit gebeurt vooral bij
					stilte, achtergrondgeluid, of aan het einde van een segment. BABL heeft meerdere
					verdedigingslagen:
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Phantom strings</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-3">
							Een lijst van bekende hallucinaties die Whisper herhaaldelijk produceert. Elke output
							wordt tegen deze lijst gecontroleerd en automatisch gefilterd:
						</p>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2">
								<div class="text-xs text-white/30 mb-1">Nederlands</div>
								<div class="font-mono text-xs text-white/45 space-y-0.5">
									<div>"Ondertiteling door..."</div>
									<div>"Bewerkt door..."</div>
								</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-2">
								<div class="text-xs text-white/30 mb-1">Engels</div>
								<div class="font-mono text-xs text-white/45 space-y-0.5">
									<div>"Thank you for watching"</div>
									<div>"Please subscribe"</div>
								</div>
							</div>
						</div>
						<p class="mt-2 text-xs text-white/35">
							Eenwoordige phantoms (zoals "you") worden alleen verwijderd als ze het hele segment
							zijn — anders zouden legitieme woorden verloren gaan.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Repetitie-detectie</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Als Whisper <span class="font-medium text-white/60">5 of meer</span> opeenvolgende identieke
							woorden produceert, is dat vrijwel zeker een hallucinatie. BABL detecteert herhalingen en
							reduceert ze tot maximaal 2 voorkomens. Dit is een bewuste keuze: sommige echte spraak herhaalt
							een woord, maar 5+ keer is altijd een model-artefact.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Conservative thresholds</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Segmenten met extreem lage of hoge confidence scores worden als verdacht gemarkeerd.
							Liever een stukje missen dan onzin tonen — het principe is conservatief filteren.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Waar hallucinaties ontstaan</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Whisper hallucineert het vaakst in drie situaties:
						</p>
						<div class="space-y-1.5">
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									<span class="font-medium text-white/50">Stilte</span> — het model vult stilte op met
									eerder gehoorde zinnen of YouTube-achtige phrases.
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									<span class="font-medium text-white/50">Segment-einde</span> — de laatste seconden van
									een 30s-segment zijn het kwetsbaarst.
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									<span class="font-medium text-white/50">Achtergrondgeluid</span> — muziek, verkeer of
									andere niet-spraak geluiden triggeren het model.
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 5. Sprekersherkenning -->
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
					Sprekersherkenning
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Bij interviews en vergaderingen is het essentieel om te weten wie wat zegt. BABL gebruikt
					hiervoor <span class="font-mono text-xs text-white/50">pyannote</span> voor diarisatie (het
					toewijzen van spraakfragmenten aan sprekers).
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Hoe werkt het?</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Pyannote analyseert de volledige audio en detecteert wanneer een nieuwe spreker
							begint. Dit levert tijdstempels op: "Spreker A praat van 0:00 tot 0:15, Spreker B van
							0:16 tot 0:30".
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Merge met Whisper</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Whisper levert tekst met tijdstempels, pyannote levert sprekers met tijdstempels. BABL
							combineert beide: elk woord krijgt een spreekerlabel door de tijdstempels te matchen.
							Bij overlapping wint de spreker met het langste segment.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Speaker labels</h3>
						<p class="text-xs leading-relaxed text-white/50">
							De output toont labels als "Spreker 1", "Spreker 2" etc. De gebruiker kan deze later
							hernoemen naar echte namen. Het model weet niet wie de sprekers zijn — het herkent
							alleen dat het verschillende personen zijn.
						</p>
					</div>
				</div>
			</section>

			<!-- 6. Prompt Engineering -->
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
					Prompt engineering
				</h2>
				<p class="mb-4 text-sm leading-relaxed text-white/60">
					Het polijsten van dialect naar standaard Nederlands is geen simpele vertaling. Het LLM
					(Gemma3 of Mistral) krijgt een zorgvuldig opgebouwde prompt. Hier is de anatomie:
				</p>

				<!-- Prompt anatomy diagram -->
				<div class="space-y-1">
					<div class="rounded-t-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
						<div class="text-xs font-medium text-indigo-400/70 mb-1">System prompt</div>
						<p class="text-xs text-white/40">
							Basisinstructies: "Je bent een expert in Limburgse dialecten. Corrigeer naar standaard
							Nederlands zonder de betekenis te veranderen."
						</p>
					</div>
					<div class="bg-emerald-500/10 border-x border-emerald-500/20 px-4 py-3">
						<div class="text-xs font-medium text-emerald-400/70 mb-1">Glossary</div>
						<p class="text-xs text-white/40">
							Woordenlijst met dialectwoorden en hun standaard Nederlandse equivalent. Wordt
							automatisch geladen op basis van de gekozen regio.
						</p>
					</div>
					<div class="bg-amber-500/10 border-x border-amber-500/20 px-4 py-3">
						<div class="text-xs font-medium text-amber-400/70 mb-1">Few-shot voorbeelden</div>
						<p class="text-xs text-white/40">
							2-3 voorbeelden van dialect-input met de verwachte output. Dit leert het model het
							gewenste gedrag.
						</p>
					</div>
					<div class="bg-purple-500/10 border-x border-purple-500/20 px-4 py-3">
						<div class="text-xs font-medium text-purple-400/70 mb-1">Modus-instructies</div>
						<p class="text-xs text-white/40">
							Afhankelijk van de gekozen modus: "samenvatting" (beknopt), "verslaglegging"
							(volledig), of "woordelijk" (zo dicht mogelijk bij origineel).
						</p>
					</div>
					<div class="bg-white/5 border-x border-white/10 px-4 py-3">
						<div class="text-xs font-medium text-white/50 mb-1">Optioneel onderwerp</div>
						<p class="text-xs text-white/40">
							Extra context die de gebruiker kan meegeven, zoals "vergadering over budgetplannen" of
							"interview met wethouder". Helpt het model met jargon en naamherkenning.
						</p>
					</div>
					<div class="rounded-b-lg bg-white/5 border border-white/10 px-4 py-3">
						<div class="text-xs font-medium text-white/50 mb-1">Ruwe transcriptie</div>
						<p class="text-xs text-white/40">De eigenlijke tekst om te polijsten.</p>
					</div>
				</div>

				<div class="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
					<h3 class="text-sm font-medium text-emerald-400/70 mb-2">
						Twee-staps polijsten (Limburgs)
					</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-2">
						Voor Limburgse dialecten draait een extra eerste pass:
					</p>
					<div class="space-y-1.5">
						<div class="flex items-start gap-2">
							<div class="mt-0.5 text-xs font-mono text-emerald-400/50 shrink-0">1.</div>
							<span class="text-xs text-white/40">
								<span class="font-medium text-white/50">Cleanup pass</span> — Dialectspelling
								corrigeren, stopwoorden ("uhm", "dus") verwijderen. Vertaalt nog
								<span class="font-medium">niet</span> naar Nederlands.
							</span>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-0.5 text-xs font-mono text-emerald-400/50 shrink-0">2.</div>
							<span class="text-xs text-white/40">
								<span class="font-medium text-white/50">Polish pass</span> — Opgeschoonde tekst wordt
								opnieuw gechunkt en met het volledige prompt (glossary + few-shot) vertaald naar standaard
								Nederlands.
							</span>
						</div>
					</div>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">Chunking & parallellisatie</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-3">
						Lange teksten worden opgesplitst in chunks van maximaal
						<span class="font-mono text-white/40">400 woorden</span> met een overlap van
						<span class="font-mono text-white/40">75 woorden</span>. De overlap bewaart context
						zodat zinnen die over een chunk-grens vallen niet hun betekenis verliezen.
					</p>
					<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
						<div class="text-white/40">Max chunk grootte</div>
						<div class="font-mono text-white/50">400 woorden</div>
						<div class="text-white/40">Overlap</div>
						<div class="font-mono text-white/50">75 woorden</div>
						<div class="text-white/40">Splitsing op</div>
						<div class="font-mono text-white/50">.!?... (zinsgrens)</div>
						<div class="text-white/40">Max parallel (Ollama)</div>
						<div class="font-mono text-white/50">3 (semaphore)</div>
						<div class="text-white/40">Volledige context</div>
						<div class="font-mono text-white/50">&le; 5 chunks</div>
					</div>
					<p class="mt-2 text-xs text-white/35">
						Bij 5 of minder chunks wordt de volledige tekst meegegeven als context. Bij langere
						teksten krijgt elk chunk alleen de eigen tekst om tokens te besparen.
					</p>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">Model fallback</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-2">
						Als het gevraagde model niet beschikbaar is (bijv. te weinig VRAM), schakelt BABL
						automatisch over naar een kleiner model:
					</p>
					<div class="font-mono text-xs bg-white/5 rounded-lg p-3 text-white/40">
						requested model &rarr; heavy &rarr; medium &rarr; light
					</div>
					<p class="mt-2 text-xs text-white/35">
						Temperature is vast op
						<span class="font-mono text-white/40">0.5</span> — een balans tussen consistent en
						creatief. Token-limiet per chunk:
						<span class="font-mono text-white/40">max(512, woordaantal &times; 2)</span>.
					</p>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">JSON output & 3-tier fallback</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-2">
						Het model moet gestructureerde JSON teruggeven met velden als
						<span class="font-mono text-white/40">original</span>,
						<span class="font-mono text-white/40">polished</span>,
						<span class="font-mono text-white/40">confidence</span> en
						<span class="font-mono text-white/40">applied_rules</span>. Maar LLMs zijn niet altijd
						betrouwbaar met JSON. Daarom:
					</p>
					<div class="space-y-1.5">
						<div class="flex items-start gap-2">
							<div class="mt-0.5 text-xs font-mono text-white/30 shrink-0">1.</div>
							<span class="text-xs text-white/40">
								Directe <span class="font-mono text-white/50">JSON.parse()</span>
							</span>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-0.5 text-xs font-mono text-white/30 shrink-0">2.</div>
							<span class="text-xs text-white/40">
								Regex: zoek
								<span class="font-mono text-white/50">{'{'} ... {'}'}</span> ergens in de output
							</span>
						</div>
						<div class="flex items-start gap-2">
							<div class="mt-0.5 text-xs font-mono text-white/30 shrink-0">3.</div>
							<span class="text-xs text-white/40">
								Fallback: gebruik de ruwe output als platte tekst
							</span>
						</div>
					</div>
				</div>
			</section>

			<!-- 7. Streaming Architectuur -->
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
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Streaming architectuur
				</h2>
				<p class="mb-4 text-sm leading-relaxed text-white/60">
					BABL toont resultaten zodra ze beschikbaar zijn — je hoeft niet te wachten tot alles klaar
					is. Hiervoor worden twee streaming-protocollen gebruikt:
				</p>

				<div class="grid sm:grid-cols-2 gap-3 mb-4">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-emerald-400/70 mb-2">SSE (Server-Sent Events)</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Eenrichtingsverkeer: de server stuurt events naar de browser. Gebruikt voor
							transcriptie en polijsten.
						</p>
						<div class="font-mono text-xs bg-white/5 rounded-lg p-3 text-white/40 space-y-1">
							<div><span class="text-emerald-400/50">event:</span> transcript</div>
							<div><span class="text-emerald-400/50">data:</span> {'{'}"text": "Hallo..."{'}'}</div>
							<div class="pt-1"><span class="text-emerald-400/50">event:</span> done</div>
						</div>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-indigo-400/70 mb-2">WebSocket</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Tweerichtingsverkeer: browser en server praten tegelijk. Gebruikt voor real-time
							AssemblyAI streaming.
						</p>
						<div class="font-mono text-xs bg-white/5 rounded-lg p-3 text-white/40 space-y-1">
							<div><span class="text-indigo-400/50">send:</span> audio bytes</div>
							<div><span class="text-indigo-400/50">recv:</span> partial transcript</div>
							<div><span class="text-indigo-400/50">recv:</span> final transcript</div>
						</div>
					</div>
				</div>

				<!-- Sequence diagram -->
				<div class="rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-3">Communicatiestroom</h3>
					<div class="space-y-0">
						<!-- Header -->
						<div class="grid grid-cols-3 gap-2 mb-2">
							<div
								class="text-center text-xs font-medium text-white/50 border-b border-white/10 pb-2"
							>
								Browser
							</div>
							<div
								class="text-center text-xs font-medium text-white/50 border-b border-white/10 pb-2"
							>
								FastAPI
							</div>
							<div
								class="text-center text-xs font-medium text-white/50 border-b border-white/10 pb-2"
							>
								Model
							</div>
						</div>
						<!-- Arrows -->
						<div class="space-y-2 text-xs">
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-right text-white/40">audio blob</div>
								<div class="text-center text-emerald-400/40">&rarr;</div>
								<div class="text-white/30"></div>
							</div>
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-white/30"></div>
								<div class="text-right text-white/40">WAV 16kHz</div>
								<div class="text-left text-emerald-400/40">&rarr;</div>
							</div>
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-white/30"></div>
								<div class="text-left text-indigo-400/40">&larr;</div>
								<div class="text-white/40">tokens</div>
							</div>
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-right text-white/40">SSE events</div>
								<div class="text-center text-indigo-400/40">&larr;</div>
								<div class="text-white/30"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">WebSocket heartbeat</h3>
					<p class="text-xs leading-relaxed text-white/50">
						De WebSocket-verbinding met AssemblyAI gebruikt een heartbeat-protocol: elke <span
							class="font-mono text-white/40">15 seconden</span
						>
						een ping, en als er binnen <span class="font-mono text-white/40">30 seconden</span> geen pong
						komt, wordt de verbinding als dood beschouwd en gesloten. Dit voorkomt zombie-connecties die
						geheugen lekken.
					</p>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-2">Retry-logica (exponential backoff)</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-3">
						API-aanroepen naar Mistral en AssemblyAI kunnen falen door rate limits of serverfouten.
						BABL probeert het opnieuw met exponential backoff:
					</p>
					<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
						<div class="text-white/40">Max pogingen</div>
						<div class="font-mono text-white/50">5</div>
						<div class="text-white/40">Backoff formule</div>
						<div class="font-mono text-white/50">min(30s, 2^n) + random(0-2s)</div>
						<div class="text-white/40">Retry-After header</div>
						<div class="font-mono text-white/50">gerespecteerd</div>
						<div class="text-white/40">Retrybare fouten</div>
						<div class="font-mono text-white/50">429, 502, 503</div>
					</div>
				</div>

				<div class="mt-3 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-3">SSE event types</h3>
					<div class="font-mono text-xs bg-white/5 rounded-lg p-3 text-white/40 space-y-1">
						<div>
							<span class="text-emerald-400/50">progress</span> &mdash; {'{'}"chunk": 1,
							"total_chunks": 5{'}'}
						</div>
						<div>
							<span class="text-emerald-400/50">segment</span>&nbsp; &mdash; {'{'}"text": "...",
							"speaker": "A"{'}'}
						</div>
						<div>
							<span class="text-emerald-400/50">token</span>&nbsp;&nbsp;&nbsp; &mdash; {'{'}"t":
							"woord"{'}'}
						</div>
						<div>
							<span class="text-emerald-400/50">done</span>&nbsp;&nbsp;&nbsp;&nbsp; &mdash;
							verwerking compleet
						</div>
						<div>
							<span class="text-red-400/50">error</span>&nbsp;&nbsp;&nbsp; &mdash; {'{'}"message":
							"...", "code": "..."{'}'}
						</div>
					</div>
				</div>
			</section>

			<!-- 8. De Stack -->
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
							d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
						/>
					</svg>
					De stack
				</h2>
				<p class="mb-4 text-sm leading-relaxed text-white/60">
					BABL draait op drie lagen. Wat waar draait hangt af van je keuze: lokaal of API.
				</p>

				<!-- Stack diagram: 3 horizontal bands -->
				<div class="space-y-2">
					<!-- Browser -->
					<div class="rounded-lg border border-white/10 bg-white/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2 h-2 rounded-full bg-blue-400/60"></div>
							<h3 class="text-sm font-medium text-white/70">Browser</h3>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								SvelteKit 5
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Tailwind 4
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Web Audio API
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								MediaRecorder
							</div>
						</div>
					</div>

					<!-- Cloud / Vercel -->
					<div class="rounded-lg border border-indigo-500/15 bg-indigo-500/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2 h-2 rounded-full bg-indigo-400/60"></div>
							<h3 class="text-sm font-medium text-white/70">Cloud (API modus)</h3>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Vercel
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								AssemblyAI (Dublin)
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Mistral AI (EU)
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								PostHog (EU)
							</div>
						</div>
					</div>

					<!-- Lokaal -->
					<div class="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2 h-2 rounded-full bg-emerald-400/60"></div>
							<h3 class="text-sm font-medium text-white/70">Lokaal (jouw apparaat)</h3>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								FastAPI (Python)
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								MLX-Whisper
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Ollama / Gemma3
							</div>
							<div
								class="rounded-md bg-white/5 border border-white/8 px-2 py-1.5 text-center text-xs text-white/50"
							>
								Pyannote
							</div>
						</div>
					</div>
				</div>

				<!-- Model registry -->
				<div class="mt-4 rounded-lg bg-white/5 border border-white/10 p-4">
					<h3 class="text-sm font-medium text-white/70 mb-3">Model registry (lokaal)</h3>
					<p class="text-xs leading-relaxed text-white/50 mb-3">
						BABL ondersteunt meerdere model-families via Ollama. Elk heeft drie gewichtsklassen:
					</p>
					<div class="overflow-x-auto">
						<table class="w-full text-xs">
							<thead>
								<tr class="text-white/40 border-b border-white/10">
									<th class="text-left py-2 pr-3 font-medium">Familie</th>
									<th class="text-left py-2 px-3 font-medium">Light</th>
									<th class="text-left py-2 px-3 font-medium">Medium</th>
									<th class="text-left py-2 pl-3 font-medium">Heavy</th>
								</tr>
							</thead>
							<tbody class="font-mono text-white/50">
								<tr class="border-b border-white/5">
									<td class="py-1.5 pr-3 text-emerald-400/60 font-sans">Qwen3</td>
									<td class="py-1.5 px-3">1.7b</td>
									<td class="py-1.5 px-3">4b</td>
									<td class="py-1.5 pl-3">14b</td>
								</tr>
								<tr class="border-b border-white/5">
									<td class="py-1.5 pr-3 text-emerald-400/60 font-sans">Gemma3</td>
									<td class="py-1.5 px-3">1b</td>
									<td class="py-1.5 px-3">4b</td>
									<td class="py-1.5 pl-3">12b</td>
								</tr>
								<tr class="border-b border-white/5">
									<td class="py-1.5 pr-3 text-emerald-400/60 font-sans">Mistral</td>
									<td class="py-1.5 px-3">7b</td>
									<td class="py-1.5 px-3">nemo</td>
									<td class="py-1.5 pl-3">small</td>
								</tr>
								<tr class="border-b border-white/5">
									<td class="py-1.5 pr-3 text-emerald-400/60 font-sans">Phi4</td>
									<td class="py-1.5 px-3">mini</td>
									<td class="py-1.5 px-3">mini</td>
									<td class="py-1.5 pl-3">phi4</td>
								</tr>
								<tr>
									<td class="py-1.5 pr-3 text-emerald-400/60 font-sans">Llama3</td>
									<td class="py-1.5 px-3">1b</td>
									<td class="py-1.5 px-3">3b</td>
									<td class="py-1.5 pl-3">3b</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="mt-2 text-xs text-white/35">
						Bij opstarten stuurt BABL een dummy-verzoek naar Ollama om het actieve model alvast in
						VRAM te laden (warmup). Zo is de eerste echte aanvraag sneller.
					</p>
				</div>
			</section>

			<!-- 9. Kwaliteitscontrole -->
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
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Kwaliteitscontrole
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Hoe meet je of spraakherkenning goed werkt? En hoe verbeter je het? BABL heeft meerdere
					kwaliteitsmechanismen:
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">WER & CER</h3>
						<p class="text-xs leading-relaxed text-white/50">
							<span class="font-medium text-white/60">Word Error Rate</span> en
							<span class="font-medium text-white/60">Character Error Rate</span> zijn de standaard meetlatten
							voor spraakherkenning. WER telt het percentage woorden dat verschilt van de referentie (invoegingen,
							verwijderingen, vervangingen). CER doet hetzelfde op karakterniveau — handiger voor dialect
							waar spellingsvariatie groot is.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Error patterns</h3>
						<p class="text-xs leading-relaxed text-white/50">
							BABL analyseert welke woorden consistent fout worden herkend. Als "gemeenteraad"
							steeds "gemeente raad" wordt, kan dat woord aan de glossary of hotwords worden
							toegevoegd.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Glossary-suggesties</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Op basis van foutpatronen suggereert het systeem nieuwe woorden voor de glossary. Dit
							is een feedbackloop: meer gebruik leidt tot betere herkenning.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Prompt versioning</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Elke versie van de system prompt wordt bijgehouden. Als een nieuwe versie slechtere
							resultaten geeft, kan er worden teruggedraaid. Prompt engineering is iteratief werk.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Kwaliteitsmodi</h3>
						<div class="mt-2 grid grid-cols-2 gap-2">
							<div class="rounded-md bg-white/5 border border-white/8 p-3">
								<div class="text-xs font-medium text-emerald-400/60 mb-1">Light</div>
								<div class="text-xs text-white/40">Gemma3 4B / Mistral Small</div>
								<div class="text-xs text-white/30 mt-1">Sneller, minder nauwkeurig</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 p-3">
								<div class="text-xs font-medium text-indigo-400/60 mb-1">Medium</div>
								<div class="text-xs text-white/40">Gemma3 12B / Mistral Large</div>
								<div class="text-xs text-white/30 mt-1">Langzamer, nauwkeuriger</div>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">
							Gebruikerscorrecties (feedback loop)
						</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Gebruikers kunnen gepolijste tekst handmatig corrigeren. Deze correcties worden
							anoniem gelogd (JSONL) en geanalyseerd:
						</p>
						<div class="space-y-1.5">
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									Correctiepatronen worden herkend en voorgesteld als glossary-updates
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									Prompt-versie wordt meegelogd voor regressie-detectie
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									Nooit de ruwe transcriptie-inhoud — alleen de diff
								</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">WER-aggregatie</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-3">
							Kwaliteitsmetrieken worden samengevat per sessie en per dialectregio:
						</p>
						<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
							<div class="text-white/40">Gemiddelde WER</div>
							<div class="font-mono text-white/50">mean over alle samples</div>
							<div class="text-white/40">Mediaan (p50)</div>
							<div class="font-mono text-white/50">50e percentiel</div>
							<div class="text-white/40">Uitschieters (p95)</div>
							<div class="font-mono text-white/50">95e percentiel</div>
							<div class="text-white/40">Per regio</div>
							<div class="font-mono text-white/50">apart berekend</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 10. Privacy by Design -->
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
					Privacy by design
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Privacy is geen feature die achteraf is toegevoegd — het is een ontwerpbeslissing die door
					de hele architectuur loopt.
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Nul permanente opslag</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Audio en transcripties worden nergens opgeslagen. Niet op de server, niet in een
							database. Alles bestaat alleen in het werkgeheugen tijdens de verwerking en in je
							browser-tab. Sluit de tab en alles is weg.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">EU-only dataflow</h3>
						<p class="text-xs leading-relaxed text-white/50">
							In API-modus gaat data uitsluitend naar EU-servers. AssemblyAI verwerkt in Dublin
							(Ierland), Mistral AI draait op EU-servers, PostHog analytics draait op
							<span class="font-mono text-white/40">eu.posthog.com</span>. Geen data verlaat de EU.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">CORS-beveiliging</h3>
						<p class="text-xs leading-relaxed text-white/50">
							De FastAPI backend accepteert alleen verzoeken van bekende origins (standaard
							<span class="font-mono text-white/40">localhost:5173</span>). Andere websites kunnen
							niet meelezen of verzoeken sturen naar jouw lokale backend.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Budget limiting</h3>
						<p class="text-xs leading-relaxed text-white/50">
							API-aanroepen worden begrensd om onverwachte kosten te voorkomen. Zowel het aantal
							requests als de maximale audiolengte zijn gelimiteerd per sessie.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Analytics zonder profiling</h3>
						<p class="text-xs leading-relaxed text-white/50">
							PostHog draait met
							<span class="font-mono text-white/40">person_profiles: 'never'</span>. Er worden geen
							persoonlijke profielen aangemaakt. Geen cookies voor tracking. Alleen anonieme events
							voor productverbetering.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">PII-redactie (API modus)</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Bij gebruik van AssemblyAI worden persoonlijke gegevens automatisch geredacteerd
							voordat de tekst wordt teruggestuurd:
						</p>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[PERSON_NAME]</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[PHONE_NUMBER]</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[EMAIL_ADDRESS]</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[DATE_OF_BIRTH]</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[MEDICAL_PROCESS]</div>
							</div>
							<div class="rounded-md bg-white/5 border border-white/8 px-3 py-1.5 text-center">
								<div class="font-mono text-xs text-white/45">[MEDICAL_CONDITION]</div>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">GDPR audit logging</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-2">
							Audit logs bevatten nooit ruwe transcriptie-inhoud. Alleen metadata:
						</p>
						<div class="space-y-1.5">
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									Filterbaar op datum, sessie-ID, provider, stap, en succes/faal
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									Breach-rapportage met ernst-niveaus (critical/high/medium/low)
								</span>
							</div>
							<div class="flex items-start gap-2">
								<div class="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0"></div>
								<span class="text-xs text-white/40">
									<span class="font-medium text-white/50">Recht op vergetelheid</span>
									(AVG Art. 17) — sessiedata kan op verzoek worden verwijderd
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 11. Foutafhandeling & Resilience -->
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
							d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
					Foutafhandeling & resilience
				</h2>
				<p class="mb-3 text-sm leading-relaxed text-white/60">
					Een spraak-naar-tekst pipeline heeft veel bewegende onderdelen. BABL is ontworpen om
					gracefully te falen — met duidelijke foutcodes, automatische recovery, en fallbacks.
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Error taxonomie</h3>
						<p class="text-xs leading-relaxed text-white/50 mb-3">
							Elke fout krijgt een gestructureerde code zodat de frontend weet wat er mis is en de
							gebruiker een begrijpelijke melding kan tonen:
						</p>
						<div class="space-y-2 font-mono text-xs">
							<div class="flex items-center gap-3">
								<span class="text-amber-400/60 w-40 shrink-0">rate_limit</span>
								<span class="font-sans text-white/40">Te veel aanvragen — wacht X seconden</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-amber-400/60 w-40 shrink-0">ollama_unavailable</span>
								<span class="font-sans text-white/40">Ollama draait niet of is out-of-memory</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-amber-400/60 w-40 shrink-0">ollama_model_missing</span>
								<span class="font-sans text-white/40">Geen geschikt model geïnstalleerd</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-amber-400/60 w-40 shrink-0">timeout</span>
								<span class="font-sans text-white/40"
									>Verwerking duurde langer dan 600 seconden</span
								>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-amber-400/60 w-40 shrink-0">upstream_disconnect</span>
								<span class="font-sans text-white/40">Mistral/AssemblyAI server onbereikbaar</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Automatische recovery</h3>
						<p class="text-xs leading-relaxed text-white/50">
							Bij fouten probeert BABL automatisch te herstellen: model-fallback (heavy &rarr;
							medium &rarr; light), exponential backoff bij rate limits, en 3-tier JSON parsing. De
							gebruiker merkt vaak niets — het systeem schakelt stilletjes over op een alternatief.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<h3 class="text-sm font-medium text-white/70 mb-2">Timeout-grenzen</h3>
						<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-2">
							<div class="text-white/40">Totale verwerking</div>
							<div class="font-mono text-white/50">max 600 seconden</div>
							<div class="text-white/40">API polish endpoint</div>
							<div class="font-mono text-white/50">max 300 seconden</div>
							<div class="text-white/40">Transcriptie submit</div>
							<div class="font-mono text-white/50">max 60 seconden</div>
							<div class="text-white/40">WebSocket dead</div>
							<div class="font-mono text-white/50">30 seconden geen pong</div>
						</div>
					</div>
				</div>
			</section>

			<!-- 12. Polijstmodi -->
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
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
					Polijstmodi
				</h2>
				<p class="mb-4 text-sm leading-relaxed text-white/60">
					BABL ondersteunt meerdere output-stijlen. De modus bepaalt hoe de prompt aan het LLM wordt
					opgebouwd en wat voor soort tekst er uitkomt:
				</p>

				<div class="space-y-3">
					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>
							<h3 class="text-sm font-medium text-white/70">Samenvatting</h3>
						</div>
						<p class="text-xs leading-relaxed text-white/50">
							Beknopte versie in 2-4 zinnen. Fillers en herhalingen worden verwijderd. Alleen de
							kernpunten blijven over. Handig voor snelle notities of e-mails.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2.5 h-2.5 rounded-full bg-indigo-500/40"></div>
							<h3 class="text-sm font-medium text-white/70">Verslaglegging</h3>
						</div>
						<p class="text-xs leading-relaxed text-white/50">
							Derde-persoon notulen, secretariaat-stijl. "Spreker A zegt dat...", "Spreker B vraagt
							of...". Bewaart sprekersattributie en de volgorde van het gesprek. Ideaal voor
							vergaderverslagen.
						</p>
					</div>

					<div class="rounded-lg bg-white/5 border border-white/10 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2.5 h-2.5 rounded-full bg-purple-500/40"></div>
							<h3 class="text-sm font-medium text-white/70">Woordelijk</h3>
						</div>
						<p class="text-xs leading-relaxed text-white/50">
							Zo dicht mogelijk bij het origineel. Dialect wordt vertaald maar de zinsstructuur en
							woordkeuze blijven zo veel mogelijk intact. Geschikt voor interviews of juridische
							documentatie.
						</p>
					</div>

					<div class="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-2.5 h-2.5 rounded-full bg-amber-500/40"></div>
							<h3 class="text-sm font-medium text-amber-400/70">Dialect behouden</h3>
						</div>
						<p class="text-xs leading-relaxed text-white/50">
							Bijzondere modus: samenvatten <span class="font-medium text-white/60"
								>in het Limburgs</span
							>. Vertaalt niet naar Nederlands, maar ruimt het dialect op (spelling, stopwoorden).
							Voor niche-toepassingen waar dialect behoud gewenst is.
						</p>
					</div>
				</div>
			</section>
		</div>

		<footer class="mt-10 text-center animate-fade-in print:hidden">
			<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/30">
				<a href="/about" class="hover:text-white/60 transition-colors">Over BABL</a>
				<span class="text-white/10">|</span>
				<a href="/privacy" class="hover:text-white/60 transition-colors">Privacy</a>
				<span class="text-white/10">|</span>
				<a href="/faq" class="hover:text-white/60 transition-colors">FAQ</a>
			</div>
		</footer>
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
			color: #1e293b !important;
		}
		:global(.bg-dark-gradient) {
			background: white !important;
		}
		:global(.bg-dark-gradient::after) {
			display: none !important;
		}
		:global(.floating-orb) {
			display: none !important;
		}
		:global(.glass),
		:global(.glass-strong) {
			background: transparent !important;
			backdrop-filter: none !important;
			border-color: #e2e8f0 !important;
		}
		:global([class*='text-white']) {
			color: #1e293b !important;
		}
		:global([class*='text-emerald']) {
			color: #047857 !important;
		}
		:global([class*='text-indigo']) {
			color: #3730a3 !important;
		}
		:global([class*='text-amber']) {
			color: #92400e !important;
		}
		:global([class*='text-neon']) {
			color: #047857 !important;
		}
		:global([class*='text-red']) {
			color: #b91c1c !important;
		}
		:global([class*='text-purple']) {
			color: #6b21a8 !important;
		}
		:global([class*='bg-white/5']),
		:global([class*='bg-emerald']),
		:global([class*='bg-indigo']),
		:global([class*='bg-amber']),
		:global([class*='bg-purple']) {
			background: #f8fafc !important;
		}
		:global([class*='border-white']),
		:global([class*='border-emerald']),
		:global([class*='border-indigo']),
		:global([class*='border-amber']) {
			border-color: #e2e8f0 !important;
		}
		:global(.gradient-text) {
			background: none !important;
			-webkit-text-fill-color: #047857 !important;
			filter: none !important;
		}
	}
</style>
