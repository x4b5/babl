"""Health and setup endpoints: /health, /health/setup, /download-whisper."""

import asyncio
import os

import httpx
from fastapi import APIRouter

from config import (
    ASSEMBLYAI_API_KEY,
    MISTRAL_API_KEY,
    MISTRAL_MODELS,
    OLLAMA_MODEL_FAMILIES,
    OLLAMA_MODELS,
    WHISPER_MODEL_PATH,
)

router = APIRouter()

# --- Whisper model cache detection ---


def is_whisper_model_cached() -> bool:
    """Check if the Whisper model is already downloaded in the HuggingFace cache."""
    try:
        cache_dir = os.path.expanduser(
            "~/.cache/huggingface/hub/models--"
            + WHISPER_MODEL_PATH.replace("/", "--")
        )
        if not os.path.isdir(cache_dir):
            return False
        snapshots_dir = os.path.join(cache_dir, "snapshots")
        return os.path.isdir(snapshots_dir) and bool(os.listdir(snapshots_dir))
    except Exception:
        return False


_whisper_downloading = False
_whisper_download_lock = asyncio.Lock()


# --- Endpoints ---


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "whisper_model": WHISPER_MODEL_PATH,
        "mistral_available": bool(MISTRAL_API_KEY),
        "assemblyai_available": bool(ASSEMBLYAI_API_KEY),
        "model_config": {
            "ollama": OLLAMA_MODELS,
            "mistral": MISTRAL_MODELS,
            "whisper": WHISPER_MODEL_PATH,
        },
        "ollama_families": OLLAMA_MODEL_FAMILIES,
    }


@router.get("/health/setup")
async def health_setup():
    """Detailed setup status for the setup wizard. Checks Ollama and Whisper availability."""
    ollama_running = False
    ollama_models: dict[str, bool] = {model: False for model in OLLAMA_MODELS.values()}

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            if resp.status_code == 200:
                ollama_running = True
                data = resp.json()
                available = {m.get("name", "") for m in data.get("models", [])}
                for model in OLLAMA_MODELS.values():
                    ollama_models[model] = model in available
    except Exception:
        pass

    whisper_available = False
    try:
        import importlib

        whisper_available = importlib.util.find_spec("mlx_whisper") is not None
    except Exception:
        pass

    return {
        "backend_running": True,
        "ollama_running": ollama_running,
        "ollama_models": ollama_models,
        "whisper_available": whisper_available,
        "whisper_model_cached": is_whisper_model_cached(),
        "whisper_downloading": _whisper_downloading,
        "model_config": {
            "ollama": OLLAMA_MODELS,
            "mistral": MISTRAL_MODELS,
            "whisper": WHISPER_MODEL_PATH,
        },
    }


@router.post("/download-whisper")
async def download_whisper():
    """Start downloading the Whisper model in the background."""
    global _whisper_downloading

    async with _whisper_download_lock:
        if _whisper_downloading:
            return {"status": "already_downloading"}

        if is_whisper_model_cached():
            return {"status": "already_cached"}

        _whisper_downloading = True

    async def do_download():
        global _whisper_downloading
        try:
            from huggingface_hub import snapshot_download

            await asyncio.to_thread(snapshot_download, WHISPER_MODEL_PATH)
        finally:
            async with _whisper_download_lock:
                _whisper_downloading = False

    asyncio.create_task(do_download())
    return {"status": "started"}
