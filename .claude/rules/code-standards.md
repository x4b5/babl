---
description: Code conventions for SvelteKit 5 + TypeScript + Tailwind projects
globs: '**/*.{ts,tsx,js,jsx,svelte}'
---

# Code Standards

## Language

- TypeScript is the default language. Use alternatives only with explicit justification.
- Python for backend (`backend/main.py`).

## Svelte 5

- Use Svelte 5 runes only: `$props()`, `$state()`, `$derived()`, `$effect()`.
- **Never** use `export let`, `$:`, `$$props`, `$$restProps`, or `createEventDispatcher`.
- State lives in stores (`game.svelte.ts`, `ui.svelte.ts`), not in components.

## Formatting

- Use Prettier for all formatting (tabs, single quotes, print width 100).
- Do not manually format code.

## Naming Conventions

- **Files**: `kebab-case` (e.g., `user-service.ts`, `api-handler.ts`)
- **Variables and functions**: `camelCase`
- **Classes and types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

## Styling

- Use Tailwind CSS 4 utility classes.
- Custom styles and theme variables live in `src/app.css`.
- Use existing design tokens (`--color-neon`, `--color-glass`, etc.) — don't invent new ones.

## Code Style

- No unnecessary abstractions — keep it simple until complexity is proven necessary.
- Prefer explicit over implicit. Avoid magic strings and numbers.
- One export per file when the export is a class or component.
- Use `const` by default. Only use `let` when reassignment is needed.

## Dependencies

- Prefer well-maintained, widely-used packages.
- Justify new dependencies — don't add a library for something achievable in a few lines.
