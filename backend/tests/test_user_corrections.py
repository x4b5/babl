"""FEED-01: User correction feedback storage and glossary suggestions."""
import json
import tempfile
from pathlib import Path
import pytest


class TestCorrectionStorage:
    """FEED-01: User corrections stored for analysis."""

    def test_log_correction_function_exists(self):
        """There should be a function to log user corrections."""
        from evaluation.logger import log_correction
        assert callable(log_correction)

    def test_log_correction_stores_entry(self):
        """log_correction should write to JSONL file."""
        from evaluation.logger import log_correction

        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = log_correction(
                session_id="test-session",
                dialect_region="limburgs",
                original_text="Ich hub dao geweest",
                corrected_text="Ik heb daar geweest",
                user_correction="Ik ben daar geweest",
                log_dir=Path(tmpdir),
            )
            assert log_file.exists()
            content = log_file.read_text()
            entry = json.loads(content.strip())
            assert entry["dialect_region"] == "limburgs"
            assert entry["user_correction"] == "Ik ben daar geweest"
            assert entry["original_text"] == "Ich hub dao geweest"
            assert entry["corrected_text"] == "Ik heb daar geweest"
            assert "timestamp" in entry

    def test_log_correction_separate_file(self):
        """Corrections should be in separate file from evaluations."""
        from evaluation.logger import log_correction

        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = log_correction(
                session_id="test-session",
                dialect_region="limburgs",
                original_text="test",
                corrected_text="test",
                user_correction="test corrected",
                log_dir=Path(tmpdir),
            )
            assert "correction" in log_file.name

    def test_log_correction_multiple_entries(self):
        """Multiple corrections should append to same file."""
        from evaluation.logger import log_correction

        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir)
            log_correction(
                session_id="s1", dialect_region="limburgs",
                original_text="t1", corrected_text="c1", user_correction="u1",
                log_dir=log_dir,
            )
            log_file = log_correction(
                session_id="s2", dialect_region="mestreechs",
                original_text="t2", corrected_text="c2", user_correction="u2",
                log_dir=log_dir,
            )
            lines = [l for l in log_file.read_text().strip().split("\n") if l.strip()]
            assert len(lines) == 2

    def test_read_corrections_function_exists(self):
        """There should be a function to read stored corrections."""
        from evaluation.logger import read_corrections
        assert callable(read_corrections)

    def test_read_corrections_returns_entries(self):
        """read_corrections should return stored entries."""
        from evaluation.logger import log_correction, read_corrections

        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir)
            log_correction(
                session_id="s1", dialect_region="limburgs",
                original_text="Ich hub", corrected_text="Ik heb",
                user_correction="Ik heb", log_dir=log_dir,
            )
            entries = read_corrections(log_dir=log_dir)
            assert len(entries) == 1
            assert entries[0]["dialect_region"] == "limburgs"


class TestGlossarySuggestions:
    """FEED-01: Feedback feeds glossary and word boost lists."""

    def test_extract_correction_pairs_exists(self):
        """There should be a function to extract dialect->Dutch pairs."""
        from evaluation.suggestions import extract_correction_pairs
        assert callable(extract_correction_pairs)

    def test_extract_pairs_from_correction(self):
        """Should extract word-level differences as potential glossary entries."""
        from evaluation.suggestions import extract_correction_pairs

        pairs = extract_correction_pairs(
            original="Ich hub dao geweest",
            system_correction="Ik heb daar geweest",
            user_correction="Ik ben daar geweest",
        )
        assert isinstance(pairs, list)
        # Should detect that "hub" maps to "ben" (user preferred over system's "heb")
        pair_dict = {p["dialect"]: p["dutch"] for p in pairs}
        assert "hub" in pair_dict or "Hub" in pair_dict

    def test_extract_pairs_no_diff(self):
        """When system and user correction match, should still extract dialect->Dutch."""
        from evaluation.suggestions import extract_correction_pairs

        pairs = extract_correction_pairs(
            original="Ich hub dao geweest",
            system_correction="Ik heb daar geweest",
            user_correction="Ik heb daar geweest",
        )
        assert isinstance(pairs, list)
        pair_dict = {p["dialect"]: p["dutch"] for p in pairs}
        assert "Ich" in pair_dict or "ich" in pair_dict

    def test_suggest_glossary_updates_exists(self):
        """There should be a function to suggest glossary updates."""
        from evaluation.suggestions import suggest_glossary_updates
        assert callable(suggest_glossary_updates)

    def test_suggest_glossary_updates_from_corrections(self):
        """Should suggest updates when user corrections differ from glossary."""
        from evaluation.suggestions import suggest_glossary_updates

        corrections = [
            {
                "dialect_region": "limburgs",
                "original_text": "Ich hub dao geweest",
                "corrected_text": "Ik heb daar geweest",
                "user_correction": "Ik ben daar geweest",
            },
            {
                "dialect_region": "limburgs",
                "original_text": "Ich hub heem gegange",
                "corrected_text": "Ik heb thuis gegaan",
                "user_correction": "Ik ben naar huis gegaan",
            },
        ]
        suggestions = suggest_glossary_updates(corrections, region="limburgs")
        assert isinstance(suggestions, list)
        # Should suggest that "hub" -> "ben" based on repeated user corrections
