"""Tests for offset filtering with tolerance window.

These tests verify OF-01 (boundary segments preserved) and OF-02 (end > offset - tolerance).
Tests are written RED-first: they describe CORRECT behavior that the current buggy
implementation does NOT satisfy. Plan 01-02 Task 1 will fix the implementation to make
these tests pass.
"""
import sys
from pathlib import Path

# Add backend root to path so we can import main
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from main import filter_segments_by_offset


class TestOffsetFilterBasic:
    """Basic offset filter behavior."""

    def test_no_offset_returns_all_segments(self):
        """With offset=0, all segments are returned."""
        segments = [
            {"start": 0.0, "end": 2.5, "text": "hello"},
            {"start": 2.5, "end": 5.0, "text": "world"},
        ]
        result = filter_segments_by_offset(segments, offset=0.0)
        assert len(result) == 2

    def test_segments_after_offset_are_kept(self):
        """Segments fully after offset are always kept."""
        segments = [
            {"start": 10.0, "end": 12.0, "text": "after offset"},
            {"start": 30.5, "end": 32.0, "text": "well after offset"},
        ]
        result = filter_segments_by_offset(segments, offset=10.0)
        assert len(result) == 2

    def test_segments_fully_before_offset_are_dropped(self):
        """Segments that end well before offset should be dropped."""
        segments = [
            {"start": 0.0, "end": 5.0, "text": "old segment"},
            {"start": 5.0, "end": 10.0, "text": "also old"},
            {"start": 30.0, "end": 32.0, "text": "new segment"},
        ]
        result = filter_segments_by_offset(segments, offset=29.0)
        assert len(result) == 1
        assert result[0]["text"] == "new segment"


class TestOffsetFilterBoundary:
    """Boundary tolerance tests -- these will FAIL with the buggy start >= offset filter."""

    def test_boundary_segment_preserved(self):
        """OF-01: Segment spanning offset boundary (start < offset, end > offset) must be kept.

        Example: word starts at 29.8s, offset is 30.0s, word ends at 30.5s.
        The buggy filter (start >= offset) drops this segment. The fixed filter
        (end > offset - tolerance) keeps it.
        """
        segments = [
            {"start": 29.8, "end": 30.5, "text": "boundary word"},
        ]
        result = filter_segments_by_offset(segments, offset=30.0)
        assert len(result) == 1, "Boundary-spanning segment should be preserved (OF-01)"
        assert result[0]["text"] == "boundary word"

    def test_segment_ending_within_tolerance_preserved(self):
        """OF-01: Segment ending just before offset (within 0.5s tolerance) is kept."""
        segments = [
            {"start": 29.0, "end": 29.7, "text": "near boundary"},
        ]
        # end (29.7) > offset (30.0) - tolerance (0.5) = 29.5 -> True, should be kept
        result = filter_segments_by_offset(segments, offset=30.0, tolerance=0.5)
        assert len(result) == 1, "Segment ending within tolerance should be preserved"

    def test_segment_ending_outside_tolerance_dropped(self):
        """Segment ending well before offset (outside tolerance) is dropped."""
        segments = [
            {"start": 28.0, "end": 29.0, "text": "too old"},
        ]
        # end (29.0) > offset (30.0) - tolerance (0.5) = 29.5 -> False, should be dropped
        result = filter_segments_by_offset(segments, offset=30.0, tolerance=0.5)
        assert len(result) == 0, "Segment ending outside tolerance should be dropped"

    @pytest.mark.parametrize("start,end,offset,expected_kept", [
        (29.8, 30.5, 30.0, True),   # Spans boundary
        (29.6, 30.0, 30.0, True),   # Ends exactly at offset (within tolerance)
        (29.0, 29.7, 30.0, True),   # Ends within tolerance (29.7 > 29.5)
        (28.0, 29.4, 30.0, False),  # Ends outside tolerance (29.4 < 29.5)
        (30.0, 31.0, 30.0, True),   # Starts exactly at offset
        (31.0, 32.0, 30.0, True),   # Fully after offset
        (0.0,  1.0, 30.0, False),   # Way before offset
    ])
    def test_offset_filter_parametrized(self, start, end, offset, expected_kept):
        """OF-02: Parametrized test covering various boundary positions."""
        segments = [{"start": start, "end": end, "text": f"seg_{start}_{end}"}]
        result = filter_segments_by_offset(segments, offset=offset, tolerance=0.5)
        if expected_kept:
            assert len(result) == 1, f"Segment ({start}-{end}) should be kept at offset {offset}"
        else:
            assert len(result) == 0, f"Segment ({start}-{end}) should be dropped at offset {offset}"
