"""Glossary suggestion utilities — extract word-level corrections from user feedback (FEED-01)."""
from collections import Counter
from dialects import REGIONAL_PROFILES


def extract_correction_pairs(
    original: str,
    system_correction: str,
    user_correction: str,
) -> list[dict]:
    """Extract dialect->Dutch word pairs by comparing original with user correction.

    Returns list of dicts with 'dialect', 'dutch', 'source' keys.
    'source' is 'user' when user correction differs from system, 'system' otherwise.
    """
    orig_words = original.lower().split()
    user_words = user_correction.lower().split()
    system_words = system_correction.lower().split()

    pairs = []
    # Align original with user correction (simple positional matching)
    min_len = min(len(orig_words), len(user_words))
    for i in range(min_len):
        if orig_words[i] != user_words[i]:
            source = "user" if i < len(system_words) and system_words[i] != user_words[i] else "system"
            pairs.append({
                "dialect": orig_words[i],
                "dutch": user_words[i],
                "source": source,
            })

    return pairs


def suggest_glossary_updates(
    corrections: list[dict],
    region: str,
) -> list[dict]:
    """Suggest glossary updates based on accumulated user corrections.

    Analyzes corrections to find repeated dialect->Dutch patterns that
    differ from the current glossary. Returns suggestions sorted by frequency.
    """
    profile = REGIONAL_PROFILES.get(region, {})
    current_glossary = profile.get("glossary", {})

    # Count all correction pairs across all user corrections
    pair_counts: Counter = Counter()
    pair_dutch: dict[str, Counter] = {}

    for corr in corrections:
        pairs = extract_correction_pairs(
            original=corr.get("original_text", ""),
            system_correction=corr.get("corrected_text", ""),
            user_correction=corr.get("user_correction", ""),
        )
        for p in pairs:
            dialect = p["dialect"]
            dutch = p["dutch"]
            pair_counts[dialect] += 1
            if dialect not in pair_dutch:
                pair_dutch[dialect] = Counter()
            pair_dutch[dialect][dutch] += 1

    suggestions = []
    for dialect, count in pair_counts.most_common():
        if count < 1:
            continue
        most_common_dutch = pair_dutch[dialect].most_common(1)[0][0]
        current = current_glossary.get(dialect)
        if current != most_common_dutch:
            suggestions.append({
                "dialect": dialect,
                "suggested_dutch": most_common_dutch,
                "current_dutch": current,
                "frequency": count,
                "action": "update" if current else "add",
            })

    return suggestions
