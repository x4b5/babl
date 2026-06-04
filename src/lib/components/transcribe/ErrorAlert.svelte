<script lang="ts">
	import type { ErrorType } from '$lib/utils/error-types';
	import { getRecording } from '$lib/utils/recording-db';

	interface Props {
		error: string;
		errorType: ErrorType | '';
		savedRecordingId?: string | null;
		onRetry?: () => void;
	}

	let { error, errorType, savedRecordingId = null, onRetry }: Props = $props();

	let downloading = $state(false);

	async function downloadRecording() {
		if (!savedRecordingId || downloading) return;
		downloading = true;
		try {
			const rec = await getRecording(savedRecordingId);
			if (!rec) return;
			const ext = rec.mimeType.includes('webm')
				? 'webm'
				: rec.mimeType.includes('ogg')
					? 'ogg'
					: 'mp4';
			const date = new Date(rec.createdAt);
			const pad = (n: number) => String(n).padStart(2, '0');
			const filename = `opname-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}h${pad(date.getMinutes())}.${ext}`;
			const url = URL.createObjectURL(rec.blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			downloading = false;
		}
	}
</script>

{#if error}
	<div
		role="alert"
		aria-live="assertive"
		class="mb-8 rounded-xl border p-4 text-sm animate-slide-up {errorType === 'rate_limit'
			? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
			: 'border-red-500/20 bg-red-500/10 text-red-300'}"
	>
		<p>{error}</p>

		{#if savedRecordingId}
			<div class="mt-3 flex flex-wrap gap-2">
				<button
					onclick={downloadRecording}
					disabled={downloading}
					class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
				>
					Download opname
				</button>
				{#if onRetry}
					<button
						onclick={onRetry}
						class="rounded-lg border border-neon/20 bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon transition hover:bg-neon/20"
					>
						Opnieuw transcriberen
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}
