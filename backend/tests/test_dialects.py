"""Tests for dialect profile audit (TRANS-01) and multi-pronunciation (TRANS-02).

RED state: These tests define target behavior. They will FAIL until
Plan 05-01 expands the dialect profiles.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from dialects import REGIONAL_PROFILES, get_dialect_config, DIALECT_WORD_BOOST, DIALECT_CUSTOM_SPELLING


class TestWordBoost:
    """TRANS-01: Each regional profile must have 50-100 word_boost entries."""

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_minimum_word_boost_count(self, region):
        profile = REGIONAL_PROFILES[region]
        assert len(profile["word_boost"]) >= 50, (
            f"{region} has only {len(profile['word_boost'])} word_boost entries, need >= 50"
        )

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_maximum_word_boost_count(self, region):
        profile = REGIONAL_PROFILES[region]
        assert len(profile["word_boost"]) <= 100, (
            f"{region} has {len(profile['word_boost'])} word_boost entries, max is 100"
        )

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_combined_boost_under_300(self, region):
        config = get_dialect_config(region)
        assert len(config["word_boost"]) <= 300

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_no_duplicate_word_boost(self, region):
        profile = REGIONAL_PROFILES[region]
        words = profile["word_boost"]
        lower_words = [w.lower() for w in words]
        assert len(lower_words) == len(set(lower_words)), (
            f"{region} has duplicate word_boost entries"
        )

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_word_boost_entries_are_nonempty_strings(self, region):
        profile = REGIONAL_PROFILES[region]
        for word in profile["word_boost"]:
            assert isinstance(word, str) and len(word.strip()) > 0


class TestCustomSpelling:
    """TRANS-02: Each profile must have multi-pronunciation coverage."""

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_minimum_custom_spelling_count(self, region):
        profile = REGIONAL_PROFILES[region]
        assert len(profile["custom_spelling"]) >= 15, (
            f"{region} has only {len(profile['custom_spelling'])} custom_spelling entries, need >= 15"
        )

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_custom_spelling_values_are_lists(self, region):
        profile = REGIONAL_PROFILES[region]
        for key, val in profile["custom_spelling"].items():
            assert isinstance(val, list), f"{region}: custom_spelling['{key}'] should be list, got {type(val)}"
            for item in val:
                assert isinstance(item, str)

    def test_mestreechs_has_accent_variants(self):
        profile = REGIONAL_PROFILES["mestreechs"]
        spelling_keys = set(profile["custom_spelling"].keys())
        assert "iech" in spelling_keys, "mestreechs must map 'iech'"
        assert "iéch" in spelling_keys or "iech" in spelling_keys

    @pytest.mark.parametrize("region", ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"])
    def test_no_circular_mappings(self, region):
        profile = REGIONAL_PROFILES[region]
        for key, values in profile["custom_spelling"].items():
            assert key not in values, f"{region}: circular mapping '{key}' maps to itself"


class TestGetDialectConfig:
    """Integration: get_dialect_config returns correct merged config."""

    def test_returns_required_keys(self):
        config = get_dialect_config("limburgs")
        assert "initial_prompt" in config
        assert "word_boost" in config
        assert "custom_spelling" in config
        assert "translation_key" in config

    def test_limburgs_word_boost_minimum(self):
        config = get_dialect_config("limburgs")
        assert len(config["word_boost"]) >= 50

    def test_unknown_region_falls_back(self):
        config = get_dialect_config("nonexistent")
        limburgs = get_dialect_config("limburgs")
        assert config["word_boost"] == limburgs["word_boost"]
