"""FEED-02: Prompt templates are versioned and can be A/B tested."""
import inspect
import json
import tempfile
from pathlib import Path
import pytest


class TestPromptVersioning:
    """FEED-02: Prompt version constant and accessor."""

    def test_prompt_version_exists(self):
        """There should be a PROMPT_VERSION constant."""
        from polishing import PROMPT_VERSION
        assert isinstance(PROMPT_VERSION, str)
        assert len(PROMPT_VERSION) > 0

    def test_prompt_version_format(self):
        """Version should be semantic (e.g., 'v1.0')."""
        from polishing import PROMPT_VERSION
        assert PROMPT_VERSION.startswith("v")
        parts = PROMPT_VERSION[1:].split(".")
        assert len(parts) >= 2
        assert all(p.isdigit() for p in parts)

    def test_get_prompt_version_returns_current(self):
        """get_prompt_version() should return current version."""
        from polishing import get_prompt_version
        version = get_prompt_version()
        assert isinstance(version, str)
        assert version.startswith("v")

    def test_build_polishing_prompt_unchanged_interface(self):
        """build_polishing_prompt should still return (system_prompt, json_instruction)."""
        from polishing import build_polishing_prompt
        result = build_polishing_prompt("limburgs", "samenvatting")
        assert isinstance(result, tuple)
        assert len(result) == 2


class TestEvaluationLoggingWithVersion:
    """FEED-02: Evaluation logs include prompt version for tracking."""

    def test_log_evaluation_accepts_prompt_version(self):
        """log_evaluation should accept prompt_version parameter."""
        sig = inspect.signature(__import__("evaluation.logger", fromlist=["log_evaluation"]).log_evaluation)
        assert "prompt_version" in sig.parameters

    def test_log_entry_contains_prompt_version(self):
        """Logged JSONL entry should contain prompt_version field."""
        from evaluation.logger import log_evaluation

        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = log_evaluation(
                session_id="test-session",
                dialect_region="limburgs",
                wer=0.15,
                cer=0.08,
                substitutions=3,
                deletions=1,
                insertions=0,
                total_words=50,
                prompt_version="v1.0",
                log_dir=Path(tmpdir),
            )
            content = log_file.read_text()
            entry = json.loads(content.strip())
            assert entry["prompt_version"] == "v1.0"

    def test_log_entry_without_version_omits_field(self):
        """When prompt_version is not provided, field should be absent."""
        from evaluation.logger import log_evaluation

        with tempfile.TemporaryDirectory() as tmpdir:
            log_file = log_evaluation(
                session_id="test-session",
                dialect_region="limburgs",
                wer=0.15,
                cer=0.08,
                substitutions=3,
                deletions=1,
                insertions=0,
                total_words=50,
                log_dir=Path(tmpdir),
            )
            content = log_file.read_text()
            entry = json.loads(content.strip())
            assert "prompt_version" not in entry


class TestWERMonitoring:
    """FEED-02: Production WER metrics monitored for regression."""

    def test_get_wer_summary_exists(self):
        """There should be a function to get WER summary stats."""
        from evaluation.logger import get_wer_summary
        assert callable(get_wer_summary)

    def test_wer_summary_returns_stats(self):
        """WER summary should return mean, p50, p95, count."""
        from evaluation.logger import log_evaluation, get_wer_summary

        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir)
            for i in range(5):
                log_evaluation(
                    session_id=f"test-{i}",
                    dialect_region="limburgs",
                    wer=0.1 + i * 0.05,
                    cer=0.05 + i * 0.02,
                    substitutions=i,
                    deletions=0,
                    insertions=0,
                    total_words=50,
                    log_dir=log_dir,
                )
            summary = get_wer_summary(log_dir=log_dir)
            assert "mean_wer" in summary
            assert "p50_wer" in summary
            assert "p95_wer" in summary
            assert "count" in summary
            assert summary["count"] == 5

    def test_wer_summary_empty_logs(self):
        """WER summary with no logs should return zeroes."""
        from evaluation.logger import get_wer_summary

        with tempfile.TemporaryDirectory() as tmpdir:
            summary = get_wer_summary(log_dir=Path(tmpdir))
            assert summary["count"] == 0

    def test_wer_summary_by_region(self):
        """WER summary should be filterable by dialect region."""
        from evaluation.logger import log_evaluation, get_wer_summary

        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir)
            log_evaluation(session_id="s1", dialect_region="limburgs", wer=0.1, cer=0.05,
                          substitutions=1, deletions=0, insertions=0, total_words=50, log_dir=log_dir)
            log_evaluation(session_id="s2", dialect_region="mestreechs", wer=0.2, cer=0.1,
                          substitutions=2, deletions=0, insertions=0, total_words=50, log_dir=log_dir)

            summary_all = get_wer_summary(log_dir=log_dir)
            assert summary_all["count"] == 2

            summary_limburgs = get_wer_summary(log_dir=log_dir, dialect_region="limburgs")
            assert summary_limburgs["count"] == 1
            assert summary_limburgs["mean_wer"] == pytest.approx(0.1, abs=0.01)
