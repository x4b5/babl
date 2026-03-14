# Skill: Transcribe Pagina Wijzigen

## Locatie

`src/routes/transcribe/+page.svelte` — de hoofd-app van BABL

## Status Flow

```
idle → recording → processing → correcting → idle
```

| Status       | Wat gebeurt er                          | UI                                             |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| `idle`       | Wacht op input                          | Mic-icoon, spacebar hint                       |
| `recording`  | MediaRecorder actief, waveform draait   | Stop-icoon, rode pulse, timer, waveform        |
| `processing` | Audio naar `/transcribe` (Whisper)      | Spinner, bouncing dots, "Transcriberen..."     |
| `correcting` | Ruwe tekst zichtbaar, `/correct` draait | Ruwe tekst getoond, "Corrigeren..." shimmer    |
| `idle`       | Beide resultaten zichtbaar              | Ruwe + gecorrigeerde tekst met kopieer-buttons |

**BELANGRIJK**: Status mag alleen in deze volgorde doorlopen. Nooit een stap overslaan.

## State variabelen

```typescript
let status = $state<Status>('idle');        // Huidige fase
let raw = $state('');                        // Whisper output
let corrected = $state('');                  // Ollama output
let language = $state('');                   // Gedetecteerde taal
let error = $state('');                      // Foutmelding
let elapsed = $state(0);                     // Opnametijd (seconden)
let quality = $state<'light' | 'medium'>('light'); // Kwaliteitsmodus
let waveformBars = $state<number[]>(...);    // Live audio levels
```

## Audio Pipeline

### 1. Opname starten (`startRecording`)

- `navigator.mediaDevices.getUserMedia({ audio: true })`
- `MediaRecorder` met best beschikbare codec (webm/opus > webm > ogg > mp4)
- `startWaveform(stream)` voor live visualisatie via Web Audio API
- `mediaRecorder.start(500)` — chunks elke 500ms

### 2. Opname stoppen (`stopRecording`)

- `mediaRecorder.stop()` triggert `onstop` callback
- Waveform stoppen, stream tracks stoppen
- Audio downsampling naar 16kHz mono WAV (`downsampleToWav`)
- Fallback: origineel bestand als downsampling faalt

### 3. Verwerking (`sendAudio`)

- `FormData` met audio blob + quality
- POST naar `/transcribe` → toont `raw` direct
- Daarna POST naar `/correct` → toont `corrected`
- Timeout: 30 minuten voor transcriptie

### 4. Correctie (`fetchCorrection`)

- Draait async terwijl ruwe tekst al zichtbaar is
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
- Nieuwe backend call: volg het `sendAudio`/`fetchCorrection` patroon
- Error handling: zet `error` state, zet `status` terug naar `idle`

### Wat NIET te doen

- Status flow niet wijzigen zonder overleg
- `BACKEND_URL` niet hardcoden op andere poort
- Geen synchrone operaties in de audio pipeline
- MediaRecorder niet starten zonder MIME type check
- Waveform animationFrame altijd opruimen
