"""BABL backend — FastAPI app with modular routes."""

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / ".env")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(transcribe_router)
app.include_router(transcribe_api_router)
app.include_router(transcribe_ws_router)
app.include_router(polish_router)
app.include_router(evaluate_router)
