"""JSONL evaluation logger — append-only, no raw text (privacy)."""
import json
from pathlib import Path
from datetime import datetime, timezone, date

DEFAULT_LOG_PATH = Path(__file__).parent.parent / "eval_logs"

def log_evaluation(
    session_id: str,
    dialect_region: str,
    wer: float,
    cer: float,
    substitutions: int,
    deletions: int,
    insertions: int,
    total_words: int,
    low_confidence_count: int = 0,
    feedback: str | None = None,
    log_dir: Path = DEFAULT_LOG_PATH,
) -> Path:
    """Append evaluation metrics to JSONL file. Never logs raw text."""
    log_dir.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    log_file = log_dir / f"eval-{today}.jsonl"

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "dialect_region": dialect_region,
        "wer": round(wer, 4),
        "cer": round(cer, 4),
        "substitutions": substitutions,
        "deletions": deletions,
        "insertions": insertions,
        "total_words": total_words,
        "low_confidence_count": low_confidence_count,
    }
    if feedback is not None:
        entry["feedback"] = feedback

    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    return log_file

def read_evaluations(log_dir: Path = DEFAULT_LOG_PATH, limit: int = 100) -> list[dict]:
    """Read recent evaluation entries, newest first."""
    if not log_dir.exists():
        return []

    entries = []
    for jsonl_file in sorted(log_dir.glob("eval-*.jsonl"), reverse=True):
        for line in reversed(jsonl_file.read_text(encoding="utf-8").strip().split("\n")):
            if line.strip():
                entries.append(json.loads(line))
                if len(entries) >= limit:
                    return entries
    return entries
