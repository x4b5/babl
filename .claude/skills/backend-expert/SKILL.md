---
name: backend-expert
description: Raadpleeg bij het toevoegen of wijzigen van backend endpoints in FastAPI of SvelteKit API routes. Bevat endpoint overzicht, patronen voor Whisper/Ollama/Mistral, en dual-mode conventies.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Backend Expert

## Architectuur

- **Locatie**: `backend/main.py` (FastAPI) + `src/routes/api/` (SvelteKit API routes)
- **Server**: `uvicorn`, poort 8000 (lokaal) / Vercel (API routes)
- **CORS**: alleen `http://localhost:5173`
- **Lokale modellen**: mlx-whisper (large-v3, Apple Silicon MLX) + Ollama (Gemma3)
- **API modellen**: AssemblyAI (transcriptie, EU Dublin) + Mistral AI (correctie, EU servers)

## Bestaande endpoints

### FastAPI (lokaal, poort 8000)

| Endpoint                | Method    | Doel                                             |
| ----------------------- | --------- | ------------------------------------------------ |
| `/health`               | GET       | Health check + beschikbaarheid lokaal/API        |
| `/transcribe`           | POST      | Audio → Whisper (30s segmenten, SSE stream)      |
| `/transcribe-live`      | POST      | Audio → Whisper (incrementeel, offset filtering) |
| `/correct`              | POST      | Tekst → Ollama of Mistral (SSE token stream)     |
| `/ws/transcribe-stream` | WebSocket | Real-time streaming via AssemblyAI               |

### SvelteKit API routes (Vercel-compatible)

| Route                      | Method | Doel                                      |
| -------------------------- | ------ | ----------------------------------------- |
| `/api/health`              | GET    | API keys beschikbaarheid                  |
| `/api/transcribe-api`      | POST   | Submit audio → AssemblyAI, retourneert ID |
| `/api/transcribe-api/[id]` | GET    | Poll transcriptie status                  |
| `/api/correct`             | POST   | Tekst → Mistral correctie (SSE stream)    |

## Nieuw endpoint toevoegen

### 1. Request model (indien JSON body)

```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    text: str
    option: str = "default"
```

### 2. Endpoint functie

```python
@app.post("/my-endpoint")
async def my_endpoint(req: MyRequest):
    try:
        # logica hier
        return {"result": "..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. Voor file uploads

```python
@app.post("/my-upload")
async def my_upload(
    file: UploadFile = File(...),
    quality: str = Form("light"),
):
    content = await file.read()
    # verwerk content
```

## Patronen & conventies

### Whisper transcriptie (mlx-whisper)

- Model: `mlx-community/whisper-large-v3-mlx` (Apple Silicon GPU via MLX)
- Altijd `language="nl"` forceren voor Limburgs (auto-detect pikt Duits)
- `initial_prompt` uit `dialects.py` voor dialectherkenning
- Segmentverwerking: `/transcribe` splitst audio in 30s segmenten via ffmpeg
- Live modus: `/transcribe-live` met `offset` parameter voor incrementele transcriptie
- Temp files opruimen in `finally` block

### Correctie — dual mode

**Lokaal (Ollama):**

- Modellen: `gemma3:4b` (light), `gemma3:12b` (medium)
- Chunking: `split_into_chunks(text, max_words=400)`
- Semaphore: max `MAX_PARALLEL_CORRECTIONS` (3) parallelle requests
- Timeout: 600 seconden per request
- `full_context` meegeven als 2-5 chunks

**API (Mistral):**

- Modellen: `mistral-small-latest` (light), `mistral-large-latest` (medium)
- Rate limiting: exponential backoff (max 8 retries)
- Streaming via `client.chat.stream`

### Error handling

- `HTTPException` voor client errors (400, 413)
- Try/catch met fallback (graceful degradation, nooit crashen)
- Temp files altijd opruimen (`os.unlink` in `finally`)
- Max upload: `MAX_UPLOAD_BYTES` (500 MB, ~2+ uur audio)

### Frontend aanroep

```typescript
const LOCAL_BACKEND_URL = 'http://localhost:8000';

// Lokaal endpoint (FastAPI)
const resp = await fetch(`${LOCAL_BACKEND_URL}/my-endpoint`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ text, option })
});

// API endpoint (SvelteKit route, werkt op Vercel)
const resp = await fetch('/api/my-endpoint', {
	method: 'POST',
	body: formData
});
```

## Checklist

- [ ] Endpoint toegevoegd in `backend/main.py` of `src/routes/api/`
- [ ] Pydantic model voor request body (indien JSON)
- [ ] Error handling met `HTTPException` / SvelteKit error()
- [ ] Temp files opgeruimd in `finally`
- [ ] Frontend fetch call toegevoegd
- [ ] Dual-mode overwogen (lokaal + API variant nodig?)
- [ ] Getest via `curl` of frontend
