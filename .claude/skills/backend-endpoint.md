# Skill: Backend Endpoint Toevoegen/Wijzigen

## Architectuur

- **Locatie**: `backend/main.py` (FastAPI)
- **Server**: `uvicorn`, poort 8000
- **CORS**: alleen `http://localhost:5173`
- **Modellen**: Whisper (faster-whisper) + Ollama (Gemma3)

## Bestaande endpoints

| Endpoint      | Method | Doel                                  |
| ------------- | ------ | ------------------------------------- |
| `/health`     | GET    | Health check                          |
| `/transcribe` | POST   | Audio → Whisper → ruwe tekst + taal   |
| `/correct`    | POST   | Ruwe tekst → Ollama → gecorrigeerd NL |

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

### Whisper transcriptie

- Gebruik `models[quality]` dict voor model selectie (light/medium)
- Altijd `language="nl"` forceren (auto-detect pikt Duits voor Limburgs)
- `initial_prompt=DIALECT_PROMPT` voor dialectbehoud
- `vad_filter=True` voor stiltedetectie
- Temp files opruimen in `finally` block

### Ollama correctie

- Chunking: `split_into_chunks(text, max_words=400)` voor lange teksten
- Semaphore: max `MAX_PARALLEL_CORRECTIONS` (3) parallelle requests
- Timeout: 600 seconden per request
- Bij fout: fallback naar originele tekst (nooit crashen)
- `full_context` meegeven als er meerdere chunks zijn

### Error handling

- `HTTPException` voor client errors (400, 413)
- Try/catch met fallback voor Ollama (graceful degradation)
- Temp files altijd opruimen (`os.unlink` in `finally`)
- Max upload: `MAX_UPLOAD_BYTES` (500 MB)

### Frontend aanroep

```typescript
// JSON endpoint
const resp = await fetch(`${BACKEND_URL}/my-endpoint`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ text, option })
});

// File upload endpoint
const formData = new FormData();
formData.append('file', blob, filename);
formData.append('quality', quality);
const resp = await fetch(`${BACKEND_URL}/my-endpoint`, {
	method: 'POST',
	body: formData
});
```

## Checklist

- [ ] Endpoint toegevoegd in `backend/main.py`
- [ ] Pydantic model voor request body (indien JSON)
- [ ] Error handling met `HTTPException`
- [ ] Temp files opgeruimd in `finally`
- [ ] Frontend fetch call toegevoegd
- [ ] CORS werkt (alleen localhost:5173)
- [ ] Getest via `curl` of frontend
