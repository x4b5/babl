#!/usr/bin/env bash
#
# autonomous-loop.sh — Roept claude -p per iteratie aan met verse context.
# Staat (HANDOFF.md, backlog, git) leeft op schijf; elke iteratie doet precies één subtaak.
#
# Gebruik: bash scripts/autonomous-loop.sh [max_iteraties]   (default: 5)
#
# Stopt wanneer:
#   - HANDOFF.md STATUS: KLAAR of GEBLOKKEERD bevat
#   - de werkmap na een iteratie niet schoon is (LOGBOOK.md uitgezonderd —
#     de post-commit hook schrijft daar na elke commit een regel bij)
#   - claude met een fout eindigt
#   - het maximum aantal iteraties is bereikt

set -euo pipefail
cd "$(dirname "$0")/.."

MAX_ITERATIONS="${1:-5}"
LOGDIR="logs/autonomous"
mkdir -p "$LOGDIR"

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != autonomous/* ]]; then
	echo "FOUT: niet op een autonomous/* branch (huidige: $BRANCH). Gestopt."
	exit 1
fi

# Schoon-check die de door de post-commit hook aangeraakte LOGBOOK.md negeert.
dirty_files() {
	git status --porcelain | grep -v ' LOGBOOK\.md$' || true
}

if [[ -n "$(dirty_files)" ]]; then
	echo "FOUT: werkmap niet schoon. Commit of stash eerst:"
	dirty_files
	exit 1
fi

PROMPT='Lees CLAUDE.md (vooral de sectie "Guardrails (autonome sessies)") en HANDOFF.md.
Voer precies EEN subtaak uit: de bovenste stap uit "Volgende stappen" in HANDOFF.md.
Is die lijst leeg, pak dan de volgende open taak uit docs/product-backlog.md.

Werkwijze:
1. Voer de subtaak volledig uit volgens de guardrails.
2. Draai de Definition of Done: npm run check && npm run test:run && npm run format:check.
3. Commit (conventional commit, Nederlands). Neem een eventueel gewijzigde LOGBOOK.md mee.
4. Werk HANDOFF.md bij: wat is af (commit-hash), waar gebleven, volgende stappen, twijfels.
   Zet STATUS op KLAAR als de hele taak in "Huidige taak" af is, op GEBLOKKEERD als je
   vastloopt, escalatie nodig hebt of 3x dezelfde fout zag — anders BEZIG.
5. Commit ook de HANDOFF.md-wijziging.

Stop daarna. Doe niet meer dan een subtaak per sessie.'

for i in $(seq 1 "$MAX_ITERATIONS"); do
	echo ""
	echo "=== Iteratie $i/$MAX_ITERATIONS — $(date '+%Y-%m-%d %H:%M:%S') ==="
	LOGFILE="$LOGDIR/$(date '+%Y%m%d-%H%M%S')-iter$i.log"

	if ! claude -p "$PROMPT" --permission-mode acceptEdits 2>&1 | tee "$LOGFILE"; then
		echo "Claude eindigde met een fout. Loop gestopt na iteratie $i — zie $LOGFILE."
		exit 1
	fi

	if [[ -n "$(dirty_files)" ]]; then
		echo "WAARSCHUWING: werkmap niet schoon na iteratie $i. Gestopt voor handmatige controle:"
		dirty_files
		exit 1
	fi

	STATUS="$(grep -m1 '^STATUS:' HANDOFF.md | awk '{print $2}' || echo ONBEKEND)"
	echo "--- HANDOFF status na iteratie $i: $STATUS"
	case "$STATUS" in
	KLAAR)
		echo "Taak afgerond. Loop klaar na $i iteratie(s)."
		exit 0
		;;
	GEBLOKKEERD)
		echo "Agent geblokkeerd — zie HANDOFF.md. Loop gestopt."
		exit 2
		;;
	esac
done

echo ""
echo "Maximum van $MAX_ITERATIONS iteraties bereikt. Zie HANDOFF.md voor de stand."
