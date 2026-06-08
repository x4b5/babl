---
name: nieuw-component
description: Geleide creatie van een nieuw Svelte component. Laadt design system, vraagt wat het moet doen, bouwt het component en checkt accessibility.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, AskUserQuestion
---

# Nieuw Component — Geleide component builder

## Wanneer

Gebruik dit als je een nieuw Svelte component wilt maken. Deze skill begeleidt je stap voor stap zodat het component past in het BABL design system.

## Stappen

### 1. Intake — Wat moet het component doen?

Vraag de gebruiker via AskUserQuestion:

- **Wat doet het component?** (korte beschrijving)
- **Waar komt het?** (welke pagina of layout)
- **Heeft het interactie?** (knoppen, input, toggle, etc.)

Als de gebruiker het component al beschreven heeft in hun bericht, sla deze stap over.

### 2. Laad context

Lees deze bestanden voor je begint (parallel):

- `.claude/skills/component-builder/SKILL.md` — Svelte 5 syntax + design system regels
- `.claude/skills/styling-expert/SKILL.md` — BABL kleuren, glassmorphism, animaties
- `src/app.css` — beschikbare CSS classes en tokens
- De pagina/layout waar het component gebruikt gaat worden

### 3. Check bestaande patronen

Zoek in `src/lib/components/` naar vergelijkbare componenten. Hergebruik patronen die al bestaan:

- Dezelfde soort component (card, modal, button, form)?
- Dezelfde data-flow (store → component)?
- Dezelfde styling-aanpak?

Meld aan de gebruiker welke bestaande componenten je als voorbeeld gebruikt.

### 4. Bouw het component

Maak het component aan in `src/lib/components/` met de juiste naamgeving (`kebab-case.svelte`).

Volg deze regels (uit component-builder skill):

- Svelte 5 syntax: `$props()`, `$state()`, `$derived()`, `$effect()`
- State via stores, niet lokaal dupliceren
- Dark theme: glassmorphism, geen witte achtergronden
- BABL kleurpalet (neon, violet, fuchsia)
- Responsive: mobile-first + `md:` breakpoint

### 5. Accessibility check

Start een Task agent (a11y-agent style check) op het nieuwe component:

- Keyboard bereikbaarheid (Tab, Enter, Space, Escape)
- ARIA labels op interactieve elementen
- Kleurcontrast (4.5:1 voor tekst)
- `prefers-reduced-motion` als er animaties zijn

Rapporteer issues en fix ze direct.

### 6. Integratie

- Voeg het component toe aan de pagina waar het thuishoort
- Draai `npm run check` om TypeScript fouten te vangen
- Toon de gebruiker het resultaat en vraag of het klopt

## Checklist (einde)

- [ ] Svelte 5 syntax (geen `export let`, geen `$:`)
- [ ] BABL design system kleuren en glassmorphism
- [ ] Responsive (mobile-first)
- [ ] Keyboard accessible
- [ ] ARIA labels op interactieve elementen
- [ ] Animaties respecteren reduced motion
- [ ] `npm run check` → 0 errors
- [ ] Component geintegreerd in de juiste pagina
