---
description: Security and privacy guardrails — always active
---

# Safety Rules

## Secrets

- **Never** commit `.env`, `.env.*`, or files in `secrets/` to git.
- **Never** log, print, or expose secret values in output.
- If a secret is needed, reference `.env.example` for the key name.

## Protected Data

- **Never** modify files in `src/lib/data/` without explicit user instruction.
- These files contain static game/app data and are considered sacred.

## Privacy

- **Never** log or transmit PII (personally identifiable information).
- Processing can be local (Whisper + Ollama) or API (AssemblyAI + Mistral). API mode uses only EU servers (Dublin + EU). Never log transcription content.
- Analytics via `src/lib/utils/analytics.ts` wrapper only — never log transcription content.

## Destructive Commands

- **Never** run `rm -rf`, `--force`, or `--no-verify` without explicit user confirmation.
- **Never** push to `main` or `master` without user confirmation.
- **Never** run `git reset --hard` or `git clean -f` without confirmation.

## Network

- **Never** curl, fetch, or connect to unknown/untrusted URLs without user approval.
- Only access URLs that are explicitly provided by the user or defined in project config.

## General

- When in doubt, ask. A confirmation prompt is always cheaper than data loss.
- Prefer reversible actions over irreversible ones.
