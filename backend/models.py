"""Pydantic request/response models for API endpoints."""

from pydantic import BaseModel


class CorrectionRequest(BaseModel):
    text: str
    language: str
    region: str = "limburgs"
    quality: str = "light"
    mode: str = "local"
    temperature: float = 0.5
    report_length: str = "samenvatting"
    keep_dialect: bool = False
    target_lang: str = "nl"


class EvaluateRequest(BaseModel):
    reference: str  # Ground truth (user-corrected text)
    hypothesis: str  # Raw transcription output
    session_id: str = ""
    dialect_region: str = "limburgs"
    low_confidence_count: int = 0


class FeedbackRequest(BaseModel):
    session_id: str
    dialect_region: str = "limburgs"
    wer: float
    cer: float
    substitutions: int
    deletions: int
    insertions: int
    total_words: int
    low_confidence_count: int = 0
    feedback: str  # "thumbs_up" or "thumbs_down"


class UserCorrectionRequest(BaseModel):
    session_id: str
    dialect_region: str = "limburgs"
    original_text: str
    corrected_text: str
    user_correction: str
