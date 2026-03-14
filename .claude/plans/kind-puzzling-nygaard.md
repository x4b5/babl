# Plan: 2 uur opname-support + limiet-waarschuwingen

## Context

De huidige setup heeft geen expliciete limieten en kan in de praktijk max ~5-10 min audio aan vanwege:

- Browser fetch timeout (geen expliciete timeout)
- Ollama `num_predict: 512` tokens — kapt af bij lange tekst
- Geen progress-feedback tijdens verwerking
- Geen max-duur op de frontend

De gebruiker wil 2 uur opname ondersteunen en tijdig gewaarschuwd worden wanneer het limiet nadert.

## Aanpak

### 1. Frontend: opnamelimiet + waarschuwingen

**Bestand:** `src/routes/transcribe/+page.svelte`

- `MAX_DURATION = 7200` (2 uur in seconden)
- Waarschuwing bij **1:50:00** (10 min resterend) — oranje tekst naast timer
- Kritieke waarschuwing bij **1:55:00** (5 min) — rode tekst + knop pulseert sneller
- **Auto-stop bij 2:00:00** — stopt opname automatisch, toont melding
- Visuele tijdsindicator: toon resterende tijd wanneer < 10 min resterend
- File upload: check `duration` via Web Audio API `decodeAudioData`, warn als > 2 uur

### 2. Frontend: SSE progress tijdens verwerking

**Bestand:** `src/routes/transcribe/+page.svelte`

- Vervang `fetch()` door `EventSource` / `fetch` met `ReadableStream` voor SSE
- Toon voortgang: "Transcriptie: X segmenten verwerkt..."
- Toon tussenresultaten: raw tekst verschijnt live terwijl Whisper segmenten oplevert
- Progress bar of percentage-indicator
- Langere timeout (geen browser-imposed cutoff met SSE)

### 3. Backend: SSE streaming endpoint

**Bestand:** `backend/main.py`

- Nieuw endpoint `POST /transcribe` wordt SSE (StreamingResponse)
- `faster-whisper` levert segmenten als generator — stream elk segment als SSE event:
  ```
  event: segment
  data: {"text": "...", "start": 0.0, "end": 5.2, "progress": 0.15}
  ```
- Na alle segmenten: stream correctie-resultaat
  ```
  event: corrected
  data: {"text": "...", "language": "nl"}
  ```
- Final event:
  ```
  event: done
  data: {}
  ```

### 4. Backend: Ollama chunking + verhoogde limieten

**Bestand:** `backend/main.py`

- **Chunk correctie**: splits raw transcriptie in blokken van ~800 woorden, stuur elk apart naar Ollama
- Verhoog `num_predict` naar `2048` per chunk (genoeg voor ~800 woorden output)
- Verhoog httpx timeout naar `300s` (5 min per chunk)
- Voeg audio-duurcheck toe: bereken duur via `faster-whisper` info, reject als > 2:05:00 (kleine marge)
- Max filesize check: 500MB

### 5. Backend: max bestandsgrootte

**Bestand:** `backend/main.py`

- Check `len(content)` na `file.read()`, return 413 als > 500MB
- Return duidelijke foutmelding: "Bestand te groot (max 500MB)"

## Bestanden die wijzigen

1. `src/routes/transcribe/+page.svelte` — limietwaarschuwingen, SSE client, progress UI
2. `src/app.css` — waarschuwingsstijlen (oranje/rode timer, progress bar)
3. `backend/main.py` — SSE streaming, chunked correctie, limieten

## Niet wijzigen

- Alle bestaande visuele styling (orbs, conic borders, waveform, etc.)
- Recording/upload/quality toggle logica (alleen limiet-checks toevoegen)
- DIALECT_PROMPT en SYSTEM_PROMPT inhoud
- Privacy sectie

## Verificatie

- `npx svelte-check` — 0 errors
- Backend start zonder errors
- Opname toont waarschuwing bij 1:50:00 (test met verlaagde drempels)
- Auto-stop bij 2:00:00
- SSE progress zichtbaar tijdens verwerking
- Lange audio (~10+ min) verwerkt correct met tussenresultaten
- File upload > 500MB wordt afgewezen met melding
