---
name: transcribe-expert
description: Raadpleeg bij wijzigingen aan de transcriptie pagina (src/routes/transcribe/+page.svelte). Bevat status flow, state variabelen, audio pipeline, dual-mode architectuur en live transcriptie patronen.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Transcribe Expert

## Locatie

`src/routes/transcribe/+page.svelte` — de hoofd-app van BABL

## Status Flow

```
idle → preparing → recording → processing → correcting → idle
```

| Status       | Wat gebeurt er                          | UI                                             |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| `idle`       | Wacht op input                          | Mic-icoon, spacebar hint                       |
| `preparing`  | Countdown (2s)                          | Countdown getal, amber kleur                   |
| `recording`  | MediaRecorder actief, waveform draait   | Stop-icoon, rode pulse, timer, waveform        |
| `processing` | Audio naar transcriptie (lokaal of API) | Spinner, bouncing dots, progress bar           |
| `correcting` | Ruwe tekst zichtbaar, correctie draait  | Ruwe tekst getoond, "Corrigeren..." shimmer    |
| `idle`       | Beide resultaten zichtbaar              | Ruwe + gecorrigeerde tekst met kopieer-buttons |

**BELANGRIJK**: Status mag alleen in deze volgorde doorlopen. Nooit een stap overslaan.

## Verwerkingsmodi

De gebruiker kiest per stap tussen lokaal en API:

| Variabele        | Opties                      | Bepaalt               |
| ---------------- | --------------------------- | --------------------- |
| `transcribeMode` | `'local'` / `'api'`         | Transcriptie backend  |
| `apiStreamMode`  | `'realtime'` / `'accurate'` | API transcriptie type |
| `mode`           | `'local'` / `'api'`         | Correctie backend     |
| `quality`        | `'light'` / `'medium'`      | Model grootte         |

## State variabelen

```typescript
let status = $state<Status>('idle'); // Huidige fase
let raw = $state(''); // Transcriptie output
let corrected = $state(''); // Correctie output
let language = $state(''); // Gedetecteerde taal
let error = $state(''); // Foutmelding
let elapsed = $state(0); // Opnametijd (seconden)
let quality = $state<'light' | 'medium'>('light'); // Kwaliteitsmodus
let transcribeMode = $state<'local' | 'api'>('local'); // Transcriptie modus
let mode = $state<'local' | 'api'>('local'); // Correctie modus

// Live transcriptie (incrementeel)
let partialText = $state(''); // Lopende live transcriptie
let lastSentChunkIndex = $state(0); // Chunks al verstuurd
let liveAudioDuration = $state(0); // Seconden audio bevestigd
const OVERLAP_CHUNKS = 6; // 3s overlap (6 × 500ms)
const CHUNK_INTERVAL_MS = 500; // MediaRecorder timeslice
```

## Audio Pipeline

### 1. Opname starten (`startRecording`)

- `navigator.mediaDevices.getUserMedia({ audio: true })`
- `MediaRecorder` met best beschikbare codec (webm/opus > webm > ogg > mp4)
- `startWaveform(stream)` voor live visualisatie via Web Audio API
- `mediaRecorder.start(500)` — chunks elke 500ms
- Start live transcriptie afhankelijk van modus:
  - Lokaal: `startLiveTranscription()` → incrementeel via `/transcribe-live`
  - API realtime: `startRealtimeStream()` → WebSocket via AssemblyAI

### 2. Live transcriptie (lokaal, incrementeel)

- Elke 5 seconden: stuur alleen **nieuwe chunks** (+ 3s overlap)
- Backend filtert segmenten op `offset` → retourneert alleen nieuwe tekst
- Frontend append nieuwe tekst aan `partialText`
- Constant ~8s audio per send, ongeacht opnameduur

### 3. Opname stoppen (`stopRecording`)

- `mediaRecorder.stop()` triggert `onstop` callback
- Waveform stoppen, stream tracks stoppen
- Als `partialText` beschikbaar: gebruik als `raw` (stuur alleen laatste restje)
- Anders: volledige audio downsampling naar 16kHz mono WAV (`downsampleToWav`)

### 4. Verwerking — dual mode

**Lokaal** (`sendAudioLocal`):

- POST naar `/transcribe` (SSE stream, 30s segmenten)
- Timeout: 30 minuten
- Resultaat: segmenten worden gestreamd naar `raw`

**API** (`sendAudioApi`):

- Submit naar `/api/transcribe-api` → krijg `transcriptId`
- Poll `/api/transcribe-api/[id]` elke 3 seconden
- Max polling: 60 minuten
- Resultaat: volledige tekst in `raw`

### 5. Correctie (`fetchCorrection`)

- Draait async terwijl ruwe tekst al zichtbaar is
- Lokaal: POST naar `/correct` (Ollama, SSE token stream)
- API: POST naar `/api/correct` (Mistral, SSE token stream)
- Bij fout: fallback naar ruwe tekst (nooit crashen)
- Zet status terug naar `idle` in `finally`

## Keyboard Shortcuts

- **Spacebar**: toggle opname (alleen als `e.target === document.body`)
- Voorkom conflicten: check of focus niet in een input/textarea zit

## File Upload

- Via hidden `<input type="file" accept="audio/*">`
- Zelfde pipeline als opname: downsample → sendAudio

## Wijzigingen aanbrengen

### Nieuwe UI toevoegen

- Plaats binnen de bestaande `<div class="mx-auto max-w-3xl px-4 py-16">` container
- Gebruik `glass` of `gradient-border-card` voor nieuwe secties
- Animatie: `animate-fade-in` of `animate-slide-up`
- Status-afhankelijke UI: `{#if status === '...'}` blocks

### Nieuwe functionaliteit

- Audio gerelateerd: pas op met `audioContext` lifecycle (close in cleanup)
- Nieuwe backend call: volg het `sendAudioLocal`/`sendAudioApi` patroon
- Error handling: zet `error` state, zet `status` terug naar `idle`
- Live transcriptie: werk incrementeel (nooit alle audio opnieuw sturen)

### Wat NIET te doen

- Status flow niet wijzigen zonder overleg
- `LOCAL_BACKEND_URL` niet hardcoden op andere poort
- Geen synchrone operaties in de audio pipeline
- MediaRecorder niet starten zonder MIME type check
- Waveform animationFrame altijd opruimen
- Nooit alle accumulated chunks opnieuw transcriberen (O(n²) probleem)
