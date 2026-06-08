"""JSONL evaluation logger — append-only, no raw text (privacy)."""
import json
import statistics
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
    prompt_version: str | None = None,
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
    if prompt_version is not None:
        entry["prompt_version"] = prompt_version

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


def get_wer_summary(
    log_dir: Path = DEFAULT_LOG_PATH,
    dialect_region: str | None = None,
    limit: int = 1000,
) -> dict:
    """Aggregate WER statistics from evaluation logs (FEED-02).

    Returns dict with mean_wer, p50_wer, p95_wer, mean_cer, count.
    """
    entries = read_evaluations(log_dir=log_dir, limit=limit)
    if dialect_region:
        entries = [e for e in entries if e.get("dialect_region") == dialect_region]

    if not entries:
        return {"mean_wer": 0.0, "p50_wer": 0.0, "p95_wer": 0.0, "mean_cer": 0.0, "count": 0}

    wer_values = [e["wer"] for e in entries if "wer" in e]
    cer_values = [e["cer"] for e in entries if "cer" in e]

    if not wer_values:
        return {"mean_wer": 0.0, "p50_wer": 0.0, "p95_wer": 0.0, "mean_cer": 0.0, "count": 0}

    sorted_wer = sorted(wer_values)
    p95_idx = min(int(len(sorted_wer) * 0.95), len(sorted_wer) - 1)

    return {
        "mean_wer": round(statistics.mean(wer_values), 4),
        "p50_wer": round(statistics.median(wer_values), 4),
        "p95_wer": round(sorted_wer[p95_idx], 4),
        "mean_cer": round(statistics.mean(cer_values), 4) if cer_values else 0.0,
        "count": len(entries),
    }


def log_processing_event(
    session_id: str,
    mode: str,
    step: str,
    provider: str,
    pii_redaction: bool,
    region: str,
    success: bool,
    error_type: str | None = None,
    log_dir: Path = DEFAULT_LOG_PATH,
) -> Path:
    """Append processing audit event to JSONL file (AVG art. 5.2 accountability).

    Logs metadata only — never content. Used to demonstrate GDPR compliance
    by recording what was processed, how, and by which provider.
    """
    log_dir.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    log_file = log_dir / f"audit-{today}.jsonl"

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "mode": mode,
        "step": step,
        "provider": provider,
        "pii_redaction": pii_redaction,
        "region": region,
        "success": success,
    }
    if error_type is not None:
        entry["error_type"] = error_type

    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    return log_file


def log_correction(
    session_id: str,
    dialect_region: str,
    original_text: str,
    polished_text: str,
    user_correction: str,
    log_dir: Path = DEFAULT_LOG_PATH,
) -> Path:
    """Append user correction to JSONL file (FEED-01)."""
    log_dir.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    log_file = log_dir / f"corrections-{today}.jsonl"

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "dialect_region": dialect_region,
        "original_text": original_text,
        "polished_text": polished_text,
        "user_correction": user_correction,
    }

    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    return log_file


def read_corrections(
    log_dir: Path = DEFAULT_LOG_PATH,
    limit: int = 100,
    dialect_region: str | None = None,
) -> list[dict]:
    """Read stored user corrections, newest first."""
    if not log_dir.exists():
        return []

    entries = []
    for jsonl_file in sorted(log_dir.glob("corrections-*.jsonl"), reverse=True):
        for line in reversed(jsonl_file.read_text(encoding="utf-8").strip().split("\n")):
            if line.strip():
                entry = json.loads(line)
                if dialect_region and entry.get("dialect_region") != dialect_region:
                    continue
                entries.append(entry)
                if len(entries) >= limit:
                    return entries
    return entries
