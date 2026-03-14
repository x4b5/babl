# Skill: Analytics Event Toevoegen

## Stappen

### 1. Definieer in `src/lib/utils/analytics.ts`

```typescript
export function trackMyEvent(param1: string, param2: number): void {
	capture('my_event', { param_1: param1, param_2: param2 });
}
```

### 2. Integreer in store of component

- **App-events** (transcriptie gestart, correctie klaar): integreer in `src/routes/transcribe/+page.svelte`
- **State-events** (fase-wisselingen): integreer in `src/lib/stores/game.svelte.ts`
- **UI-events** (klik, toggle, kopieer): integreer in het betreffende component
- Import altijd vanuit `$lib/utils/analytics.ts`

### 3. Naamconventies

- Event namen: `snake_case` (bijv. `transcription_started`, `correction_completed`, `quality_changed`)
- Properties: `snake_case` (bijv. `quality_mode`, `duration_ms`, `word_count`)

### 4. Relevante events voor BABL

| Event                     | Wanneer                   | Properties                               |
| ------------------------- | ------------------------- | ---------------------------------------- |
| `recording_started`       | Gebruiker start opname    | `quality_mode`                           |
| `recording_stopped`       | Gebruiker stopt opname    | `duration_seconds`                       |
| `file_uploaded`           | Bestand geüpload          | `file_size_kb`                           |
| `transcription_completed` | Whisper klaar             | `word_count`, `language`, `quality_mode` |
| `correction_completed`    | Ollama klaar              | `word_count`, `quality_mode`             |
| `text_copied`             | Tekst gekopieerd          | `type: 'raw' \| 'corrected'`             |
| `quality_changed`         | Kwaliteitsmodus gewisseld | `from`, `to`                             |

### 5. Privacy regels

- Geen PII (naam, email, IP) loggen
- **Nooit** de inhoud van transcripties loggen
- Alleen metadata: aantallen, duur, modus
- `person_profiles: 'never'` — geen individuele profielen

### 6. Veiligheid

- Alle analytics calls via de `capture()` wrapper (try/catch ingebouwd)
- Analytics mag NOOIT de app breken
- Bij twijfel: niet loggen
