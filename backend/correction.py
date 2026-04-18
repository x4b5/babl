"""Correction output schema and parsing utilities for Phase 6 LLM consistency."""

import json
import re
from pydantic import BaseModel, Field, ValidationError


class CorrectionOutput(BaseModel):
    """Structured output model for dialect correction (CORR-02)."""
    original: str = Field(description="De originele tekst (ongewijzigd)")
    corrected: str = Field(description="De gecorrigeerde tekst in standaard Nederlands")
    confidence: float | None = Field(default=None, description="Vertrouwen 0.0-1.0")
    applied_rules: list[str] | None = Field(default=None, description="Toegepaste regels")


JSON_INSTRUCTION = (
    "OUTPUT FORMAT:\n"
    "Geef je antwoord terug als een JSON object met deze structuur:\n"
    '{\n'
    '  "original": "<originele tekst>",\n'
    '  "corrected": "<gecorrigeerde tekst in standaard Nederlands>"\n'
    '}\n\n'
    "Geef ALLEEN het JSON object terug, geen andere tekst."
)


def parse_correction_output(raw_text: str, original_input: str) -> CorrectionOutput:
    """
    Parse LLM output to CorrectionOutput with 3-tier fallback strategy.

    Attempt 1: Direct JSON parse
    Attempt 2: Regex extract JSON from surrounding text
    Attempt 3: Fallback to raw text as corrected output

    Args:
        raw_text: Raw LLM output (potentially JSON, potentially prose)
        original_input: The original input text (used for fallback)

    Returns:
        CorrectionOutput instance (always succeeds)
    """
    # Attempt 1: Direct JSON parse
    try:
        data = json.loads(raw_text)
        return CorrectionOutput(**data)
    except (json.JSONDecodeError, ValidationError):
        pass

    # Attempt 2: Regex extract JSON from surrounding text
    try:
        # Match JSON objects (non-nested for simplicity, DOTALL for multiline)
        match = re.search(r'\{[^{}]*\}', raw_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
            return CorrectionOutput(**data)
    except (json.JSONDecodeError, ValidationError):
        pass

    # Attempt 3: Fallback — treat raw text as corrected output
    return CorrectionOutput(
        original=original_input,
        corrected=raw_text.strip()
    )
