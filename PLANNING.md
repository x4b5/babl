# Project Planning

> Globaal overzicht — een kompas, geen contract. Keuzes kunnen veranderen tijdens het bouwen.

## Projectinfo

|               |                                                 |
| ------------- | ----------------------------------------------- |
| **Naam**      | _[Projectnaam]_                                 |
| **Doel**      | _[Wat doet het? Welk probleem lost het op?]_    |
| **Doelgroep** | _[Voor wie is het?]_                            |
| **Techstack** | SvelteKit 5, TypeScript, Tailwind CSS 4, Vercel |
| **Repo**      | _[URL]_                                         |

---

## Fases

### 1. Project Setup

- [ ] Repository aanmaken en basis techstack configureren
- [ ] CI/CD pipeline opzetten (linting, type-check, tests)
- [ ] Development tooling configureren (formatter, editor config)
- [ ] CLAUDE.md en projectdocumentatie invullen

### 2. Architectuur & Data

- [ ] Datamodel ontwerpen
- [ ] API routes / endpoints definiëren
- [ ] State management opzetten (stores, runes)
- [ ] Externe services / integraties inventariseren

### 3. Back-end / Logica

- [ ] Engine / business logic implementeren (pure functies)
- [ ] API endpoints bouwen
- [ ] Externe integraties aansluiten
- [ ] Data validatie en error handling

### 4. Front-end / Componenten

- [ ] Route-structuur en pagina's aanmaken
- [ ] Kerncomponenten bouwen
- [ ] Navigatie en fase-flow implementeren
- [ ] Formulieren en user input afhandelen

### 5. UI/UX & Styling

- [ ] Design system / tokens opzetten (kleuren, typografie, spacing)
- [ ] Responsive layout implementeren
- [ ] Accessibility (a11y) waarborgen
- [ ] Animaties en micro-interacties
- [ ] Dark mode (indien van toepassing)

### 6. Testing

- [ ] Unit tests voor engine / pure functies
- [ ] Component tests voor kerncomponenten
- [ ] Integration tests voor kritieke flows
- [ ] Handmatige cross-browser test

### 7. Deployment & Infra

- [ ] Hosting configureren (Vercel)
- [ ] Environment variables en secrets beheren
- [ ] Analytics opzetten (PostHog)
- [ ] Monitoring en error tracking

### 8. Polish & Launch

- [ ] Performance optimalisatie (Lighthouse audit)
- [ ] SEO en meta tags
- [ ] README en gebruikersdocumentatie
- [ ] Lancering en eerste feedback ronde
