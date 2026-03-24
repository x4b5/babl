import pytest
from datetime import datetime, timezone, timedelta

# Import from parent
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from main import parse_retry_after


class TestParseRetryAfter:
    def test_integer_seconds(self):
        """RL-01: Parse Retry-After as integer seconds."""
        assert parse_retry_after("30") == 30

    def test_integer_seconds_small(self):
        assert parse_retry_after("1") == 1

    def test_integer_seconds_large(self):
        assert parse_retry_after("120") == 120

    def test_empty_string_returns_default(self):
        assert parse_retry_after("") == 3

    def test_none_returns_default(self):
        """Missing header falls back to 3 seconds."""
        assert parse_retry_after({}) == 3

    def test_unparseable_returns_default(self):
        assert parse_retry_after("not-a-number") == 3

    def test_http_date_format(self):
        """RL-01: Parse Retry-After as HTTP-date (RFC 1123)."""
        future = datetime.now(timezone.utc) + timedelta(seconds=60)
        http_date = future.strftime("%a, %d %b %Y %H:%M:%S GMT")
        result = parse_retry_after(http_date)
        assert 55 <= result <= 65  # Allow some tolerance

    def test_dict_with_retry_after_key(self):
        assert parse_retry_after({"Retry-After": "45"}) == 45

    def test_response_like_object(self):
        class FakeResponse:
            headers = {"Retry-After": "10"}
        assert parse_retry_after(FakeResponse()) == 10

    def test_zero_returns_minimum_1(self):
        """Never return 0 — always wait at least 1 second."""
        assert parse_retry_after("0") == 1

    def test_negative_returns_minimum_1(self):
        past = datetime.now(timezone.utc) - timedelta(seconds=10)
        http_date = past.strftime("%a, %d %b %Y %H:%M:%S GMT")
        result = parse_retry_after(http_date)
        assert result == 1
