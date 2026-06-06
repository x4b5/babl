#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# --- Cleanup on exit ---
cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$UVICORN_PID" ] && kill "$UVICORN_PID" 2>/dev/null && echo "Stopped backend"
  [ -n "$OLLAMA_PID" ] && kill "$OLLAMA_PID" 2>/dev/null && echo "Stopped ollama"
  wait 2>/dev/null
}
trap cleanup EXIT

# --- 1. Ollama (optioneel — alleen nodig voor verslaglegging) ---
if command -v ollama &>/dev/null; then
  if curl -sf http://localhost:11434/api/tags &>/dev/null; then
    echo "Ollama is already running"
  else
    echo "Starting ollama..."
    ollama serve &>/dev/null &
    OLLAMA_PID=$!
    for i in $(seq 1 30); do
      curl -sf http://localhost:11434/api/tags &>/dev/null && break
      sleep 1
    done
    echo "Ollama started (pid $OLLAMA_PID)"
  fi
else
  echo "Ollama niet gevonden — transcriptie werkt, verslaglegging nog niet."
  echo "Installeer later via https://ollama.com"
fi

# --- 2. Backend venv ---
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "Backend venv not found, running setup..."
  bash "$BACKEND_DIR/setup.sh"
fi

# --- 3. Start backend ---
echo "Starting backend..."
source "$BACKEND_DIR/.venv/bin/activate"
uvicorn main:app --reload --app-dir "$BACKEND_DIR" &
UVICORN_PID=$!
echo "Backend started (pid $UVICORN_PID)"

# --- 4. Start frontend (foreground, Ctrl+C stops everything) ---
echo ""
echo "Starting frontend..."
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173/transcribe"
echo ""
cd "$ROOT_DIR"
npx vite dev --open /transcribe
