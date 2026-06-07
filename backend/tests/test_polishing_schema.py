"""Tests for CORR-02: Structured JSON output schema."""
import pytest
from polishing import PolishingOutput, parse_polishing_output, JSON_INSTRUCTION


class TestPolishingOutput:
    """Test PolishingOutput Pydantic model and parsing logic."""

    def test_parse_valid_json(self):
        """Parse valid JSON with all fields."""
        raw = '{"original": "iech bin", "polished": "ik ben", "confidence": 0.9, "applied_rules": ["iech->ik"]}'
        result = parse_polishing_output(raw, "iech bin")
        assert result.original == "iech bin"
        assert result.polished == "ik ben"
        assert result.confidence == 0.9
        assert result.applied_rules == ["iech->ik"]

    def test_parse_minimal_json(self):
        """Parse JSON with only required fields (original + polished)."""
        raw = '{"original": "vaan dao", "polished": "van daar"}'
        result = parse_polishing_output(raw, "vaan dao")
        assert result.original == "vaan dao"
        assert result.polished == "van daar"
        assert result.confidence is None
        assert result.applied_rules is None

    def test_parse_fallback(self):
        """Fallback when input is not JSON — use raw text as polished."""
        result = parse_polishing_output("just plain text output", "original input")
        assert result.original == "original input"
        assert result.polished == "just plain text output"
        assert result.confidence is None
        assert result.applied_rules is None

    def test_parse_json_with_surrounding_text(self):
        """Extract JSON from prose (e.g., LLM adds explanation around JSON)."""
        raw = 'Hier is het resultaat:\n{"original": "neet", "polished": "niet"}\nKlaar.'
        result = parse_polishing_output(raw, "neet")
        assert result.original == "neet"
        assert result.polished == "niet"

    def test_json_instruction_contains_required_fields(self):
        """JSON_INSTRUCTION must mention 'original', 'polished', 'JSON'."""
        assert "original" in JSON_INSTRUCTION
        assert "polished" in JSON_INSTRUCTION
        assert "JSON" in JSON_INSTRUCTION
