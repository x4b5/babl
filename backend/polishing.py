"""Polishing output schema and parsing utilities for Phase 6 LLM consistency."""

import json
import re
from pydantic import BaseModel, Field, ValidationError
from dialects import REGIONAL_PROFILES, DIALECT_TRANSLATION_KEY

# Prompt version — increment when system prompts, glossaries, or few-shot examples change.
# Used for A/B testing and WER regression tracking (FEED-02).
PROMPT_VERSION = "v1.0"


def get_prompt_version() -> str:
    """Return the current prompt version string."""
    return PROMPT_VERSION


class PolishingOutput(BaseModel):
    """Structured output model for dialect polishing (CORR-02)."""
    original: str = Field(description="De originele tekst (ongewijzigd)")
    polished: str = Field(description="De gepolijste tekst in standaard Nederlands")
    confidence: float | None = Field(default=None, description="Vertrouwen 0.0-1.0")
    applied_rules: list[str] | None = Field(default=None, description="Toegepaste regels")


JSON_INSTRUCTION = (
    "OUTPUT FORMAT:\n"
    "Geef je antwoord terug als een JSON object met deze structuur:\n"
    '{\n'
    '  "original": "<originele tekst>",\n'
    '  "polished": "<gepolijste tekst in standaard Nederlands>"\n'
    '}\n\n'
    "Geef ALLEEN het JSON object terug, geen andere tekst."
)


SYSTEM_PROMPTS = {
    "samenvatting": (
        "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
        "JE TAAK:\n"
        "Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een BEKNOPTE SAMENVATTING van.\n\n"
        "1. Lees de volledige tekst om de context en bedoeling te begrijpen.\n"
        "2. Vertaal dialectwoorden naar standaard Nederlands.\n"
        "3. Schrijf een korte, bondige samenvatting in lopende tekst (2-4 zinnen voor korte opnames, meer voor langere).\n"
        "4. Focus op de kernpunten: besluiten, conclusies en belangrijkste informatie.\n"
        "5. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n\n"
        "VOORBEELD:\n"
        "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
        "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
        "doe mós dat eigenlijk neet doon zag hae'\n"
        "Output: 'Gisteren was het mooi weer op het plein. Jan gaf aan dat het niet goed was "
        "en adviseerde om het niet te doen.'\n\n"
        "REGELS:\n"
        "- Geef ALLEEN de samenvatting terug als platte tekst, geen JSON, geen labels, geen uitleg.\n"
        "- Voeg geen informatie toe die niet in de brontekst staat.\n"
        "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n"
        "- Kort en bondig. Geen onnodige procesbeschrijving.\n\n"
        f"{DIALECT_TRANSLATION_KEY}"
    ),
    "uitgebreid": (
        "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect en gesproken taal.\n\n"
        "JE TAAK:\n"
        "Je krijgt een ruwe spraak-naar-tekst transcriptie. Maak er een UITGEBREID VERSLAG van.\n\n"
        "1. Lees EERST de volledige tekst om de context en bedoeling te begrijpen.\n"
        "2. Schrijf een uitgebreid, goed gestructureerd Nederlands verslag.\n"
        "3. Gebruik alinea's en indien passend kopjes om het verslag te structureren.\n"
        "4. Geef alle details weer — ook nuances, context, bijzaken en procesbeschrijving.\n"
        "5. Beschrijf wie wat zei, welke argumenten er waren, en hoe tot conclusies is gekomen.\n"
        "6. Vertaal dialectwoorden naar standaard Nederlands.\n"
        "7. Verwijder herhalingen, 'uhm', stotterende woorden en onafgemaakte zinnen.\n"
        "8. Behoud de toon en stijl van de spreker.\n\n"
        "VOORBEELD:\n"
        "Input: 'Ich bin eh gister nao de maat gegange en dao woor het eh sjön weer en "
        "toen hub ich mit de Jan gespraoke en hae zag dat dat neet good woor en eh ja "
        "doe mós dat eigenlijk neet doon zag hae'\n"
        "Output: 'Gisteren ben ik naar het plein gegaan. Het was mooi weer.\n\n"
        "Tijdens het bezoek heb ik met Jan gesproken. Hij gaf aan dat de situatie niet goed "
        "was en adviseerde nadrukkelijk om het niet te doen. Zijn standpunt was duidelijk: "
        "het is eigenlijk geen goede keuze.'\n\n"
        "REGELS:\n"
        "- Geef ALLEEN het verslag terug als platte tekst, geen JSON, geen labels, geen uitleg.\n"
        "- Voeg geen informatie toe die niet in de brontekst staat.\n"
        "- Als de brontaal Duits of een andere taal is, vertaal dan naar Nederlands.\n"
        "- Structureer met alinea's. Gebruik kopjes als de tekst meerdere onderwerpen bevat.\n"
        "- Wees volledig: beschrijf het proces, de argumenten en de conclusies.\n\n"
        f"{DIALECT_TRANSLATION_KEY}"
    ),
}

DIALECT_RETENTION_PROMPT = (
    "Je bent een professionele redacteur gespecialiseerd in Limburgs dialect.\n\n"
    "JE TAAK:\n"
    "Je krijgt een schone Limburgse transcriptie. Maak er een verslag van in bulletpoints of doorlopende tekst (behoud de gevraagde lengte).\n"
    "BELANGRIJK: Schrijf het verslag VOLLEDIG in het Limburgs dialect. Vertaal NIET naar het Nederlands.\n\n"
    "1. Gebruik de Limburgse grammatica en spelling.\n"
    "2. Behou de kern van de boodschap.\n"
    "3. Verwijder herhalingen en irrelevant proces-gepraat.\n\n"
    f"{DIALECT_TRANSLATION_KEY}"
)

CLEANUP_PROMPT = (
    "Je bent een expert in het Limburgs dialect. Je krijgt een ruwe transcriptie.\n"
    "JE TAAK:\n"
    "1. Corrigeer spelfouten in het dialect (gebruik de context).\n"
    "2. Behou het Limburgse dialect, vertaal NIET naar het Nederlands.\n"
    "3. Verwijder stopwoorden zoals 'uhm', 'dus', 'eigenlijk' als ze geen betekenis toevoegen.\n"
    "4. Herstel afgebroken woorden.\n\n"
    "RESULTAAT: Geef alleen de gecorrigeerde Limburgse tekst terug.\n\n"
    f"{DIALECT_TRANSLATION_KEY}"
)

SPEAKER_INSTRUCTION_SAMENVATTING = (
    "\n\nMEERDERE SPREKERS:\n"
    "De transcriptie bevat meerdere sprekers. Behoud de spreker-attributie:\n"
    "- Geef per spreker aan wat zij zeiden.\n"
    "- Gebruik de sprekerlabels uit de transcriptie.\n"
    "- Formaat: begin elk sprekergedeelte met het label gevolgd door een dubbele punt.\n"
)

SPEAKER_INSTRUCTION_UITGEBREID = (
    "\n\nMEERDERE SPREKERS:\n"
    "De transcriptie bevat meerdere sprekers. Structureer het verslag als volgt:\n"
    "- Geef bij elk punt aan wie wat zei, met de sprekerlabels.\n"
    "- Structureer per gespreksonderwerp.\n"
    "- Gebruik de sprekerlabels uit de transcriptie.\n"
)

SYSTEM_PROMPT = SYSTEM_PROMPTS["samenvatting"]


def build_speaker_context(speaker_labels: dict[str, str] | None) -> str:
    """Build speaker context string for the LLM prompt.

    Args:
        speaker_labels: Mapping of speaker IDs to custom names, e.g. {"A": "Arts", "B": "Patient"}.

    Returns:
        Context string to append to the prompt, or empty string if no labels.
    """
    if not speaker_labels:
        return ""

    active = {k: v for k, v in speaker_labels.items() if v}
    if not active:
        return ""

    lines = [f"Spreker {k} = {v}" for k, v in sorted(active.items())]
    return "\nSPREKERLABELS:\n" + "\n".join(lines) + "\n"


def _format_few_shot_examples(examples: list[dict]) -> str:
    """Format few-shot examples for prompt inclusion."""
    if not examples:
        return ""
    formatted = "VOORBEELDEN (volg dit formaat exact):\n\n"
    for i, ex in enumerate(examples, 1):
        formatted += f"Voorbeeld {i}:\n"
        formatted += f"Input: {ex['input']}\n"
        formatted += f"Output:\n{json.dumps(ex['output'], indent=2, ensure_ascii=False)}\n\n"
    return formatted


def build_polishing_prompt(
    region: str,
    report_length: str,
    speaker_labels: dict[str, str] | None = None,
) -> tuple[str, str]:
    """Build system prompt with glossary + few-shot examples + speaker context.

    Args:
        region: Regional dialect key (e.g., "mestreechs")
        report_length: "samenvatting" or "uitgebreid"
        speaker_labels: Optional mapping of speaker IDs to custom names.

    Returns:
        Tuple of (system_prompt, json_instruction)
    """
    profile = REGIONAL_PROFILES.get(region, REGIONAL_PROFILES["limburgs"])
    base = SYSTEM_PROMPTS.get(report_length, SYSTEM_PROMPTS["samenvatting"])

    # Inject expanded glossary (per D-07, D-08: key=value format)
    glossary = profile.get("glossary", {})
    if glossary:
        glossary_lines = [f"{k}={v}" for k, v in glossary.items()]
        glossary_text = "Dialect vertaalsleutel:\n" + "\n".join(glossary_lines)
    else:
        glossary_text = profile.get("translation_key", "")

    # Replace the generic DIALECT_TRANSLATION_KEY placeholder with region-specific glossary
    system = base.replace(DIALECT_TRANSLATION_KEY, glossary_text)

    # Add speaker instructions if the text contains speaker labels
    if speaker_labels:
        if report_length == "uitgebreid":
            system += SPEAKER_INSTRUCTION_UITGEBREID
        else:
            system += SPEAKER_INSTRUCTION_SAMENVATTING
        system += build_speaker_context(speaker_labels)

    # Add few-shot examples (per D-01)
    examples = profile.get("few_shot_examples", [])
    examples_text = _format_few_shot_examples(examples)
    if examples_text:
        system = system + "\n\n" + examples_text

    return (system, JSON_INSTRUCTION)


def parse_polishing_output(raw_text: str, original_input: str) -> PolishingOutput:
    """
    Parse LLM output to PolishingOutput with 3-tier fallback strategy.

    Attempt 1: Direct JSON parse
    Attempt 2: Regex extract JSON from surrounding text
    Attempt 3: Fallback to raw text as polished output

    Args:
        raw_text: Raw LLM output (potentially JSON, potentially prose)
        original_input: The original input text (used for fallback)

    Returns:
        PolishingOutput instance (always succeeds)
    """
    # Attempt 1: Direct JSON parse
    try:
        data = json.loads(raw_text)
        return PolishingOutput(**data)
    except (json.JSONDecodeError, ValidationError):
        pass

    # Attempt 2: Regex extract JSON from surrounding text
    try:
        # Match JSON objects (non-nested for simplicity, DOTALL for multiline)
        match = re.search(r'\{[^{}]*\}', raw_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
            return PolishingOutput(**data)
    except (json.JSONDecodeError, ValidationError):
        pass

    # Attempt 3: Fallback — treat raw text as polished output
    return PolishingOutput(
        original=original_input,
        polished=raw_text.strip()
    )
