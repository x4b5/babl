# Verbeterpunten — vervolg

> Bron: brede codebase-review van 2026-06-13. De HIGH/MEDIUM-fixes met laag risico
> zijn al doorgevoerd (zie commits `37a6e09`..`a79010b`, PR #1). Dit bestand bevat
> de **bewust uitgestelde** punten + de kleinere polish die nog open staat.
> Volgorde = ruwe prioriteit (impact ÷ moeite ÷ risico).

## Legenda

- 🔴 Vereist een beslissing van de eigenaar (deploy, product, juridisch)
- 🟠 Substantieel werk, maar duidelijk
- 🟢 Kleine, geïsoleerde verbetering

---

## A. Beslissingen nodig (🔴)

### A1. npm audit `--force` (breaking deps)

- **Wat:** resterende kwetsbaarheden (esbuild, `@sveltejs/adapter-vercel`) vereisen
  `npm audit fix --force`, wat breaking upgrades installeert.
- **Waarom uitgesteld:** raakt de Vercel-build/deploy-config; kan de build breken.
- **Eerste stap:** in een aparte branch `npm audit fix --force` draaien, dan
  `npm run build` + `npm run check` + `npm run test:run`, en een test-deploy op Vercel.
- **Risico:** hoog (build/deploy). Apart testen.

### A2. Auth op lokale backend-endpoints

- **Wat:** `backend/routes/audit.py`, `evaluate.py` en het `/corrections`-endpoint
  hebben geen authenticatie. `DELETE /audit/sessions/{id}` wist data zonder check.
- **Waarom uitgesteld:** een half-af tokenmechanisme breekt de lokale frontend-flow;
  dit is een ontwerpkeuze.
- **Eerste stap:** kies een aanpak — (a) backend binden aan `127.0.0.1` + strikte
  Origin-validatie, of (b) een lokaal gegenereerd token dat de frontend meestuurt.
- **Bestanden:** `backend/main.py` (CORS/bind), `backend/routes/audit.py`, `evaluate.py`.

### A3. Bewaarbeleid corrections-logs (GDPR)

- **Wat:** `backend/evaluation/logger.py` (`log_correction`) bewaart transcriptie-inhoud
  (`original_text`, `polished_text`, `user_correction`) in JSONL zonder retentietermijn.
- **Waarom uitgesteld:** vereist een productbeslissing (hoelang bewaren? toestemming?).
- **Eerste stap:** retentietermijn bepalen → automatische opschoning (cron/age-check)
  toevoegen + een delete-route voor `/corrections` per session_id.
- **Bestanden:** `backend/evaluation/logger.py`, `backend/routes/evaluate.py`.

### A4. Budget/rate-limit persistent maken

- **Wat:** `src/lib/server/budget.ts` en `rate-limit.ts` houden tellers in-memory;
  op Vercel resetten die per cold start → limieten zijn per instantie, niet globaal.
- **Waarom uitgesteld:** vereist externe store (Redis/Upstash) = nieuwe dependency + config.
- **Eerste stap:** Upstash Redis koppelen, tellers daarheen verplaatsen.

### A5. `@mistralai/mistralai` + `assemblyai` → `dependencies`

- **Wat:** beide staan in `devDependencies` maar worden in productie-API-routes gebruikt.
- **Waarom uitgesteld:** build werkt nu (Vite bundelt ze); verplaatsen raakt deploy-aannames.
- **Eerste stap:** beide naar `dependencies` verplaatsen, dan een Vercel-deploy verifiëren.

---

## B. Toegankelijkheid & UX (🟠/🟢)

### B1. SetupWizard a11y (🟠)

- Geen `role="dialog"`, `aria-modal`, focus-trap of Escape-sluiten. Touch-targets <44px
  (sluitknop ~32px, download-knoppen ~28px). Tevens: 701 regels → opsplitsen in
  stap-componenten (`RamCheckStep`, `InstallStep`, `ModelDownloadStep`).
- **Bestand:** `src/lib/components/transcribe/SetupWizard.svelte`.

### B2. Touch-targets ≥44px (🟢)

- Spreker-tag mini-knoppen (`w-5 h-5` = 20px), deel/download-knoppen (`py-1.5`),
  report-length pills. Beter met visuele controle aanpassen.
- **Bestanden:** `RawTranscriptionCard.svelte` (regels ~356/376), `PolishedResultCard.svelte`,
  `+page.svelte` (~561-578).

### B3. aria-live op overige dynamische tekst (🟢)

- Live-transcriptie-preview (`WaveformDisplay.svelte`) en kopieer-feedback nog niet
  aangekondigd voor schermlezers. (RecordingStatus is al gedaan.)

### B4. Merge-dropdown keyboard-toegankelijk (🟢)

- Geen `aria-expanded`/`aria-haspopup`/`role="menu"`, geen Escape. Werkt alleen met muis.
- **Bestand:** `RawTranscriptionCard.svelte` (~376-412).

### B5. CookieConsent semantiek (🟢)

- Gebruikt `role="dialog"` zonder `aria-modal`/focus-beheer. Overweeg `role="region"`.
- **Bestand:** `src/lib/components/CookieConsent.svelte`.

### B6. Onboarding & foutherstel (🟠)

- Twee consent-pop-ups stapelen voor nieuwe gebruikers (cookies + API-consent) → sequencen.
- Geen retry-knop bij mislukte upload/polijst (alleen bij opgeslagen opname).
- Lege/initiële uitleg-state ontbreekt; `beforeunload` blokkeert ook tijdens processing.
- WhatsApp-deel via native `confirm()` → in-app modal voor consistentie.
- **Bestanden:** `+page.svelte`, `ErrorAlert.svelte`, `PolishedResultCard.svelte`.

---

## C. Security & headers (🟢)

### C1. Content-Security-Policy

- Basale security-headers zijn toegevoegd in `hooks.server.ts`, maar nog geen CSP.
- **Eerste stap:** `kit.csp` configureren in `svelte.config.js`.

### C2. CORS-default backend

- `backend/main.py:51` valt terug op `http://localhost:5173` als `CORS_ORIGINS` ontbreekt.
  Prima voor lokaal, slechte default voor een eventuele productie-backend.

---

## D. Performance (🟢, op één na)

### D1. Mistral sync-iteratie blokkeert event loop (🟠)

- `backend/routes/polish.py` (~173): `for event in stream_response` itereert synchroon
  in async context → blokkeert andere requests bij netwerklatentie.
- **Eerste stap:** async Mistral-client (`stream_async`) of de loop in `asyncio.to_thread`
  met een queue (zoals de Whisper-worker).

### D2. Waveform alloceert per frame (🟢)

- `waveform.ts` (~28-33): nieuw array + store-update elke rAF-frame (60fps).
  Pre-alloceer `Float32Array(40)` + dirty-check (skip update <2px verschil).

### D3. `toPcmInt16` maakt 2× OfflineAudioContext per chunk (🟢)

- `src/lib/utils/audio.ts` (~71-96): bestaande opname-`AudioContext` hergebruiken.

### D4. `estimatedPolishingCost` hertelt woorden bij elke raw-update (🟢)

- `transcribe.svelte.ts` (~157): `raw.split(/\s+/)` op elke SSE-token. Debounce of
  `raw.length / 5` schatting. (Prijs-per-woord is al gecorrigeerd.)

### D5. `prevStatus`-patroon fragiel + `matchMedia` per scroll (🟢)

- `+page.svelte` (~282-295): auto-scroll-effect leest ook `s.error`; `matchMedia`
  eenmalig in `onMount` lezen.

### D6. Twee httpx-clients in Limburgse twee-pass-polish (🟢)

- `backend/routes/polish.py` (~356/416): één client over beide passes openhouden.

---

## E. Onderhoud / opschoning (🟢)

### E1. Bevroren state opruimen

- `quality`/`setQuality` (nooit aangeroepen vanuit UI), `keepDialect`/`temperature`
  (getters zonder setter). Of UI-keuze herstellen, of opruimen.
- **Bestand:** `transcribe.svelte.ts`.

### E2. Grote statische pagina's opsplitsen

- `src/routes/about/+page.svelte` (1933 regels), `tech-talk/+page.svelte` (1601):
  secties naar deelcomponenten.

### E3. Store getter-boilerplate

- `transcribe.svelte.ts`: ~55 handmatige getters. Overweeg een lichter patroon
  (puur onderhoudslast, geen functioneel probleem).

### E4. Verouderde comments/docs

- `src/lib/config/models.ts` en `CLAUDE.md` verwijzen naar `backend/main.py` als
  bron van modelconfig/endpoints, maar de backend is opgesplitst in `backend/routes/*.py`.

---

## F. Tests (🟢)

### F1. Coverage meetbaar maken

- `@vitest/coverage-v8` toevoegen + `"test:coverage": "vitest run --coverage"`.

### F2. IndexedDB-tests

- `recording-db.ts` en `data-management.ts` (GDPR-relevant) testen met `fake-indexeddb`
  (nieuwe devDependency).

### F3. `file-transcription.ts`

- Grootste ongeteste service (320 regels, upload-flow): lege file, netwerkfout,
  SSE-foutevent, multi-segment succes, abort.
