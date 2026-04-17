"""Tests for JSONL evaluation logger — RED state."""
import sys
import json
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from evaluation.logger import log_evaluation, read_evaluations


class TestLogEvaluation:
    def test_creates_jsonl_file(self, tmp_path):
        result_path = log_evaluation(
            session_id="test-123",
            dialect_region="mestreechs",
            wer=0.35, cer=0.22,
            substitutions=5, deletions=2, insertions=1,
            total_words=42,
            low_confidence_count=8,
            feedback="thumbs_up",
            log_dir=tmp_path,
        )
        assert result_path.exists()
        assert result_path.suffix == ".jsonl"

    def test_appends_to_same_file(self, tmp_path):
        log_evaluation(session_id="a", dialect_region="limburgs",
                       wer=0.1, cer=0.05, substitutions=1, deletions=0,
                       insertions=0, total_words=10, log_dir=tmp_path)
        log_evaluation(session_id="b", dialect_region="limburgs",
                       wer=0.2, cer=0.1, substitutions=2, deletions=1,
                       insertions=0, total_words=20, log_dir=tmp_path)

        jsonl_files = list(tmp_path.glob("*.jsonl"))
        assert len(jsonl_files) == 1
        lines = jsonl_files[0].read_text().strip().split("\n")
        assert len(lines) == 2

    def test_has_required_fields(self, tmp_path):
        log_evaluation(session_id="test-456", dialect_region="zittesj",
                       wer=0.3, cer=0.15, substitutions=3, deletions=1,
                       insertions=1, total_words=30, log_dir=tmp_path)

        jsonl_file = list(tmp_path.glob("*.jsonl"))[0]
        entry = json.loads(jsonl_file.read_text().strip())

        required = ["timestamp", "session_id", "dialect_region", "wer", "cer",
                     "substitutions", "deletions", "insertions", "total_words"]
        for field in required:
            assert field in entry, f"Missing field: {field}"

    def test_no_raw_text_in_output(self, tmp_path):
        log_evaluation(session_id="privacy-test", dialect_region="limburgs",
                       wer=0.5, cer=0.3, substitutions=5, deletions=2,
                       insertions=1, total_words=50, log_dir=tmp_path)

        jsonl_file = list(tmp_path.glob("*.jsonl"))[0]
        content = jsonl_file.read_text()
        entry = json.loads(content.strip())

        # No field should contain text content (reference/hypothesis)
        text_fields = ["reference", "hypothesis", "text", "raw_text", "transcription"]
        for field in text_fields:
            assert field not in entry, f"Privacy violation: field '{field}' found in log"

    def test_optional_feedback_field(self, tmp_path):
        log_evaluation(session_id="fb-test", dialect_region="limburgs",
                       wer=0.2, cer=0.1, substitutions=1, deletions=0,
                       insertions=0, total_words=10, feedback="thumbs_down",
                       log_dir=tmp_path)

        jsonl_file = list(tmp_path.glob("*.jsonl"))[0]
        entry = json.loads(jsonl_file.read_text().strip())
        assert entry["feedback"] == "thumbs_down"


class TestReadEvaluations:
    def test_reads_entries(self, tmp_path):
        log_evaluation(session_id="r-1", dialect_region="limburgs",
                       wer=0.1, cer=0.05, substitutions=1, deletions=0,
                       insertions=0, total_words=10, log_dir=tmp_path)
        log_evaluation(session_id="r-2", dialect_region="mestreechs",
                       wer=0.2, cer=0.1, substitutions=2, deletions=1,
                       insertions=0, total_words=20, log_dir=tmp_path)

        entries = read_evaluations(log_dir=tmp_path)
        assert len(entries) == 2
        # Newest first
        assert entries[0]["session_id"] == "r-2"

    def test_respects_limit(self, tmp_path):
        for i in range(5):
            log_evaluation(session_id=f"lim-{i}", dialect_region="limburgs",
                           wer=0.1, cer=0.05, substitutions=1, deletions=0,
                           insertions=0, total_words=10, log_dir=tmp_path)

        entries = read_evaluations(log_dir=tmp_path, limit=3)
        assert len(entries) == 3
