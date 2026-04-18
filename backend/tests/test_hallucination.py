"""Tests for hallucination detection (TRANS-03).

RED state: These tests import from backend/hallucination.py which does not
exist yet. They will FAIL with ImportError until Plan 05-02 creates the module.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from hallucination import detect_hallucinations, clean_hallucinations, process_transcription


class TestRepetitionDetection:
    """Detect repeated phrases (consecutive repetition)."""

    def test_no_repetition_returns_empty(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["clean"])
        assert result == []

    def test_excessive_repetition_detected(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["repetitive"])
        assert len(result) >= 1
        assert result[0]["type"] == "repetition"

    def test_nonsense_loop_detected(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["nonsense_loop"])
        assert len(result) >= 1
        assert result[0]["type"] == "repetition"

    def test_legitimate_short_repeat_not_flagged(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["legitimate_repeat"])
        repetitions = [h for h in result if h["type"] == "repetition"]
        assert len(repetitions) == 0, "Short legitimate repeats should not be flagged"

    def test_empty_string_returns_empty(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["empty"])
        assert result == []


class TestPhantomDetection:
    """Detect known Whisper phantom strings."""

    def test_english_phantom_detected(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["whisper_phantom"])
        assert len(result) >= 1
        assert result[0]["type"] == "phantom"

    def test_dutch_phantom_detected(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["dutch_phantom"])
        assert len(result) >= 1
        assert result[0]["type"] == "phantom"

    def test_mixed_content_detects_phantom(self, hallucination_test_strings):
        result = detect_hallucinations(hallucination_test_strings["mixed"])
        phantoms = [h for h in result if h["type"] == "phantom"]
        assert len(phantoms) >= 1


class TestCleanHallucinations:
    """clean_hallucinations strips detected content."""

    def test_clean_text_unchanged(self, hallucination_test_strings):
        cleaned = clean_hallucinations(hallucination_test_strings["clean"])
        assert cleaned == hallucination_test_strings["clean"]

    def test_phantom_stripped(self, hallucination_test_strings):
        cleaned = clean_hallucinations(hallucination_test_strings["whisper_phantom"])
        assert "Thank you for watching" not in cleaned

    def test_mixed_preserves_legitimate(self, hallucination_test_strings):
        cleaned = clean_hallucinations(hallucination_test_strings["mixed"])
        assert "De kat zit op de mat" in cleaned
        assert "De hond loopt buiten" in cleaned
        assert "Thank you for watching" not in cleaned

    def test_repetition_cleaned(self, hallucination_test_strings):
        cleaned = clean_hallucinations(hallucination_test_strings["repetitive"])
        # Should reduce excessive repetition, not strip entirely
        assert len(cleaned) < len(hallucination_test_strings["repetitive"])


class TestProcessTranscription:
    """Full pipeline: detect + clean in one call."""

    def test_returns_required_keys(self, hallucination_test_strings):
        result = process_transcription(hallucination_test_strings["clean"])
        assert "cleaned_text" in result
        assert "hallucinations" in result
        assert "was_modified" in result

    def test_clean_text_not_modified(self, hallucination_test_strings):
        result = process_transcription(hallucination_test_strings["clean"])
        assert result["was_modified"] is False
        assert result["cleaned_text"] == hallucination_test_strings["clean"]

    def test_phantom_text_is_modified(self, hallucination_test_strings):
        result = process_transcription(hallucination_test_strings["whisper_phantom"])
        assert result["was_modified"] is True
        assert len(result["hallucinations"]) >= 1

    def test_mixed_content_processed(self, hallucination_test_strings):
        result = process_transcription(hallucination_test_strings["mixed"])
        assert result["was_modified"] is True
        assert "De kat zit op de mat" in result["cleaned_text"]
