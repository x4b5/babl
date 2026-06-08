---
name: debug
description: Gestructureerd debuggen. Vraagt wat het probleem is, onderzoekt de oorzaak, laadt de juiste domein-kennis en stelt een fix voor.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, AskUserQuestion
---

# Debug — Gestructureerd debuggen

## Wanneer

Gebruik dit als iets niet werkt en je niet weet waarom. Werkt voor frontend fouten, backend crashes, styling issues en alles daartussen.

## Stappen

### 1. Intake — Wat is het probleem?

Als de gebruiker al een foutmelding of beschrijving gaf, gebruik die. Anders vraag:

- **Wat gebeurt er?** (wat zie je / wat verwacht je)
- **Waar gebeurt het?** (browser, terminal, build, specifieke pagina)
- **Sinds wanneer?** (altijd al, na een specifieke wijziging)

### 2. Classificeer het probleem

Bepaal het type:

| Type              | Signalen                                              | Domein             |
| ----------------- | ----------------------------------------------------- | ------------------ |
| **Build error**   | `npm run check` faalt, TypeScript errors, Vite errors | Frontend           |
| **Runtime error** | Browser console errors, pagina crasht, witte scherm   | Frontend           |
| **Backend error** | Python traceback, uvicorn error, API 500              | Backend            |
| **Styling issue** | Ziet er anders uit dan verwacht, layout broken        | Frontend/CSS       |
| **Network error** | Fetch faalt, CORS, WebSocket disconnect               | Frontend + Backend |
| **Logic error**   | Geen foutmelding maar verkeerd gedrag                 | Afhankelijk        |

### 3. Laad domein-kennis

Lees de relevante skill(s) op basis van het type (parallel):

| Domein                  | Skill/Agent               |
| ----------------------- | ------------------------- |
| Svelte component issues | `component-builder` skill |
| Styling/layout          | `styling-expert` skill    |
| Backend/API             | `backend-expert` skill    |
| Transcriptie flow       | `transcribe-expert` skill |
| Analytics               | `analytics-expert` skill  |

### 4. Onderzoek

Volg het diagnostisch proces van de debug-agent:

1. **Identificeer** — Wat voor fout is het? (compile-time, runtime, network, logic)
2. **Lokaliseer** — Welk bestand en welke regel?
3. **Context** — Lees de omringende code om de bedoeling te begrijpen
4. **Root cause** — Waarom treedt deze fout op? (niet alleen het symptoom)
5. **Fix** — Wat is de minimale wijziging om het op te lossen?

Bij elke stap: leg aan de gebruiker uit wat je doet en wat je vindt.

### 5. Diagnose rapporteren

Presenteer de bevindingen:

```
## Diagnose

**Probleem**: [korte beschrijving]
**Type**: [build/runtime/backend/styling/network/logic]
**Bestand**: path/to/file.ts:regel
**Oorzaak**: [waarom dit gebeurt — in gewone taal]
**Impact**: [wat er door breekt]

## Voorgestelde fix
[Uitleg van wat er moet veranderen en waarom]
```

### 6. Fix toepassen

Vraag de gebruiker of je de fix mag toepassen. Zo ja:

- Pas de minimale wijziging toe (geen refactoring erbij)
- Draai `npm run check` om te verifiëren
- Als het een backend fix is: controleer of de server nog draait
- Toon wat er veranderd is

### 7. Verificatie

Na de fix:

- Vraag de gebruiker om te testen of het probleem opgelost is
- Als het niet opgelost is: ga terug naar stap 4 met nieuwe informatie

## Regels

- **Minimale fixes** — Los alleen het probleem op, geen bijkomende "verbeteringen"
- **Uitleg verplicht** — Leg altijd uit wat de oorzaak is, ook als de fix simpel is
- **Geen tests aanpassen** — Als een test faalt, fix de implementatie, niet de test
- **Een bestand tegelijk** — Pas niet meerdere bestanden tegelijk aan zonder toestemming
