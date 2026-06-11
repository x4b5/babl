# HANDOFF

STATUS: KLAAR

> Overdracht tussen autonome iteraties. Elke iteratie leest dit bestand eerst en werkt het
> bij na afloop. STATUS is altijd een van: BEZIG | KLAAR | GEBLOKKEERD.
> KLAAR = hele taak af, loop mag stoppen. GEBLOKKEERD = escalatie nodig, loop stopt.

## Huidige taak

Live-streaming-route repareren: `backend/routes/transcribe_ws.py` gebruikt
`aai.RealtimeTranscriber`, maar die bestaat niet meer in de geïnstalleerde SDK
(assemblyai 0.64.4) — de route crasht bij gebruik. Migreer naar de streaming-v3-API
(`assemblyai.streaming.v3`, host `streaming.eu.assemblyai.com` voor EU-dataresidentie,
in lijn met commit `099cb82`). Het WebSocket-berichtcontract met de frontend
(`src/lib/services/realtime-stream.ts`) moet intact blijven: types `partial`/`final`/
`error` en het bestaande ping/pong-gedrag.

**Verifieer vóór het bouwen** of streaming v3 Nederlands ondersteunt (de SDK-code in
`backend/.venv/.../assemblyai/streaming/v3/` en de docs); zo niet → STATUS GEBLOKKEERD
met bevindingen, niet half migreren.

## Wat is af

- Stap 1 (onderzoek + migratieplan) — zie "Onderzoeksbevindingen" en "Migratieplan"
  hieronder. Commit: `f7c0927`.
- Stap 2 (migratie route) — `backend/routes/transcribe_ws.py` gebruikt nu
  `StreamingClient` uit `assemblyai.streaming.v3` met `speech_model=whisper_rt`
  op EU-host `streaming.eu.assemblyai.com` (constante `ASSEMBLYAI_STREAMING_HOST`
  in `backend/config.py`). Berichtcontract ongewijzigd. Commit: `c58f7ea`.
  - **Afwijking van het plan (bewust)**: met `format_turns=True` komt elke turn
    twee keer met `end_of_turn=True` binnen (eerst ongeformatteerd, dan
    geformatteerd). Plan-mapping "end_of_turn → final" zou dubbele finals geven
    en de frontend verdubbelt dan `liveSegments`. Daarom: final = `end_of_turn`
    én (`turn_is_formatted` óf formattering uit) — pure functie `map_turn_event`
    in de route, makkelijk te testen.
  - Bestaande backend-tests groen (170 passed), import + mapping-sanity-check OK,
    frontend Definition of Done groen.
- Stap 3 (tests) — `backend/tests/test_streaming_v3.py` met 13 tests:
  `map_turn_event` (leeg transcript, partial, ongeformatteerde vs. geformatteerde
  end_of_turn, `format_turns=False`-pad, default volgt `FORMAT_TURNS`) en het
  berichtcontract met de frontend (`partial`/`final` exact `{type, text}`,
  `error` als `{type, message}`, JSON-serialiseerbaar). Geen live API.
  Backend: 183 passed. Frontend Definition of Done groen. Commit: `82eebdf`.

## Onderzoeksbevindingen (stap 1, 2026-06-11)

- **Waarom kapot**: `backend/routes/transcribe_ws.py:54` gebruikt `aai.RealtimeTranscriber`
  — bestaat niet meer in assemblyai 0.64.4. Route crasht zodra een client verbindt.
- **v3-SDK-oppervlak** (`backend/.venv/.../assemblyai/streaming/v3/`):
  - `StreamingClient(StreamingClientOptions(api_host=..., api_key=...))` — sync client,
    draait eigen read/write-threads. Er is ook een `AsyncStreamingClient` (asyncio-natief).
  - Handlers registreren vóór `connect()`: `client.on(StreamingEvents.Turn|Error|Termination|Begin, fn)`.
  - `connect(StreamingParameters(sample_rate=..., encoding=Encoding.pcm_s16le, speech_model=...))`,
    daarna `client.stream(bytes)`, afsluiten met `client.disconnect(terminate=True)`.
  - `TurnEvent` heeft `transcript`, `end_of_turn`, `turn_is_formatted` → partial/final-mapping.
- **Taalondersteuning (kritiek)**: `universal-streaming-multilingual` ondersteunt alleen
  en/es/fr/de/it/pt — **géén Nederlands**. Maar `SpeechModel.whisper_rt` ("whisper-rt",
  aanwezig in deze SDK-versie) ondersteunt 99 talen incl. Nederlands via automatische
  taaldetectie. Geen taalparameter meesturen (docs: niet ondersteund bij whisper-rt);
  optioneel `language_detection=True` voor language-metadata op turns.
  → Dus NIET geblokkeerd: migreren met `speech_model=whisper_rt`.
- **EU-host**: EU-datazone = `streaming.eu.assemblyai.com` (`wss://.../v3/ws`), via
  `StreamingClientOptions(api_host="streaming.eu.assemblyai.com")`. De docs bevestigen
  niet expliciet dat whisper-rt in de EU-zone beschikbaar is — live natesten (gebruiker).
- Bronnen: assemblyai.com/docs/streaming/universal-streaming/multilingual-transcription,
  assemblyai.com/docs/streaming/endpoints-and-data-zones, SDK-broncode 0.64.4.

## Migratieplan (stap 2)

In `backend/routes/transcribe_ws.py`, met ongewijzigd frontend-contract
(`partial`/`final`/`error` + ping/pong, zie `src/lib/services/realtime-stream.ts`):

1. Vervang `aai.RealtimeTranscriber` door de sync `StreamingClient` uit
   `assemblyai.streaming.v3` — kleinste diff: de bestaande architectuur
   (callbacks uit SDK-threads → `loop.call_soon_threadsafe` → asyncio-queue) blijft.
2. Opties: `StreamingClientOptions(api_host="streaming.eu.assemblyai.com", api_key=ASSEMBLYAI_API_KEY)`.
   Zet de host als constante in `backend/config.py` (naast bestaande EU-config van `099cb82`).
3. Params: `StreamingParameters(sample_rate=16000, encoding=Encoding.pcm_s16le,
speech_model=SpeechModel.whisper_rt, format_turns=True)`. Geen taalparameter.
4. Event-mapping: `Turn` met `end_of_turn=False` → `{"type": "partial", "text": transcript}`;
   `end_of_turn=True` → `{"type": "final", ...}`; `Error` → `{"type": "error", "message": ...}`;
   `Termination` → `None` in queue (flush + afronden). Lege transcripts overslaan (zoals nu).
5. Heartbeat/ping-pong en `forward_audio`/`send_events`-structuur ongewijzigd laten;
   `transcriber.connect/stream/close` wordt `client.connect(params)/client.stream(b)/
client.disconnect(terminate=True)` (sync client streamt non-blocking via interne queue —
   `asyncio.to_thread` alleen nog rond connect/disconnect).
6. `config`-bericht van frontend (`lang`/`region`) blijft geaccepteerd maar wordt alleen
   gelogd (whisper-rt detecteert taal zelf).

## Waar gebleven

- Taak volledig af: migratie (`c58f7ea`) + tests (`82eebdf`). Alle checks groen
  (backend 183 passed, frontend check/test/format groen). Wat rest zijn de
  handmatige natest-punten hieronder — die kunnen niet autonoom.

## Volgende stappen

1. (Gebruiker, handmatig) De natest-punten onder "Openstaande problemen of
   twijfels" live verifiëren met een echte API-key.
2. Daarna: volgende open taak uit `docs/product-backlog.md` (S13/S14 glossary
   blijft GEPARKEERD — niet autonoom oppakken).

## Openstaande problemen of twijfels

- S13 + S14 (glossary) blijft GEPARKEERD — niet autonoom oppakken, wacht op gebruiker.
- Live verificatie tegen het echte AssemblyAI-endpoint kan niet autonoom (API-key/kosten);
  noteer expliciet wat de gebruiker handmatig moet natesten.
- **Handmatig natesten (gebruiker)**: (a) of `whisper-rt` daadwerkelijk werkt op de
  EU-host `streaming.eu.assemblyai.com` — niet expliciet in de docs bevestigd;
  (b) transcriptiekwaliteit van whisper-rt op Limburgs/Nederlands; (c) of whisper-rt
  extra kosten/beta-beperkingen heeft op dit account; (d) of er bij live gebruik
  daadwerkelijk geformatteerde turns binnenkomen (`turn_is_formatted=True`) —
  zo niet, dan komen er nooit finals; oplossing: `FORMAT_TURNS = False` zetten
  bovenin `backend/routes/transcribe_ws.py`.
