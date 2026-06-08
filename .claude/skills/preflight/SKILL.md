---
name: preflight
description: Kwaliteitscheck voor commit. Draait tests, security scan en accessibility audit parallel op gewijzigde bestanden. Gebruik voor je commit.
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Preflight — Pre-commit kwaliteitscheck

## Wanneer

Draai dit **voor elke commit**. Het vangt problemen op voordat ze in git zitten.

## Stappen

### 1. Bepaal scope

Draai `git diff --name-only` en `git diff --cached --name-only` om de gewijzigde bestanden te vinden. Filter op relevante bestandstypes:

- `.svelte`, `.ts`, `.js` → frontend (security + a11y + tests)
- `.py` → backend (security + tests)
- `.css` → styling only (skip tests en security)

Als er geen wijzigingen zijn: meld dit en stop.

### 2. Draai drie checks parallel

Start drie Task agents **tegelijk** (parallel, in een enkele message):

#### Agent 1: Tests (test-agent)

- Draai `npm run test:run` voor frontend
- Als er `.py` bestanden gewijzigd zijn: draai ook `cd backend && python -m pytest` (als pytest beschikbaar is)
- Rapporteer: geslaagd/gefaald + welke tests faalden

#### Agent 2: Security (security-expert)

- Scan alleen de gewijzigde bestanden (niet de hele codebase)
- Focus op: hardcoded secrets, PII in logs, onveilige input handling
- Rapporteer met severity levels (CRITICAL/HIGH/MEDIUM/LOW)

#### Agent 3: Accessibility (a11y-agent)

- Alleen als er `.svelte` bestanden gewijzigd zijn — anders overslaan
- Check de gewijzigde componenten op WCAG 2.1 AA basis
- Rapporteer met severity levels

### 3. Samenvatting

Combineer de resultaten in een overzicht:

```
## Preflight Report

### Tests
[PASS/FAIL] — X tests geslaagd, Y gefaald

### Security
[CLEAN/waarschuwingen] — N issues gevonden
[lijst van issues indien aanwezig]

### Accessibility
[CLEAN/waarschuwingen/overgeslagen] — N issues gevonden
[lijst van issues indien aanwezig]

### Verdict
[GO — klaar om te committen / NO-GO — fix eerst de volgende issues]
```

### 4. Verdict logica

- **NO-GO** als: tests falen OF security CRITICAL/HIGH gevonden
- **GO met waarschuwingen** als: alleen MEDIUM/LOW security of a11y issues
- **GO** als: alles schoon

Bij NO-GO: bied aan om de issues direct te fixen.
