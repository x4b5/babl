#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Creating virtual environment..."
python3 -m venv .venv

echo "Installing dependencies..."
source .venv/bin/activate
pip install -r requirements.txt

echo ""
echo "Setup complete! To start the backend:"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "Make sure Ollama is running with qwen3:27b:"
echo "  ollama run qwen3:27b"
