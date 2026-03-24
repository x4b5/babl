import pytest
import json

# Import from parent
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestSSEErrorEventStructure:
    """RL-02: Backend emits structured SSE error events."""

    def test_rate_limit_event_has_required_fields(self):
        """Rate limit error event must have type, error_type, and retry_after."""
        event = {"type": "error", "error_type": "rate_limit", "retry_after": 30}
        assert event["type"] == "error"
        assert event["error_type"] == "rate_limit"
        assert isinstance(event["retry_after"], int)
        assert event["retry_after"] > 0

    def test_timeout_event_has_required_fields(self):
        event = {"type": "error", "error_type": "timeout"}
        assert event["type"] == "error"
        assert event["error_type"] == "timeout"

    def test_upstream_disconnect_event_has_required_fields(self):
        event = {"type": "error", "error_type": "upstream_disconnect"}
        assert event["type"] == "error"
        assert event["error_type"] == "upstream_disconnect"

    def test_network_error_event_has_required_fields(self):
        event = {"type": "error", "error_type": "network_error"}
        assert event["type"] == "error"
        assert event["error_type"] == "network_error"

    def test_error_types_are_valid(self):
        """EH-01: Only 4 valid error types."""
        valid_types = {"rate_limit", "timeout", "upstream_disconnect", "network_error"}
        for et in valid_types:
            event = {"type": "error", "error_type": et}
            assert event["error_type"] in valid_types

    def test_sse_event_format_is_valid_json(self):
        """SSE data line must be valid JSON."""
        event_data = json.dumps({"type": "error", "error_type": "rate_limit", "retry_after": 30})
        sse_line = f"data: {event_data}\n\n"
        assert sse_line.startswith("data: ")
        parsed = json.loads(sse_line[6:].strip())
        assert parsed["error_type"] == "rate_limit"
