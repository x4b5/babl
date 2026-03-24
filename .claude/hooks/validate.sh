#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Bash" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  echo '{"decision": "block", "reason": "Empty command detected."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/'; then
  echo '{"decision": "block", "reason": "Blocked: rm -rf / is not allowed."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+push.*--force'; then
  echo '{"decision": "block", "reason": "Blocked: git push --force is not allowed without explicit confirmation."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo '{"decision": "block", "reason": "Blocked: git reset --hard is not allowed without explicit confirmation."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+clean\s+-f'; then
  echo '{"decision": "block", "reason": "Blocked: git clean -f is not allowed without explicit confirmation."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE '--no-verify'; then
  echo '{"decision": "block", "reason": "Blocked: --no-verify skips safety hooks."}'
  exit 0
fi

echo '{"decision": "approve"}'
