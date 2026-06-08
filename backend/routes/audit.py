"""Audit trail endpoints for GDPR compliance (Art. 17, 33-34)."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from evaluation.logger import read_audit_logs, delete_session_data, log_breach, read_breaches

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
async def query_audit_logs(
    date_from: str | None = Query(None, description="Start date (inclusive), e.g. 2026-06-01"),
    date_to: str | None = Query(None, description="End date (inclusive), e.g. 2026-06-08"),
    session_id: str | None = Query(None, description="Filter by session UUID"),
    provider: str | None = Query(None, description="Filter by provider (whisper, assemblyai, ollama, mistral)"),
    step: str | None = Query(None, description="Filter by step (transcribe, polish)"),
    success: bool | None = Query(None, description="Filter by success status"),
    limit: int = Query(100, ge=1, le=1000, description="Max entries to return"),
):
    """Query audit logs with filters (AVG art. 33-34).

    Used for incident investigation and compliance demonstration.
    Returns processing metadata only — never content.
    """
    try:
        entries = read_audit_logs(
            date_from=date_from,
            date_to=date_to,
            session_id=session_id,
            provider=provider,
            step=step,
            success=success,
            limit=limit,
        )
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete all data for a session (AVG art. 17 — recht op vergetelheid).

    Removes entries from audit, evaluation, and correction logs.
    The deletion itself is logged for accountability.
    """
    try:
        deleted = delete_session_data(session_id)
        total = sum(deleted.values())
        if total == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Geen data gevonden voor sessie {session_id}",
            )
        return {
            "status": "deleted",
            "session_id": session_id,
            "deleted": deleted,
            "total": total,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BreachReport(BaseModel):
    severity: str  # critical, high, medium, low
    description: str
    affected_data: str
    remediation: str
    reported_by: str = "system"
    session_ids: list[str] | None = None


@router.post("/breaches")
async def report_breach(req: BreachReport):
    """Report a data breach or security incident (AVG art. 33).

    Must be reported to the toezichthouder within 72 hours
    if it poses a risk to the rights of betrokkenen.
    """
    valid_severities = {"critical", "high", "medium", "low"}
    if req.severity not in valid_severities:
        raise HTTPException(
            status_code=400,
            detail=f"severity must be one of: {', '.join(valid_severities)}",
        )
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="description is required")

    try:
        entry = log_breach(
            severity=req.severity,
            description=req.description,
            affected_data=req.affected_data,
            remediation=req.remediation,
            reported_by=req.reported_by,
            session_ids=req.session_ids,
        )
        return {"status": "logged", "breach": entry}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breaches")
async def list_breaches(
    severity: str | None = Query(None, description="Filter by severity (critical, high, medium, low)"),
    limit: int = Query(100, ge=1, le=1000, description="Max entries to return"),
):
    """List recorded breaches/incidents (AVG art. 33).

    Returns breach records for compliance reporting and incident tracking.
    """
    try:
        entries = read_breaches(severity=severity, limit=limit)
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
