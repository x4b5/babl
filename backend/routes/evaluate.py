"""Evaluation and correction feedback endpoints."""

from fastapi import APIRouter, HTTPException

from polishing import get_prompt_version
from evaluation.logger import log_correction, log_evaluation, read_corrections, read_evaluations, get_wer_summary
from evaluation.metrics import calculate_metrics
from evaluation.patterns import extract_error_patterns
from evaluation.suggestions import suggest_glossary_updates
from models import EvaluateRequest, FeedbackRequest, UserCorrectionRequest

router = APIRouter()


@router.post("/evaluate")
async def evaluate(req: EvaluateRequest):
    """Calculate WER/CER and error patterns for a reference/hypothesis pair.

    PRIVACY: This endpoint processes text but does NOT log it.
    Only computed metrics are returned."""
    if not req.reference.strip() or not req.hypothesis.strip():
        raise HTTPException(status_code=400, detail="Both reference and hypothesis text required")

    try:
        metrics = calculate_metrics(req.reference, req.hypothesis)
        patterns = extract_error_patterns(req.reference, req.hypothesis)
        return {
            "wer": round(metrics["wer"], 4),
            "cer": round(metrics["cer"], 4),
            "substitutions": metrics["substitutions"],
            "deletions": metrics["deletions"],
            "insertions": metrics["insertions"],
            "total_words": metrics["total_words"],
            "error_details": patterns["details"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate/log")
async def evaluate_log(req: FeedbackRequest):
    """Log evaluation metrics to JSONL. PRIVACY: No raw text is logged."""
    try:
        log_path = log_evaluation(
            session_id=req.session_id,
            dialect_region=req.dialect_region,
            wer=req.wer,
            cer=req.cer,
            substitutions=req.substitutions,
            deletions=req.deletions,
            insertions=req.insertions,
            total_words=req.total_words,
            low_confidence_count=req.low_confidence_count,
            feedback=req.feedback,
            prompt_version=get_prompt_version(),
        )
        return {"status": "logged", "file": str(log_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluate/history")
async def evaluate_history(limit: int = 50):
    """Read recent evaluation history from JSONL logs."""
    try:
        entries = read_evaluations(limit=limit)
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluate/summary")
async def evaluate_summary(dialect_region: str | None = None, limit: int = 1000):
    """Aggregated WER statistics: mean, p50, p95, mean CER (FEED-02)."""
    try:
        summary = get_wer_summary(dialect_region=dialect_region, limit=limit)
        summary["prompt_version"] = get_prompt_version()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/corrections")
async def submit_correction(req: UserCorrectionRequest):
    """Store a user correction for glossary learning (FEED-01)."""
    if not req.original_text.strip() or not req.user_correction.strip():
        raise HTTPException(status_code=400, detail="original_text and user_correction are required")
    try:
        log_path = log_correction(
            session_id=req.session_id,
            dialect_region=req.dialect_region,
            original_text=req.original_text,
            corrected_text=req.corrected_text,
            user_correction=req.user_correction,
        )
        return {"status": "logged", "file": str(log_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/corrections")
async def list_corrections(dialect_region: str | None = None, limit: int = 50):
    """Read stored user corrections (FEED-01)."""
    try:
        entries = read_corrections(limit=limit, dialect_region=dialect_region)
        return {"entries": entries, "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/corrections/suggestions")
async def correction_suggestions(dialect_region: str = "limburgs", limit: int = 200):
    """Suggest glossary updates based on accumulated user corrections (FEED-01)."""
    try:
        corrections = read_corrections(limit=limit, dialect_region=dialect_region)
        suggestions = suggest_glossary_updates(corrections, region=dialect_region)
        return {"suggestions": suggestions, "count": len(suggestions), "based_on": len(corrections)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
