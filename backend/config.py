"""Centralized configuration: constants, model configs, API keys, clients."""

import asyncio
import logging
import os

import httpx

logger = logging.getLogger(__name__)

# --- Upload limits ---
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # 500 MB

# --- Concurrency ---
MAX_PARALLEL_POLISHING = 3
_polishing_semaphore = asyncio.Semaphore(MAX_PARALLEL_POLISHING)

# --- WebSocket heartbeat ---
HEARTBEAT_INTERVAL = 15  # Send ping every 15 seconds
HEARTBEAT_TIMEOUT = 30  # Close if no pong within 30 seconds

# --- Ollama ---
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL_FAMILIES = {
    "gemma3": {"light": "gemma3:1b", "medium": "gemma3:4b", "heavy": "gemma3:12b"},
    "qwen3": {"light": "qwen3:1.7b", "medium": "qwen3:4b", "heavy": "qwen3:14b"},
}
OLLAMA_MODELS = OLLAMA_MODEL_FAMILIES["gemma3"]

# --- Whisper ---
WHISPER_MODEL_PATH = "mlx-community/whisper-large-v3-mlx"
OFFSET_TOLERANCE = 0.5  # seconds: tolerance window for boundary segments

# --- External APIs ---
ASSEMBLYAI_API_KEY = os.environ.get("ASSEMBLYAI_API_KEY", "")
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_MODELS = {
    "light": "mistral-small-latest",
    "medium": "mistral-small-latest",
    "heavy": "mistral-large-latest",
}

# --- Mistral client (lazy-initialized) ---
_mistral_client = None


def get_mistral_client():
    global _mistral_client
    if _mistral_client is None and MISTRAL_API_KEY:
        from mistralai.client import Mistral

        _mistral_client = Mistral(api_key=MISTRAL_API_KEY)
    return _mistral_client


# --- Ollama warmup ---
async def _warmup_single(client: httpx.AsyncClient, name: str, model: str):
    """Warm up a single Ollama model."""
    try:
        logger.info("Warming up Ollama model: %s", model)
        await client.post(
            OLLAMA_URL,
            json={"model": model, "prompt": "hallo", "stream": False, "options": {"num_predict": 1}},
        )
        logger.info("  %s ready.", model)
    except Exception as e:
        logger.warning("  %s warmup failed (will load on first request): %s", model, e)


async def warmup_ollama():
    """Send a tiny request to each Ollama model so they're loaded in memory (parallel)."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        tasks = [
            _warmup_single(client, name, model)
            for name, model in OLLAMA_MODELS.items()
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
