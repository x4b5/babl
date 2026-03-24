---
name: styling-expert
description: Raadpleeg bij het toevoegen of wijzigen van styling, animaties of visuele effecten. Bevat het BABL kleurpalet, glassmorphism, animaties, glow effecten en layout conventies.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Styling Expert

## Bronbestand

`src/app.css` — alle custom styles, thema-variabelen en animaties

## Kleurpalet

### Theme variabelen (via `@theme`)

```css
--color-neon: #d4ff00; /* Primair accent */
--color-accent-start: #7c3aed; /* Violet */
--color-accent-end: #4f46e5; /* Indigo */
--color-glass: rgba(255, 255, 255, 0.05);
--color-glass-border: rgba(255, 255, 255, 0.08);
```

### Kleurgebruik

| Context              | Kleur                   | Voorbeeld                  |
| -------------------- | ----------------------- | -------------------------- |
| CTA / primair accent | `#d4ff00` (neon)        | Actieve toggle, highlights |
| Gradient secundair   | `#7c3aed` (violet)      | Gradient mix, orbs         |
| Gradient tertiair    | `#ff0080` (fuchsia)     | Gradient accenten          |
| Achtergrond          | `#0a0a0f`               | Body, button backgrounds   |
| Tekst primair        | `text-white/90`         | Leesbare content           |
| Tekst secundair      | `text-white/50` - `/70` | Labels, subtitels          |
| Tekst muted          | `text-white/30` - `/40` | Hints, placeholders        |
| Error                | `text-red-300` - `/400` | Foutmeldingen, recording   |
| Success              | `text-green-400`        | "Gekopieerd!"              |

## Componenten

### Glassmorphism

```html
<!-- Licht glass -->
<div class="glass">...</div>

<!-- Sterk glass -->
<div class="glass-strong">...</div>
```

- Altijd op donkere achtergrond
- Nooit `bg-white` gebruiken

### Cards met gradient border

```html
<div class="gradient-border-card p-5">
	<!-- Animated gradient border via ::before pseudo-element -->
</div>
```

- Border animeert langzaam (8s), sneller bij hover (4s)
- Hover: `-translate-y-0.5` + neon glow shadow

### Conic border (record button)

```html
<div class="conic-border"><!-- idle: langzaam draaiend --></div>
<div class="conic-border conic-border-recording"><!-- recording: snel, rood --></div>
<div class="conic-border conic-border-processing"><!-- processing: neon sweep --></div>
```

### Tekst effecten

```html
<h1 class="gradient-text">BABL</h1>
<!-- Rubik Glitch, neon gradient -->
<span class="shimmer-text">Laden...</span>
<!-- Shimmer animatie -->
<kbd class="kbd-hint">spatie</kbd>
<!-- Keyboard shortcut hint -->
```

## Animaties

### Utility classes

| Class                   | Effect                         | Duur |
| ----------------------- | ------------------------------ | ---- |
| `animate-fade-in`       | Opacity 0→1                    | 0.5s |
| `animate-slide-up`      | Translate + fade               | 0.5s |
| `animate-pulse-glow`    | Rode glow pulsatie             | 2s   |
| `animate-pulse-ring`    | Uitdijende ring (recording)    | 1.5s |
| `animate-spin-slow`     | Rotatie (spinner)              | 3s   |
| `animate-letter-bounce` | Letter bounce (hover op titel) | 0.5s |

### Achtergrond

- `bg-dark-gradient`: animated gradient achtergrond (15s cycle)
- Noise/grain overlay via `::after` pseudo-element
- Floating orbs: 4 gekleurde blurred cirkels met drift animaties

### Reduced motion

Alle animaties worden uitgeschakeld via:

```css
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

- Altijd `prefersReducedMotion()` uit `$lib/utils/a11y.ts` checken voor JS-animaties

### Accordion patroon

```css
.my-content {
	display: grid;
	grid-template-rows: 0fr;
	transition: grid-template-rows 0.35s ease;
}
.my-content.open {
	grid-template-rows: 1fr;
}
.my-content > div {
	overflow: hidden;
}
```

## Glow effecten

```html
<div class="glow-violet">...</div>
<!-- Violet box-shadow -->
<div class="glow-red">...</div>
<!-- Rood box-shadow -->
<div class="glow-green">...</div>
<!-- Groen box-shadow -->
```

## Layout

- Page container: `mx-auto max-w-3xl px-4 py-16`
- Content zit altijd boven noise layer (z-index via `.bg-dark-gradient > *`)
- Font: Inter (system fallback)
- Titel font: Rubik Glitch (Google Fonts, alleen voor `gradient-text`)

## Checklist nieuwe styling

- [ ] Dark theme: geen witte achtergronden
- [ ] Glassmorphism voor containers (`glass` / `glass-strong`)
- [ ] Kleuren uit het BABL palet
- [ ] Animaties hebben `animate-*` utility class
- [ ] Reduced motion wordt gerespecteerd
- [ ] Hover states met subtiele transforms en glows
- [ ] Consistent met bestaande `app.css` patronen
