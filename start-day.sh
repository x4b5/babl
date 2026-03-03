#!/usr/bin/env bash
#
# start-day.sh — Start je werkdag
# Slaat de huidige tijd op zodat de eerste commit een accurate starttijd heeft.
#

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$REPO_ROOT" ]; then
  echo "Fout: dit is geen git-repository."
  exit 1
fi

ACTIVITY_FILE="$REPO_ROOT/.git/.last_activity"
NOW="$(date +%s)"
NOW_READABLE="$(date +%H:%M)"

echo "$NOW" > "$ACTIVITY_FILE"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Werkdag gestart om ${NOW_READABLE}                          ║"
echo "║  De timer loopt — je eerste commit wordt getrackt.  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
