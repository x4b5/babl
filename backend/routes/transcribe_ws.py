"""Real-time WebSocket transcription via AssemblyAI streaming v3: /ws/transcribe-stream."""

import asyncio
import json
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import (
    ASSEMBLYAI_API_KEY,
    ASSEMBLYAI_STREAMING_HOST,
    HEARTBEAT_INTERVAL,
    HEARTBEAT_TIMEOUT,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Met format_turns=True stuurt AssemblyAI per turn eerst een ongeformatteerde
# end_of_turn-event en daarna een geformatteerde herhaling. Alleen die laatste
# mag een "final" worden, anders krijgt de frontend dezelfde turn twee keer.
FORMAT_TURNS = True


def map_turn_event(
    transcript: str,
    end_of_turn: bool,
    turn_is_formatted: bool,
    format_turns: bool = FORMAT_TURNS,
) -> dict | None:
    """Map een AssemblyAI v3 Turn-event naar het frontend-berichtcontract.

    Returns {"type": "partial" | "final", "text": ...} of None bij leeg transcript.
    """
    if not transcript:
        return None
    is_final = end_of_turn and (turn_is_formatted or not format_turns)
    return {"type": "final" if is_final else "partial", "text": transcript}


@router.websocket("/ws/transcribe-stream")
async def ws_transcribe_stream(websocket: WebSocket):
    """Real-time streaming transcription via AssemblyAI streaming v3 (EU-datazone)."""
    await websocket.accept()

    if not ASSEMBLYAI_API_KEY:
        await websocket.send_json({"type": "error", "message": "AssemblyAI API key not configured"})
        await websocket.close()
        return

    from assemblyai.streaming.v3 import (
        Encoding,
        SpeechModel,
        StreamingClient,
        StreamingClientOptions,
        StreamingEvents,
        StreamingParameters,
    )

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    last_pong = {"time": datetime.now()}

    # SDK-handlers draaien op de read-thread van de client, niet op de event loop —
    # vandaar call_soon_threadsafe naar de asyncio-queue.
    def on_turn(_client, event):
        message = map_turn_event(event.transcript, event.end_of_turn, event.turn_is_formatted)
        if message:
            loop.call_soon_threadsafe(queue.put_nowait, message)

    def on_error(_client, error):
        logger.error("AssemblyAI streaming error: %s", error)
        loop.call_soon_threadsafe(queue.put_nowait, {
            "type": "error",
            "message": str(error),
        })

    def on_termination(_client, _event):
        logger.info("AssemblyAI streaming session terminated")
        loop.call_soon_threadsafe(queue.put_nowait, None)

    client = StreamingClient(
        StreamingClientOptions(api_host=ASSEMBLYAI_STREAMING_HOST, api_key=ASSEMBLYAI_API_KEY)
    )
    client.on(StreamingEvents.Turn, on_turn)
    client.on(StreamingEvents.Error, on_error)
    client.on(StreamingEvents.Termination, on_termination)

    async def heartbeat():
        """Send ping every 15s, close if no pong within 30s."""
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            try:
                # Check if last pong is too old
                elapsed = (datetime.now() - last_pong["time"]).total_seconds()
                if elapsed > HEARTBEAT_TIMEOUT:
                    logger.warning("No pong for %.1fs, closing connection", elapsed)
                    await websocket.close(code=1000, reason="Heartbeat timeout")
                    break

                # Send ping
                await websocket.send_json({"type": "ping"})
            except Exception as e:
                logger.warning("Heartbeat error: %s", e)
                break

    try:
        # First message = config JSON (e.g. {"lang": "nl", "region": "mestreechs"})
        # whisper-rt detecteert taal zelf — config wordt geaccepteerd maar alleen gelogd.
        config_text = await websocket.receive_text()
        json.loads(config_text)
        logger.info("AssemblyAI RT config (alleen gelogd, whisper-rt detecteert taal): %s", config_text)

        # Connect to AssemblyAI (blocking handshake, run in thread).
        # Een afgewezen handshake komt als Error-event binnen, niet als exception.
        params = StreamingParameters(
            sample_rate=16000,
            encoding=Encoding.pcm_s16le,
            speech_model=SpeechModel.whisper_rt,
            format_turns=FORMAT_TURNS,
        )
        await asyncio.to_thread(client.connect, params)
        logger.info("AssemblyAI streaming v3 connected (host=%s)", ASSEMBLYAI_STREAMING_HOST)

        async def forward_audio():
            """Read audio chunks from frontend WebSocket, forward to AssemblyAI."""
            try:
                while True:
                    msg = await websocket.receive()
                    if msg.get("type") == "websocket.disconnect":
                        break
                    if "bytes" in msg and msg["bytes"]:
                        # stream() zet alleen op de interne write-queue — non-blocking
                        client.stream(msg["bytes"])
                    elif "text" in msg and msg["text"]:
                        data = json.loads(msg["text"])
                        if data.get("type") == "pong":
                            last_pong["time"] = datetime.now()
            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error("AssemblyAI RT audio forward error: %s", e)

        async def send_events():
            """Read transcription events from queue, send to frontend WebSocket."""
            try:
                while True:
                    event = await queue.get()
                    if event is None:
                        break
                    await websocket.send_json(event)
            except Exception as e:
                logger.error("AssemblyAI RT event send error: %s", e)

        # Run all tasks concurrently
        heartbeat_task = asyncio.create_task(heartbeat())
        audio_task = asyncio.create_task(forward_audio())
        event_task = asyncio.create_task(send_events())

        # Wait for audio to stop (client disconnected or stopped recording)
        await audio_task

        # Graceful close: server stuurt Termination (→ None in queue) en disconnect
        # joint de SDK-threads, dus hierna komen er geen events meer. Extra None als
        # vangnet voor het geval Termination uitbleef (bv. verbinding al weggevallen).
        await asyncio.to_thread(client.disconnect, terminate=True)
        queue.put_nowait(None)

        # Wait for remaining events to flush
        await event_task

    except WebSocketDisconnect:
        logger.info("AssemblyAI RT client disconnected")
    except Exception as e:
        logger.exception("AssemblyAI RT error: %s", e)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        # Clean up background task
        if "heartbeat_task" in locals():
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.to_thread(client.disconnect, terminate=True)
        except Exception:
            pass
