"""Tests for WER/CER calculation — RED state (stubs raise NotImplementedError)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from evaluation.metrics import calculate_wer, calculate_cer, calculate_metrics


class TestWER:
    def test_identical_texts_zero_wer(self):
        assert calculate_wer("hello world", "hello world") == 0.0

    def test_completely_wrong_full_wer(self):
        assert calculate_wer("hello world", "foo bar") == 1.0

    def test_partial_match(self):
        wer_score = calculate_wer("de kat zit op de mat", "de hond zit op de mat")
        assert 0.0 < wer_score < 1.0

    def test_normalization_ignores_case_and_punctuation(self):
        assert calculate_wer("Hello, world!", "hello world") == 0.0

    def test_empty_reference_raises(self):
        with pytest.raises((ValueError, ZeroDivisionError)):
            calculate_wer("", "some text")


class TestCER:
    def test_identical_texts_zero_cer(self):
        assert calculate_cer("abc", "abc") == 0.0

    def test_partial_difference(self):
        cer_score = calculate_cer("hallo", "halo")
        assert cer_score > 0.0

    def test_normalization_ignores_case(self):
        assert calculate_cer("Hello", "hello") == 0.0


class TestMetrics:
    def test_returns_all_required_fields(self):
        result = calculate_metrics("de kat zit op de mat", "de hond zit op de mat")
        assert "wer" in result
        assert "cer" in result
        assert "substitutions" in result
        assert "deletions" in result
        assert "insertions" in result
        assert "total_words" in result

    def test_substitutions_counted(self):
        result = calculate_metrics("de kat zit", "de hond zit")
        assert result["substitutions"] >= 1

    def test_total_words_correct(self):
        result = calculate_metrics("een twee drie vier", "een twee drie vier")
        assert result["total_words"] == 4
