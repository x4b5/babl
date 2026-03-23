# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**

- Vitest 4.0.18
- Config: Not explicitly configured (uses default SvelteKit integration)
- TypeScript support: Built-in

**Assertion Library:**

- Vitest default (uses Node.js assert or similar)

**Run Commands:**

```bash
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once (CI mode)
```

## Test File Organization

**Location:**

- No tests currently in repository
- When added: co-located pattern recommended (same directory as source)

**Naming Convention (recommended):**

- Test files: `.test.ts` or `.test.svelte.ts` suffix
- Example: `game.svelte.ts` → `game.svelte.test.ts`
- Example: `analytics.ts` → `analytics.test.ts`

**Structure (recommended for future):**

```
src/lib/
├── stores/
│   ├── game.svelte.ts
│   ├── game.svelte.test.ts          # Co-located tests
│   └── ui.svelte.ts
├── utils/
│   ├── analytics.ts
│   ├── analytics.test.ts            # Co-located tests
│   └── a11y.ts
└── components/
    ├── Button.svelte
    └── Button.test.svelte            # Co-located tests
```

## Test Structure

**Suite Organization (recommended pattern based on codebase style):**

Pure functions in `src/lib/engine/` and utilities in `src/lib/utils/` would use:

```typescript
import { describe, it, expect } from 'vitest';
import { prefersReducedMotion } from '$lib/utils/a11y';

describe('a11y utilities', () => {
	it('should detect reduced motion preference', () => {
		// Arrange
		const mockMediaQuery = { matches: true };
		window.matchMedia = () => mockMediaQuery as MediaQueryList;

		// Act
		const result = prefersReducedMotion();

		// Assert
		expect(result).toBe(true);
	});
});
```

**Patterns observed in codebase (for reference):**

- Svelte 5 runes used for state: `let status = $state<Status>('idle')`
- Pure functions for utilities (easiest to test)
- API handlers are request/response focused

## Mocking

**Framework:** Vitest built-in mocking via `vi.mock()` (not explicitly configured)

**Patterns (recommended):**

Mock fetch for API handlers:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '$routes/api/health/+server';

describe('health endpoint', () => {
	it('should return status ok', async () => {
		// Mock env
		vi.stubEnv('MISTRAL_API_KEY', 'test-key');

		// Mock request
		const request = new Request('http://localhost/health', {
			method: 'GET'
		});

		// Act
		const response = await POST({ request } as RequestEvent);
		const data = await response.json();

		// Assert
		expect(data.status).toBe('ok');
	});
});
```

**What to Mock:**

- External API calls (AssemblyAI, Mistral)
- Environment variables: `vi.stubEnv()`
- `fetch` calls
- `window.matchMedia` for media queries
- `MediaRecorder` for audio tests
- PostHog (`posthog-js`)

**What NOT to Mock:**

- Svelte 5 runes (`$state`, `$derived`)
- Pure utility functions
- Type definitions
- Core business logic (test real behavior)

## Fixtures and Factories

**Test Data (recommended structure):**

Create `src/lib/test-utils/` directory:

```typescript
// src/lib/test-utils/fixtures.ts
export const audioFixtures = {
	smallWav: () =>
		new Blob(
			[
				/* ... */
			],
			{ type: 'audio/wav' }
		),
	largeWav: () =>
		new Blob(
			[
				/* ... */
			],
			{ type: 'audio/wav' }
		)
};

export const transcriptionFixtures = {
	validResponse: { id: 'asm-123', status: 'completed', text: 'Test text' },
	errorResponse: { error: 'API error' }
};

export const gameStateFixtures = {
	idle: () => ({ phase: 'welcome' }) as const,
	recording: () => ({ phase: 'playing' }) as const
};
```

**Location:**

- `src/lib/test-utils/` for shared test utilities
- Or co-locate small fixtures in test files

## Coverage

**Requirements:**

- Not enforced (no coverage threshold detected)
- Target (recommended): 70%+ for utilities, 50%+ for components

**View Coverage:**

```bash
npm run test:run -- --coverage
```

**Areas to prioritize:**

- `src/lib/utils/` — 100% (small, pure functions)
- `src/lib/stores/` — 80%+ (state management)
- API handlers — 70%+ (request/response logic)
- Components — 50%+ (harder to test, focus on logic)

## Test Types

**Unit Tests:**

- Scope: Pure functions in `src/lib/utils/` and `src/lib/engine/`
- Approach: Test single function with mocked dependencies
- Example: `a11y.test.ts` tests `prefersReducedMotion()` with mocked `window.matchMedia`
- Example: `analytics.test.ts` tests `initAnalytics()` with mocked PostHog

**Integration Tests:**

- Scope: API routes combining multiple concerns
- Approach: Mock external services, test request → response
- Example: `transcribe-api.test.ts` — test audio submission + response parsing
- Example: `correct.test.ts` — test Mistral streaming + error handling

**E2E Tests:**

- Framework: Not currently used (no playwright/cypress config)
- When needed: Consider Playwright for UI flow testing (login → record → transcribe)
- Would test browser automation, not included in scope

## Common Patterns

**Async Testing:**

Vitest supports async test functions natively:

```typescript
it('should fetch transcription', async () => {
	// Mock fetch
	vi.global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ transcriptId: 'asm-123' })
	});

	// Act
	const result = await submitAudio(file);

	// Assert
	expect(result.transcriptId).toBe('asm-123');
});
```

**Error Testing:**

Test error paths explicitly:

```typescript
it('should handle network errors gracefully', async () => {
	// Mock fetch failure
	vi.global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

	// Act & Assert
	await expect(submitAudio(file)).rejects.toThrow('Network error');
});

it('should handle API errors', async () => {
	// Mock 400 response
	vi.global.fetch = vi.fn().mockResolvedValue({
		ok: false,
		status: 400,
		json: async () => ({ error: 'Invalid audio' })
	});

	// Act & Assert
	await expect(submitAudio(file)).rejects.toThrow('Invalid audio');
});
```

**Svelte Component Testing:**

Components with state would test reactive updates:

```typescript
it('should update elapsed time when recording', async () => {
	// Render component (requires @testing-library/svelte or similar)
	// For now, test the underlying logic separately

	// Test time formatting function
	const formatted = formatTime(65);
	expect(formatted).toBe('01:05');
});
```

**Stream/Generator Testing:**

For `correctChunkMistralStream()`:

```typescript
it('should yield tokens from Mistral stream', async () => {
	// Mock Mistral client
	const tokens = [];
	for await (const token of correctChunkMistralStream(...)) {
		tokens.push(token);
	}
	expect(tokens).toEqual(['Hello', ' ', 'world']);
});
```

## Current Testing State

**Status:** No tests currently committed to repository

**Rationale:**

- Project is in active development
- Main focus: core transcription/correction features
- Testing infrastructure ready but not yet populated

**Recommended next steps:**

1. Add tests for `src/lib/utils/` functions (easiest wins)
2. Add tests for store state management (`game.svelte.ts`, `ui.svelte.ts`)
3. Add tests for API handlers (`transcribe-api`, `correct`)
4. Add integration tests for audio processing pipeline
5. Consider E2E tests for user workflows (record → transcribe → correct)

## Vitest Configuration

**Default configuration:** Uses SvelteKit integration automatically

When explicit config needed, create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		environment: 'jsdom', // For DOM APIs like window.matchMedia
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html']
		}
	}
});
```

---

_Testing analysis: 2026-03-23_
