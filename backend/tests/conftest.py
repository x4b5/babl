"""Shared pytest fixtures for dialect and hallucination tests."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from polishing import CorrectionOutput


@pytest.fixture
def sample_dialect_config():
    """Sample dialect config matching get_dialect_config() output shape."""
    return {
        "initial_prompt": "Test dialect prompt\ntest hotwords",
        "word_boost": ["iech", "vaan", "uuch", "sjoen", "neet"],
        "custom_spelling": {"iech": ["ik"], "vaan": ["van"]},
        "translation_key": "Test translation key"
    }


@pytest.fixture
def all_region_keys():
    """List of all 5 regional dialect keys."""
    return ["limburgs", "mestreechs", "zittesj", "venloos", "kirchroeadsj"]


@pytest.fixture
def hallucination_test_strings():
    """Test strings for hallucination detection tests."""
    return {
        "clean": "De kat zit op de mat en kijkt naar buiten.",
        "repetitive": "ja ja ja ja ja ja ja ja ja ja ja ja ja ja ja",
        "whisper_phantom": "Thank you for watching. Please subscribe and like.",
        "dutch_phantom": "Ondertiteling door Amara.org community",
        "mixed": "De kat zit op de mat. Thank you for watching. De hond loopt buiten.",
        "legitimate_repeat": "ja ja dat klopt ja",
        "empty": "",
        "nonsense_loop": "hallo hallo hallo hallo hallo hallo hallo hallo hallo hallo",
    }


@pytest.fixture
def sample_correction_output():
    """Sample CorrectionOutput instance for testing."""
    return CorrectionOutput(
        original="Iech bin gister nao de maat gegange.",
        corrected="Ik ben gisteren naar de markt gegaan.",
        confidence=0.92,
        applied_rules=["iech->ik", "nao->naar", "maat->markt", "gegange->gegaan"]
    )
