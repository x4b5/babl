"""Real-time WebSocket transcription via AssemblyAI: /ws/transcribe-stream."""

import asyncio
import json
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import ASSEMBLYAI_API_KEY, HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/transcribe-stream")
async def ws_transcribe_stream(websocket: WebSocket):
    """Real-time streaming transcription via AssemblyAI WebSocket API."""
    await websocket.accept()

    if not ASSEMBLYAI_API_KEY:
        await websocket.send_json({"type": "error", "message": "AssemblyAI API key not configured"})
        await websocket.close()
        return

    import assemblyai as aai

    aai.settings.api_key = ASSEMBLYAI_API_KEY

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    last_pong = {"time": datetime.now()}

    def on_data(transcript):
        is_final = isinstance(transcript, aai.RealtimeFinalTranscript)
        if transcript.text:
            loop.call_soon_threadsafe(queue.put_nowait, {
                "type": "final" if is_final else "partial",
                "text": transcript.text,
            })

    def on_error(error):
        logger.error("AssemblyAI realtime error: %s", error)
        loop.call_soon_threadsafe(queue.put_nowait, {
            "type": "error",
            "message": str(error),
        })

    def on_close():
        logger.info("AssemblyAI realtime connection closed")
        loop.call_soon_threadsafe(queue.put_nowait, None)

    transcriber = aai.RealtimeTranscriber(
        sample_rate=16000,
        encoding=aai.AudioEncoding.pcm_s16le,
        on_data=on_data,
        on_error=on_error,
        on_close=on_close,
    )

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
        config_text = await websocket.receive_text()
        config = json.loads(config_text)
        lang = config.get("lang", "li")
        region = config.get("region", "limburgs")
        logger.info("AssemblyAI RT config: %s", config_text)

        # Connect to AssemblyAI (blocking, run in thread)
        await asyncio.to_thread(transcriber.connect)
        logger.info("AssemblyAI realtime connected")

        async def forward_audio():
            """Read audio chunks from frontend WebSocket, forward to AssemblyAI."""
            try:
                while True:
                    msg = await websocket.receive()
                    if msg.get("type") == "websocket.disconnect":
                        break
                    if "bytes" in msg and msg["bytes"]:
                        await asyncio.to_thread(transcriber.stream, msg["bytes"])
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

        # Close AssemblyAI connection (triggers on_close -> queue gets None)
        await asyncio.to_thread(transcriber.close)

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
            await asyncio.to_thread(transcriber.close)
        except Exception:
            pass
