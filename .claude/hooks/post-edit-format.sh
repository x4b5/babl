#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
  if echo "$FILE_PATH" | grep -qE '\.(ts|tsx|js|jsx|json|md|yaml|yml|css|html|svelte)$'; then
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
  fi
fi
