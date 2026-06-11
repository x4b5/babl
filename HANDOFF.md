# HANDOFF

STATUS: BEZIG

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

- (nog niets — vorige taak Fase 0.1 + B1/R2-fix is afgerond, zie git-log t/m `21970fe`)

## Waar gebleven

- Async-paden gaan al naar het EU-endpoint (commit `099cb82`); alleen de
  WS-streaming-route is nog stuk en niet-EU.

## Volgende stappen

1. Onderzoek: lees `backend/routes/transcribe_ws.py`, `src/lib/services/realtime-stream.ts`
   en de streaming-v3-module in de geïnstalleerde SDK; check taalondersteuning (nl);
   noteer het migratieplan in deze HANDOFF.
2. Migreer de route naar streaming v3 met EU-host; berichtcontract met frontend ongewijzigd.
3. Tests: bestaande backend-tests groen houden, dekking voor de nieuwe route waar dat
   zonder live API kan (mocken); frontend-check + Definition of Done; afronden.

## Openstaande problemen of twijfels

- S13 + S14 (glossary) blijft GEPARKEERD — niet autonoom oppakken, wacht op gebruiker.
- Live verificatie tegen het echte AssemblyAI-endpoint kan niet autonoom (API-key/kosten);
  noteer expliciet wat de gebruiker handmatig moet natesten.
