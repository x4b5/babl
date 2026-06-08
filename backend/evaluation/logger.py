"""JSONL evaluation logger — append-only, no raw text (privacy)."""
import json
import os
import statistics
import tempfile
import uuid
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


def read_audit_logs(
    log_dir: Path = DEFAULT_LOG_PATH,
    limit: int = 100,
    date_from: str | None = None,
    date_to: str | None = None,
    session_id: str | None = None,
    provider: str | None = None,
    step: str | None = None,
    success: bool | None = None,
) -> list[dict]:
    """Read audit log entries with optional filters (AVG art. 33-34).

    Args:
        date_from: ISO date string (inclusive), e.g. "2026-06-01"
        date_to: ISO date string (inclusive), e.g. "2026-06-08"
        session_id: Filter by session UUID
        provider: Filter by provider (whisper, assemblyai, ollama, mistral)
        step: Filter by step (transcribe, polish)
        success: Filter by success status
    """
    if not log_dir.exists():
        return []

    entries: list[dict] = []
    for jsonl_file in sorted(log_dir.glob("audit-*.jsonl"), reverse=True):
        # Extract date from filename for range filtering
        file_date = jsonl_file.stem.replace("audit-", "")
        if date_from and file_date < date_from:
            continue
        if date_to and file_date > date_to:
            continue

        for line in reversed(jsonl_file.read_text(encoding="utf-8").strip().split("\n")):
            if not line.strip():
                continue
            entry = json.loads(line)
            if session_id and entry.get("session_id") != session_id:
                continue
            if provider and entry.get("provider") != provider:
                continue
            if step and entry.get("step") != step:
                continue
            if success is not None and entry.get("success") != success:
                continue
            entries.append(entry)
            if len(entries) >= limit:
                return entries
    return entries


def delete_session_data(
    session_id: str,
    log_dir: Path = DEFAULT_LOG_PATH,
) -> dict[str, int]:
    """Delete all log entries for a session_id across all log types (AVG art. 17).

    Rewrites JSONL files without the matching entries. Logs the deletion
    as an audit event for accountability.

    Returns dict with counts of deleted entries per log type.
    """
    if not log_dir.exists():
        return {"audit": 0, "eval": 0, "corrections": 0}

    deleted: dict[str, int] = {"audit": 0, "eval": 0, "corrections": 0}
    patterns = {
        "audit": "audit-*.jsonl",
        "eval": "eval-*.jsonl",
        "corrections": "corrections-*.jsonl",
    }

    for log_type, pattern in patterns.items():
        for jsonl_file in log_dir.glob(pattern):
            lines = jsonl_file.read_text(encoding="utf-8").strip().split("\n")
            kept: list[str] = []
            removed = 0
            for line in lines:
                if not line.strip():
                    continue
                entry = json.loads(line)
                if entry.get("session_id") == session_id:
                    removed += 1
                else:
                    kept.append(line)
            if removed > 0:
                deleted[log_type] += removed
                # Atomic write: write to temp file, then rename
                fd, tmp_path = tempfile.mkstemp(
                    dir=str(log_dir), suffix=".jsonl.tmp"
                )
                try:
                    with os.fdopen(fd, "w", encoding="utf-8") as f:
                        for line in kept:
                            f.write(line + "\n")
                    os.replace(tmp_path, str(jsonl_file))
                except Exception:
                    os.unlink(tmp_path)
                    raise

    # Log the deletion itself as an audit event
    if any(v > 0 for v in deleted.values()):
        log_processing_event(
            session_id=session_id,
            mode="deletion",
            step="erasure",
            provider="system",
            pii_redaction=False,
            region="",
            success=True,
            log_dir=log_dir,
        )

    return deleted


def log_breach(
    severity: str,
    description: str,
    affected_data: str,
    remediation: str,
    reported_by: str = "system",
    session_ids: list[str] | None = None,
    log_dir: Path = DEFAULT_LOG_PATH,
) -> dict:
    """Log a data breach or security incident (AVG art. 33).

    Args:
        severity: critical, high, medium, low
        description: What happened
        affected_data: What data was affected (e.g. "audit logs", "transcriptions")
        remediation: Steps taken or planned to resolve
        reported_by: Who reported the incident
        session_ids: Optional list of affected session UUIDs

    Returns the logged entry including generated breach_id.
    """
    log_dir.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    log_file = log_dir / f"breaches-{today}.jsonl"

    entry = {
        "breach_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": severity,
        "description": description,
        "affected_data": affected_data,
        "remediation": remediation,
        "reported_by": reported_by,
        "status": "open",
    }
    if session_ids:
        entry["session_ids"] = session_ids

    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    return entry


def read_breaches(
    log_dir: Path = DEFAULT_LOG_PATH,
    limit: int = 100,
    severity: str | None = None,
) -> list[dict]:
    """Read breach/incident entries, newest first."""
    if not log_dir.exists():
        return []

    entries: list[dict] = []
    for jsonl_file in sorted(log_dir.glob("breaches-*.jsonl"), reverse=True):
        for line in reversed(jsonl_file.read_text(encoding="utf-8").strip().split("\n")):
            if not line.strip():
                continue
            entry = json.loads(line)
            if severity and entry.get("severity") != severity:
                continue
            entries.append(entry)
            if len(entries) >= limit:
                return entries
    return entries
