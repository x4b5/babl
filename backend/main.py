"""BABL backend — FastAPI app with modular routes."""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import warmup_ollama  # noqa: E402
from routes.health import router as health_router  # noqa: E402
from routes.transcribe import router as transcribe_router  # noqa: E402
from routes.transcribe_api import router as transcribe_api_router  # noqa: E402
from routes.transcribe_ws import router as transcribe_ws_router  # noqa: E402
from routes.polish import router as polish_router  # noqa: E402
from routes.evaluate import router as evaluate_router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up Ollama models in background
    asyncio.create_task(warmup_ollama())
    yield


app = FastAPI(lifespan=lifespan)

_cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(transcribe_router)
app.include_router(transcribe_api_router)
app.include_router(transcribe_ws_router)
app.include_router(polish_router)
app.include_router(evaluate_router)
