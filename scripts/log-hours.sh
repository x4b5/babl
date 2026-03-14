#!/usr/bin/env bash
#
# post-commit hook — Automatische urenregistratie
# Berekent tijd sinds vorige activiteit, vraagt bevestiging, schrijft naar LOGBOOK.md
#

REPO_ROOT="$(git rev-parse --show-toplevel)"
ACTIVITY_FILE="$REPO_ROOT/.git/.last_activity"
LOGBOOK="$REPO_ROOT/LOGBOOK.md"
COMMIT_HASH="$(git rev-parse --short HEAD)"
COMMIT_MSG="$(git log -1 --pretty=%s)"
NOW_EPOCH="$(date +%s)"
NOW_TIME="$(date +%H:%M)"
NOW_DATE="$(date +%Y-%m-%d)"

# --- Ensure LOGBOOK.md exists ---
if [ ! -f "$LOGBOOK" ]; then
  cat > "$LOGBOOK" <<'EOF'
# Urenregistratie

| Datum | Starttijd | Eindtijd | Duur (uren) | Commit Hash | Omschrijving |
|-------|-----------|----------|-------------|-------------|--------------|
EOF
fi

# --- Calculate elapsed time ---
if [ -f "$ACTIVITY_FILE" ]; then
  LAST_EPOCH="$(cat "$ACTIVITY_FILE")"
  ELAPSED_SECONDS=$(( NOW_EPOCH - LAST_EPOCH ))

  # Cap at 4 hours — longer gaps are likely breaks, not work
  MAX_SECONDS=14400
  if [ "$ELAPSED_SECONDS" -gt "$MAX_SECONDS" ]; then
    ELAPSED_SECONDS=$MAX_SECONDS
  fi

  ELAPSED_HOURS="$(echo "scale=2; $ELAPSED_SECONDS / 3600" | bc)"
  START_TIME="$(date -r "$LAST_EPOCH" +%H:%M 2>/dev/null || date -d "@$LAST_EPOCH" +%H:%M 2>/dev/null)"
else
  # No previous activity — default to 0.5h
  ELAPSED_HOURS="0.50"
  # Estimate start time as 30 min ago
  START_EPOCH=$(( NOW_EPOCH - 1800 ))
  START_TIME="$(date -r "$START_EPOCH" +%H:%M 2>/dev/null || date -d "@$START_EPOCH" +%H:%M 2>/dev/null)"
fi

# --- Ask user for confirmation (only if terminal is attached) ---
if [ -t 0 ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║           ⏱  Urenregistratie                        ║"
  echo "╠══════════════════════════════════════════════════════╣"
  printf "║  Commit:  %-42s ║\n" "$COMMIT_HASH"
  printf "║  Bericht: %-42s ║\n" "${COMMIT_MSG:0:42}"
  printf "║  Periode: %s — %s  (%.2f uur)%-16s ║\n" "$START_TIME" "$NOW_TIME" "$ELAPSED_HOURS" ""
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""

  # Read from terminal explicitly
  exec < /dev/tty
  read -rp "Bevestig uren voor deze commit (Enter = ${ELAPSED_HOURS}): " USER_HOURS
  if [ -n "$USER_HOURS" ]; then
    ELAPSED_HOURS="$USER_HOURS"
  fi

  read -rp "Omschrijving (Enter = commit bericht): " USER_DESC
else
  USER_DESC=""
fi

# --- Determine description ---
if [ -n "$USER_DESC" ]; then
  DESCRIPTION="$USER_DESC"
else
  DESCRIPTION="$COMMIT_MSG"
fi

# --- Append to LOGBOOK.md ---
printf "| %s | %s | %s | %s | \`%s\` | %s |\n" \
  "$NOW_DATE" "$START_TIME" "$NOW_TIME" "$ELAPSED_HOURS" "$COMMIT_HASH" "$DESCRIPTION" \
  >> "$LOGBOOK"

# --- Update last activity timestamp ---
echo "$NOW_EPOCH" > "$ACTIVITY_FILE"

echo ""
echo "✓ ${ELAPSED_HOURS} uur gelogd in LOGBOOK.md"
echo ""
