# Limburgs dialect configuration
# Data loaded from data/dialects.json — edit the JSON for glossary/example changes.

import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent / "data" / "dialects.json"

with open(_DATA_PATH, encoding="utf-8") as f:
    _DATA = json.load(f)

# Generic (legacy) exports — used by limburgs profile and as fallbacks
_generic = _DATA["generic"]
DIALECT_STYLE_PROMPT: str = _generic["style_prompt"]
DIALECT_HOTWORDS: str = _generic["hotwords"]
DIALECT_INITIAL_PROMPT: str = DIALECT_STYLE_PROMPT
DIALECT_WORD_BOOST: list[str] = _generic["word_boost"]
DIALECT_CUSTOM_SPELLING: dict[str, list[str]] = _generic["custom_spelling"]
DIALECT_TRANSLATION_KEY: str = _generic["translation_key"]

# Regional profiles (5 dialects)
REGIONAL_PROFILES: dict = _DATA["regional_profiles"]


def get_dialect_config(region_key: str) -> dict:
    """Retrieve the configuration for a specific regional dialect."""
    profile = REGIONAL_PROFILES.get(region_key, REGIONAL_PROFILES["limburgs"])

    return {
        "initial_prompt": profile["style_prompt"],
        "word_boost": profile.get("word_boost", DIALECT_WORD_BOOST),
        "custom_spelling": profile.get("custom_spelling", DIALECT_CUSTOM_SPELLING),
        "translation_key": profile.get("translation_key", DIALECT_TRANSLATION_KEY),
    }
