#!/usr/bin/env bash
set -euo pipefail

# Skip banner unless FORGE_SESSION_BANNER=true
if [ "${FORGE_SESSION_BANNER:-}" != "true" ]; then
  exit 0
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           🎙️ BABL — Sessie Gestart                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  📋 Actieve regels:                                  ║"

if [ -d "$PROJECT_ROOT/.claude/rules" ]; then
  for rule in "$PROJECT_ROOT"/.claude/rules/*.md; do
    if [ -f "$rule" ]; then
      name=$(basename "$rule" .md)
      echo "║    ✓ $name"
    fi
  done
fi

echo "║                                                      ║"
echo "║  ⚡ Beschikbare commando's:                          ║"

if [ -d "$PROJECT_ROOT/.claude/commands" ]; then
  for cmd in "$PROJECT_ROOT"/.claude/commands/*.md; do
    if [ -f "$cmd" ]; then
      name=$(basename "$cmd" .md)
      echo "║    /$name"
    fi
  done
fi

if [ -d "$PROJECT_ROOT/.claude/skills" ]; then
  echo "║                                                      ║"
  echo "║  🧠 Beschikbare skills:                              ║"
  for skill_dir in "$PROJECT_ROOT"/.claude/skills/*/; do
    if [ -f "$skill_dir/SKILL.md" ]; then
      name=$(basename "$skill_dir")
      echo "║    • $name"
    fi
  done
fi

if [ -d "$PROJECT_ROOT/.claude/agents" ]; then
  echo "║                                                      ║"
  echo "║  🤖 Beschikbare agents:                              ║"
  for agent_file in "$PROJECT_ROOT"/.claude/agents/*.md; do
    if [ -f "$agent_file" ]; then
      name=$(basename "$agent_file" .md)
      echo "║    • $name"
    fi
  done
fi

echo "║                                                      ║"
echo "║  🛡️  Hooks actief:                                   ║"
echo "║    ✓ PreToolUse  → validate.sh (blokkeert gevaar)    ║"
echo "║    ✓ PostToolUse → post-edit-format.sh (auto-format) ║"
echo "║    ✓ SessionStart → deze melding                     ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
