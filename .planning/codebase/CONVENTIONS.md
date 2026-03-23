# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**

- Kebab-case for all files: `game.svelte.ts`, `analytics.ts`, `user-service.ts`
- Store files: `.svelte.ts` extension (e.g., `game.svelte.ts`, `ui.svelte.ts`)
- Route files: `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+server.ts`
- Component files: `Button.svelte`, `Modal.svelte` (PascalCase in components directory)

**Functions:**

- camelCase for all functions: `getGameState()`, `initAnalytics()`, `startGame()`, `sendLiveChunk()`
- Action functions: verb + noun: `startGame()`, `finishGame()`, `resetGame()`, `stopRecording()`
- Prefixes for internal helpers: `_showModal` (underscore for private state)

**Variables:**

- camelCase for all variables: `status`, `countdown`, `raw`, `corrected`, `liveSegments`
- Constants: UPPER_SNAKE_CASE: `RECORDING_MAX_SECONDS`, `LOCAL_BACKEND_URL`, `OVERLAP_CHUNKS`
- State variables: lowercase: `status = $state<Status>('idle')`
- Derived values: use `$derived` instead of suffix notation

**Types:**

- PascalCase for types and interfaces: `GamePhase`, `Status`, `RequestHandler`
- Union types as string literals: `type Status = 'idle' | 'recording' | 'processing'`
- Record objects use camelCase keys: `{ light: '...', medium: '...' }`

**Constants in code:**

- All magic numbers extracted to named constants at function scope
- Examples: `RECORDING_MAX_SECONDS = 60 * 60`, `CHUNK_INTERVAL_MS = 500`
- Inline comments explain domain meaning: `// 3 seconds overlap at 500ms per chunk`

## Code Style

**Formatting:**

- Prettier 3.8.1 with custom config
- Tabs for indentation (not spaces)
- Single quotes for strings: `'hello'` not `"hello"`
- Trailing comma: `none` (no trailing commas)
- Print width: 100 characters
- Format on save: `npm run format` or pre-commit hook via husky

**Linting:**

- svelte-check for type checking
- TypeScript strict mode enabled (`"strict": true`)
- No eslint config detected — svelte-check provides primary linting
- Run checks: `npm run check`

**Language:**

- TypeScript strict mode enforced in `tsconfig.json`
- `allowJs: true` for gradual migration support
- `checkJs: true` to check JavaScript files
- Type imports: explicit and required

## Import Organization

**Order (strict):**

1. Svelte framework imports: `import { onMount } from 'svelte'`
2. External packages: `import posthog from 'posthog-js'`
3. Local absolute imports with `$` alias: `import { getGameState } from '$lib/stores/game.svelte'`
4. Local relative imports: `import { helper } from '../utils/helper'`
5. Type imports: `import type { GamePhase } from '../stores/game.svelte'`

**Path Aliases:**

- `$lib/` maps to `src/lib/`
- `$env/` for environment variables
- All imports use absolute `$lib/` paths, not relative `../../../`

## Error Handling

**Pattern: Try-catch with user feedback:**

```typescript
try {
	// Operation
	const resp = await fetch(url);
	if (!resp.ok) {
		throw new Error(`Server error ${resp.status}`);
	}
	const data = await resp.json();
} catch (e) {
	const message = e instanceof Error ? e.message : String(e);
	error = `User-friendly message: ${message}`;
}
```

**Guidelines:**

- Always check `resp.ok` after fetch before parsing JSON
- Type-guard errors: `e instanceof Error ? e.message : String(e)`
- Set `error` state (reactive) for user-facing messages
- Never log sensitive data (transcriptions, PII)
- Silent fail for non-critical operations (analytics, health checks)

**Network errors:**

- Connection failures: `error = 'API niet bereikbaar. Controleer je internetverbinding.'`
- Timeout: handled by retry loops (see Mistral stream, max 8 retries with exponential backoff)
- Invalid responses: throw early with descriptive messages

**Silent failures (allowed):**

```typescript
// Analytics should never break the app
try {
	posthog.capture(event, properties);
} catch {
	// Silent fail
}
```

## Logging

**Framework:** Native `console` object (no logger library)

**Patterns:**

- Development logs use prefixes: `console.log('[RT]', message)`, `console.warn('Live chunk failed:', e)`
- Error logs: `console.error('[Auth] Invalid token')`, `console.error('Correction error:', e)`
- Debug info: `console.log('Live chunk: sending chunks...', details)`
- Remove or comment out logs before shipping (not in production)

**When to log:**

- State transitions: `console.log('WebSocket connected')`
- Errors with context: `console.error('[RT] WebSocket error:', e)`
- Debug values during development: chunk sizes, durations, offsets
- Auth issues: invalid tokens

**What NOT to log:**

- Transcription content (audio or text) — privacy-first
- API keys or credentials
- PII
- Full error stacks in user-facing messages

## Comments

**When to Comment:**

- Non-obvious algorithm logic: "3 seconds overlap at 500ms per chunk"
- Business rules: "AssemblyAI cost: $0.17/hour"
- Configuration values: "mlx-whisper on Apple Silicon ≈ faster than real-time"
- Workarounds or hacks: rare, should be avoided
- Section separators: `// --- [Descriptive name] ---`

**JSDoc/TSDoc:**

- Used minimally — code should be self-documenting
- Function exports have optional JSDoc for complex async operations
- Type definitions are self-explanatory via TypeScript

**Example:**

```typescript
/** Downsample audio blob to 16kHz mono WAV — Whisper doesn't need more. */
async function downsampleToWav(blob: Blob): Promise<Blob> {
	// Implementation...
}
```

## Function Design

**Size:** Keep functions focused and readable

- Record page component: ~1000 lines (single feature, complex UI state)
- Utility functions: 10-100 lines
- API handlers: 50-250 lines

**Parameters:**

- Prefer destructured objects for multiple parameters (especially in API handlers)
- Example: `{ request, cookies }` instead of separate args
- Type parameters explicitly: `async function downsampleToWav(blob: Blob): Promise<Blob>`

**Return Values:**

- Always type-annotate returns: `: Promise<Blob>`, `: Record<string, unknown>`, `: void`
- Use union types for multiple outcomes: `{ id, error }` object for API responses
- Generators for streams: `async function* correctChunkMistralStream(...): AsyncGenerator<string>`

## Module Design

**Exports:**

- One primary export per file (when exporting class/type)
- Multiple named exports for utilities: `export function initAnalytics()`, `export function trackPageViewed()`
- Barrel files (index.ts) not used — import directly from source files

**Store Files:**

- Export state getters: `export function getGameState() { return { get phase() { ... } } }`
- Export action functions: `export function startGame() { ... }`
- Private state with underscore: `let _showModal = $state(false)`
- No default exports — always named

**API Routes:**

- Export handler functions: `export const GET: RequestHandler`, `export const POST: RequestHandler`
- Export config: `export const config = { maxDuration: ... }`
- Type from `./$types` for RequestHandler

**Utilities:**

- Pure functions (no side effects)
- Example: `src/lib/utils/analytics.ts` wraps PostHog, exports `initAnalytics()`, `trackPageViewed()`
- Example: `src/lib/utils/a11y.ts` exports `prefersReducedMotion(): boolean`

## Svelte 5 Patterns

**State Management:**

```typescript
let status = $state<Status>('idle');
let elapsed = $state(0);
let error = $state('');
```

**Derived values:**

```typescript
const formattedTime = $derived.by(() => {
	const mins = Math.floor(elapsed / 60);
	const secs = elapsed % 60;
	return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});
```

**Effects for side effects:**

```typescript
$effect(() => {
	if (status === 'recording') {
		timerInterval = setInterval(() => {
			elapsed += 1;
		}, 1000);
	} else if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = undefined;
	}
	return () => {
		if (timerInterval) clearInterval(timerInterval);
	};
});
```

**Props in components:**

```typescript
let { children } = $props();
```

**Event handlers:**

- Use `onclick`, `onchange` attributes directly
- No `createEventDispatcher` — not Svelte 5 rune
- Handlers can modify state directly: `onclick={() => (lang = 'nl')}`

## Styling Patterns

**Framework:** Tailwind CSS 4 with custom theme variables

**Theme Variables (in `src/app.css`):**

- `--color-glass`: rgba(255, 255, 255, 0.05) — glass morphism base
- `--color-glass-border`: rgba(255, 255, 255, 0.08)
- `--color-glass-hover`: rgba(255, 255, 255, 0.1)
- `--color-accent-start`: #7c3aed (purple)
- `--color-accent-end`: #4f46e5 (indigo)
- `--color-neon`: #d4ff00 (lime green)
- `--color-glow-*`: shadow/glow colors with alpha

**Utility Classes:**

- Dark theme: `bg-dark-gradient` (animated background)
- Containers: `max-w-3xl mx-auto px-4`, mobile-first: `py-6 sm:py-16`
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-pulse-glow`
- Glass effect: `glass` class (defined in CSS)
- Responsive: `md:` breakpoint for tablet/desktop

**Anti-patterns:**

- Never use `bg-white` — always use dark theme
- No inline styles — use Tailwind only
- Respect `prefers-reduced-motion` via `prefersReducedMotion()` utility

## Type-Safety

**TypeScript enforced:**

- All function parameters type-annotated
- All return types explicit
- No `any` type — use `unknown` then narrow
- String literal unions for state: `type Status = 'idle' | 'recording'`

**Environment variables:**

- Public vars: `import.meta.env.VITE_PUBLIC_*`
- Private vars: `import { env } from '$env/dynamic/private'`
- No `.env` file commits — reference `.env.example` for keys

---

_Convention analysis: 2026-03-23_
