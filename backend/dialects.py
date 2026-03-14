"""
Dialect configuration for Limburgish transcription and correction.
This file contains hotwords, prompts and other language-specific settings.
"""

# Limburgs dialect prompt — mix of NL/DE/FR elements so Whisper recognises
# the characteristic blend without being biased toward any single language.

# Shortened hotwords for efficiency and Whisper compatibility
DIALECT_HOTWORDS = (
    "ich ech mich mech dich dech zich os oos veer wae geer "
    "nao heem hoes kump neet doon kóm hiej hie boete "
    "binne sjool sjaol maat mert kirk hub han höb hant "
    "gekalld geproat versjtaon sjlecht zulle mótte weite "
    "gegange oet efkes richtig zusamme afgevraogd "
    "plezeer sjanse trottoir portemonnaie veur woor "
    "stóng hät mäkt boe mie die us vendaog Mestreech "
    "sjat sjoen meziek get loupe kalle vaan uuch "
    "ajieda ik mik ouk kieke sjoan iéch miéch sjun d'r"
)

# Compact prompt to stay under 448-token decoder limit
DIALECT_PROMPT = (
    "Transcriptie in Limburgs dialect (Mestreechs, Zittesj, Venloos, Kirchröadsj, etc.). "
    "Behoud dialectspelling en klanken (sj, ao, oa, gk, aa). Vertaal NIET.\n"
    "Voorbeelden: Ich bin nao heem gegange. Boe kump die diech tege? Mestreech is us dörpke. "
    "Ik bin nao hoes gegaon. Wir hant tesame jekalld. "
    "Klanken: ich/mech, sjool, nao, zègke. Leenwoorden: merci, plezeer, portemonnaie."
)
