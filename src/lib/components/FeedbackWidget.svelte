<script lang="ts">
	interface Props {
		rawText: string;
		correctedText: string;
		dialectRegion?: string;
		lowConfidenceCount?: number;
		transcribeMode: 'local' | 'api';
		onevaluated?: (result: {
			wer: number;
			cer: number;
			substitutions: number;
			deletions: number;
			insertions: number;
			totalWords: number;
		}) => void;
	}

	let {
		rawText,
		correctedText,
		dialectRegion = 'limburgs',
		lowConfidenceCount = 0,
		transcribeMode,
		onevaluated
	}: Props = $props();

	const LOCAL_BACKEND_URL = 'http://localhost:8000';

	let feedbackGiven = $state<'thumbs_up' | 'thumbs_down' | null>(null);
	let evaluating = $state(false);
	let evalError = $state('');

	async function submitFeedback(type: 'thumbs_up' | 'thumbs_down') {
		feedbackGiven = type;
		evaluating = true;
		evalError = '';

		try {
			// Step 1: Calculate WER/CER (raw = hypothesis, corrected = reference)
			const evalResp = await fetch(`${LOCAL_BACKEND_URL}/evaluate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reference: correctedText,
					hypothesis: rawText,
					dialect_region: dialectRegion,
					low_confidence_count: lowConfidenceCount
				})
			});

			if (!evalResp.ok) throw new Error('Evaluatie mislukt');
			const metrics = await evalResp.json();

			const result = {
				wer: metrics.wer,
				cer: metrics.cer,
				substitutions: metrics.substitutions,
				deletions: metrics.deletions,
				insertions: metrics.insertions,
				totalWords: metrics.total_words
			};

			onevaluated?.(result);

			// Step 2: Log to JSONL
			const sessionId = `session-${Date.now()}`;
			await fetch(`${LOCAL_BACKEND_URL}/evaluate/log`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					session_id: sessionId,
					dialect_region: dialectRegion,
					wer: metrics.wer,
					cer: metrics.cer,
					substitutions: metrics.substitutions,
					deletions: metrics.deletions,
					insertions: metrics.insertions,
					total_words: metrics.total_words,
					low_confidence_count: lowConfidenceCount,
					feedback: type
				})
			});
		} catch (e) {
			evalError = e instanceof Error ? e.message : 'Evaluatie mislukt';
		} finally {
			evaluating = false;
		}
	}
</script>

{#if !feedbackGiven}
	<div class="glass animate-fade-in rounded-xl p-4">
		<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Beoordeling</h3>
		<p class="mb-3 text-xs text-white/50">Was de transcriptie/correctie goed?</p>
		<div class="flex gap-3">
			<button
				onclick={() => submitFeedback('thumbs_up')}
				disabled={evaluating}
				class="glass flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/60
					transition-all duration-200 hover:bg-green-500/10 hover:text-green-400
					disabled:cursor-not-allowed disabled:opacity-30"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
					/>
				</svg>
				Goed
			</button>
			<button
				onclick={() => submitFeedback('thumbs_down')}
				disabled={evaluating}
				class="glass flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/60
					transition-all duration-200 hover:bg-red-500/10 hover:text-red-400
					disabled:cursor-not-allowed disabled:opacity-30"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
					/>
				</svg>
				Kan beter
			</button>
		</div>
		{#if evaluating}
			<p class="mt-2 animate-pulse text-xs text-white/40">Evaluatie berekenen...</p>
		{/if}
	</div>
{:else}
	<div class="glass animate-fade-in rounded-xl p-4">
		<div class="mb-2 flex items-center gap-2">
			{#if feedbackGiven === 'thumbs_up'}
				<span class="text-sm text-green-400">Bedankt voor je feedback!</span>
			{:else}
				<span class="text-sm text-amber-400">Bedankt, we verbeteren!</span>
			{/if}
		</div>
		{#if evalError}
			<p class="text-xs text-red-400">{evalError}</p>
		{/if}
	</div>
{/if}
