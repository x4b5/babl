"""Tests for error pattern extraction — RED state."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from evaluation.patterns import extract_error_patterns, categorize_errors


class TestExtractPatterns:
    def test_returns_counts(self):
        result = extract_error_patterns("de kat zit", "de hond zit")
        assert "substitutions" in result
        assert "deletions" in result
        assert "insertions" in result
        assert "total_words" in result

    def test_substitution_detected(self):
        result = extract_error_patterns("de kat zit", "de hond zit")
        assert result["substitutions"] >= 1

    def test_deletion_detected(self):
        result = extract_error_patterns("de kat zit op de mat", "de kat zit de mat")
        assert result["deletions"] >= 1

    def test_insertion_detected(self):
        result = extract_error_patterns("de kat zit", "de grote kat zit")
        assert result["insertions"] >= 1

    def test_perfect_match_zero_errors(self):
        result = extract_error_patterns("hallo wereld", "hallo wereld")
        assert result["substitutions"] == 0
        assert result["deletions"] == 0
        assert result["insertions"] == 0


class TestCategorizeErrors:
    def test_returns_list_of_dicts(self):
        errors = categorize_errors("de kat zit", "de hond zit")
        assert isinstance(errors, list)
        assert len(errors) >= 1

    def test_error_has_type(self):
        errors = categorize_errors("de kat zit", "de hond zit")
        for err in errors:
            assert "type" in err
            assert err["type"] in ("substitution", "deletion", "insertion")

    def test_substitution_has_expected_and_actual(self):
        errors = categorize_errors("de kat zit", "de hond zit")
        subs = [e for e in errors if e["type"] == "substitution"]
        assert len(subs) >= 1
        assert "expected" in subs[0]
        assert "actual" in subs[0]
