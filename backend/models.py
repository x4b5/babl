"""Pydantic request/response models for API endpoints."""

from pydantic import BaseModel, Field


class PolishingRequest(BaseModel):
    text: str = Field(..., max_length=50_000)
    language: str
    region: str = "limburgs"
    quality: str = "light"
    mode: str = "local"
    temperature: float = Field(0.5, ge=0.0, le=2.0)
    report_length: str = "samenvatting"
    keep_dialect: bool = False
    target_lang: str = "nl"
    model_family: str = "qwen3"
    speaker_labels: dict[str, str] | None = Field(None, max_length=20)
    subject: str | None = Field(None, max_length=500)


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
    polished_text: str
    user_correction: str
