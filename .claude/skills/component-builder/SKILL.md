---
name: component-builder
description: Raadpleeg bij het bouwen of wijzigen van Svelte componenten. Bevat Svelte 5 syntax, state management, BABL design system, en component checklist.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Component Builder

## Svelte 5 Syntax (verplicht)

```svelte
<script lang="ts">
	interface Props {
		title: string;
		count?: number;
	}
	let { title, count = 0 }: Props = $props();

	let isOpen = $state(false);
	let doubled = $derived(count * 2);

	$effect(() => {
		console.log('count changed:', count);
	});
</script>
```

**NOOIT**: `export let`, `$:`, `$$props`, `$$restProps`, `createEventDispatcher`

## State & Data

- App-state via `getGameState()` uit `$lib/stores/game.svelte.ts`
- UI-state (modals etc.) via `$lib/stores/ui.svelte.ts`
- Nooit state dupliceren in components

## Analytics

- Via `$lib/utils/analytics.ts`, nooit direct PostHog
- Try/catch is ingebouwd in de wrapper

## BABL Design System

### Achtergrond

- Page wrapper: `<div class="bg-dark-gradient min-h-screen">`
- Floating orbs toevoegen voor diepte (zie `app.css`)
- Content container: `mx-auto max-w-3xl px-4 py-16`

### Glassmorphism

- Licht: `class="glass"` — semi-transparant wit, blur, subtiele border
- Sterk: `class="glass-strong"` — meer opaque, sterkere blur
- Altijd op donkere achtergrond gebruiken

### Kleuren

| Token           | Waarde             | Gebruik                     |
| --------------- | ------------------ | --------------------------- |
| `--color-neon`  | `#d4ff00`          | Primair accent, CTA's       |
| Violet          | `#7c3aed`          | Secundair accent, gradients |
| Fuchsia         | `#ff0080`          | Tertiair, gradient accenten |
| Tekst primair   | `text-white/90`    | Hoofdtekst                  |
| Tekst secundair | `text-white/50-70` | Labels, subtekst            |
| Tekst muted     | `text-white/30-40` | Hints, placeholders         |

### Cards & Containers

- Result cards: `class="gradient-border-card p-5"` — animated gradient border
- Hover effect: `hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(212,255,0,0.15)]`
- **NIET** gebruiken: `bg-white`, `shadow-lg`, `rounded-2xl bg-white` (template stijl)

### Buttons

- Primair (actief toggle): `bg-gradient-to-r from-[#d4ff00] to-[#7c3aed] text-black shadow-lg`
- Inactief toggle: `text-white/50 hover:text-white/80`
- Ghost/upload: `glass rounded-full px-5 py-2 text-sm text-white/50 hover:text-white/80`
- Disabled: `disabled:opacity-30 disabled:cursor-not-allowed`

### Tekst effecten

- Gradient titel: `class="gradient-text"` (Rubik Glitch font)
- Processing shimmer: `class="shimmer-text"`
- Keyboard hint: `class="kbd-hint"`

### Animaties

- Fade in: `class="animate-fade-in"`
- Slide up: `class="animate-slide-up"`
- Pulse glow (recording): `class="animate-pulse-glow"`
- Spinner: `class="animate-spin-slow"`
- Altijd `prefersReducedMotion()` checken uit `$lib/utils/a11y.ts`
- Accordion: gebruik `grid-template-rows: 0fr/1fr` patroon (zie privacy section)

### Status indicators

- Recording: rode pulse dot + `text-red-400`
- Processing: bouncing neon dots + shimmer text
- Succes (gekopieerd): `text-green-400 glow-green bg-green-500/10`

## Checklist

- [ ] Svelte 5 syntax (`$props`, `$state`, `$derived`, `$effect`)
- [ ] State via stores, niet lokaal dupliceren
- [ ] Dark theme: glassmorphism, geen witte achtergronden
- [ ] Kleuren uit het BABL palet (neon, violet, fuchsia)
- [ ] Responsive (mobile-first + `md:` breakpoint)
- [ ] Animaties respecteren reduced motion
- [ ] `npm run check` → 0 errors
