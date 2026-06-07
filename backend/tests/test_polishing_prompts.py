"""Tests for CORR-01 (few-shot) and CORR-03 (glossary). RED state until Plan 06-01."""
import pytest
from dialects import REGIONAL_PROFILES

REGIONS = ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"]


class TestFewShotExamples:
    """CORR-01: 3-5 few-shot examples per region."""

    @pytest.mark.parametrize("region", REGIONS)
    def test_few_shot_examples_exist(self, region):
        """Each region must have 'few_shot_examples' key with 3-5 examples."""
        profile = REGIONAL_PROFILES[region]
        assert "few_shot_examples" in profile, f"{region} missing few_shot_examples"
        examples = profile["few_shot_examples"]
        assert 3 <= len(examples) <= 5, f"{region} has {len(examples)} examples, need 3-5"

    @pytest.mark.parametrize("region", REGIONS)
    def test_few_shot_schema_valid(self, region):
        """Each example must have 'input' (str) and 'output' dict with 'original' and 'polished'."""
        profile = REGIONAL_PROFILES[region]
        for i, ex in enumerate(profile["few_shot_examples"]):
            assert "input" in ex, f"{region} example {i} missing 'input'"
            assert "output" in ex, f"{region} example {i} missing 'output'"
            assert isinstance(ex["input"], str) and len(ex["input"]) > 0
            out = ex["output"]
            assert "original" in out, f"{region} example {i} output missing 'original'"
            assert "polished" in out, f"{region} example {i} output missing 'polished'"

    @pytest.mark.parametrize("region", REGIONS)
    def test_few_shot_input_matches_output_original(self, region):
        """The 'input' field must match 'output.original' — consistency check."""
        profile = REGIONAL_PROFILES[region]
        for i, ex in enumerate(profile["few_shot_examples"]):
            assert ex["input"] == ex["output"]["original"], (
                f"{region} example {i}: input != output.original"
            )


class TestGlossary:
    """CORR-03: 50-100+ term glossary per region."""

    @pytest.mark.parametrize("region", REGIONS)
    def test_glossary_size(self, region):
        """Each region must have 50-150 glossary terms."""
        profile = REGIONAL_PROFILES[region]
        assert "glossary" in profile, f"{region} missing glossary"
        glossary = profile["glossary"]
        assert len(glossary) >= 50, f"{region} glossary has {len(glossary)} terms, need >= 50"
        assert len(glossary) <= 200, f"{region} glossary has {len(glossary)} terms, max 200"

    @pytest.mark.parametrize("region", REGIONS)
    def test_glossary_no_identity_mappings(self, region):
        """Glossary must not map words to themselves (e.g., 'huis' -> 'huis')."""
        profile = REGIONAL_PROFILES[region]
        glossary = profile.get("glossary", {})
        for dialect, dutch in glossary.items():
            assert dialect.lower() != dutch.lower(), (
                f"{region}: identity mapping '{dialect}' -> '{dutch}'"
            )

    @pytest.mark.parametrize("region", REGIONS)
    def test_glossary_values_are_strings(self, region):
        """Glossary keys and values must be strings."""
        profile = REGIONAL_PROFILES[region]
        glossary = profile.get("glossary", {})
        for key, val in glossary.items():
            assert isinstance(key, str) and isinstance(val, str), (
                f"{region}: glossary entry '{key}' must have string key and value"
            )


class TestPromptBuilder:
    """CORR-01+CORR-03: build_polishing_prompt integrates examples + glossary."""

    @pytest.mark.parametrize("region", REGIONS)
    def test_glossary_injection(self, region):
        """build_polishing_prompt must include glossary terms in output."""
        from polishing import build_polishing_prompt
        system, json_instr = build_polishing_prompt(region, "samenvatting")
        profile = REGIONAL_PROFILES[region]
        # Check that at least 5 glossary terms appear in the system prompt
        glossary = profile["glossary"]
        found = sum(1 for k in list(glossary.keys())[:10] if k in system)
        assert found >= 5, f"{region}: only {found}/10 glossary terms found in prompt"

    @pytest.mark.parametrize("region", REGIONS)
    def test_few_shot_in_prompt(self, region):
        """build_polishing_prompt must include few-shot examples."""
        from polishing import build_polishing_prompt
        system, json_instr = build_polishing_prompt(region, "samenvatting")
        assert "VOORBEELDEN" in system or "Voorbeeld" in system
