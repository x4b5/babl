"""Audit trail endpoints for GDPR compliance (Art. 17, 33-34)."""

from fastapi import APIRouter, HTTPException, Query

from evaluation.logger import read_audit_logs, delete_session_data

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
