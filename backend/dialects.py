# Limburgs dialect configuration

# 1.1 Whisper Prompt Optimization (Legacy/Generic)
DIALECT_STYLE_PROMPT = (
    "Limburgs, West-Germaanse taal (Nederlands/Duits). "
    "Behoud dialect: sj, ao, oa, gk. Vertaal NIET."
)

DIALECT_HOTWORDS = (
    "ich mich dich zich veer geer nao heem hoes kump neet doon kóm hiej "
    "sjool sjaol maat mert kirk hub han höb hant gekalld geproat versjtaon "
    "gegange oet efkes richtig zusamme veur woor hät mäkt boe mie die us "
    "vendaog Mestreech sjat sjoen meziek get loupe kalle vaan uuch ajieda"
)

DIALECT_INITIAL_PROMPT = f"{DIALECT_STYLE_PROMPT}\n{DIALECT_HOTWORDS}"

# 1.2 AssemblyAI Word Boost (Generic)
DIALECT_WORD_BOOST = [
    "ich", "mich", "dich", "zich", "veer", "wae", "geer", "nao", "heem", "hoes",
    "kump", "neet", "doon", "kóm", "hiej", "hie", "sjool", "sjaol", "maat", "mert",
    "kirk", "hub", "han", "höb", "hant", "gekalld", "geproat", "versjtaon",
    "gegange", "oet", "efkes", "richtig", "zusamme", "veur", "woor", "hät", "mäkt",
    "boe", "mie", "die", "us", "vendaog", "Mestreech", "sjat", "sjoen", "meziek",
    "get", "loupe", "kalle", "vaan", "uuch", "ajieda", "iéch", "miéch", "sjun"
]

# 1.2 AssemblyAI Custom Spelling (Generic)
DIALECT_CUSTOM_SPELLING = {
    "neet": ["niet"],
    "sjoon": ["mooi"],
    "sjool": ["school"],
    "maat": ["markt"],
    "kirk": ["kerk"],
    "hoes": ["huis"],
    "nao": ["naar"],
    "hub": ["heb"],
    "höbbe": ["hebben"],
    "vendaog": ["vandaag"],
    "hiej": ["hier"],
    "hae": ["hij"],
}

# 1.4 Correction Vertaalsleutel (Generic)
DIALECT_TRANSLATION_KEY = (
    "Limburgse vertaalsleutel (ter herkenning): "
    "neet=niet, sjoon/sjoen=mooi, hie/hae=hij, dao=daar, nao=naar, "
    "veur=voor, woor=was, hub/höb=heb, kómme=komen, gaon=gaan, "
    "ich=ik, mich=mij, dich=jou, zich=zich, veer/wae=wij, geer=jullie, "
    "hoes=huis, sjool=school, maat=markt."
)

# --- PHASE 4: REGIONAL PROFILES ---

REGIONAL_PROFILES = {
    "limburgs": {
        "name": "Limburgs (Algemeen)",
        "style_prompt": DIALECT_STYLE_PROMPT,
        "hotwords": DIALECT_HOTWORDS,
        "word_boost": DIALECT_WORD_BOOST,
        "custom_spelling": DIALECT_CUSTOM_SPELLING,
        "translation_key": DIALECT_TRANSLATION_KEY
    },
    "mestreechs": {
        "name": "Mestreechs",
        "style_prompt": "Mestreechs dialect. Gebruik zachte g, Franse invloeden, 'vaan', 'uuch', 'iech'.",
        "hotwords": "iech miéch diéch uuch vaan dees dink sjat kalle geit nörges hiel Mestreech",
        "word_boost": ["iech", "miéch", "diéch", "uuch", "vaan", "Mestreech"],
        "custom_spelling": {"iech": ["ik"], "vaan": ["van"], "uuch": ["u", "jullie"]},
        "translation_key": "Mestreechse kern: iech=ik, vaan=van, uuch=u/jullie, sjat=schat."
    },
    "zittesj": {
        "name": "Zittesj",
        "style_prompt": "Zittesj dialect. Meer Duits-geïnspireerd, hardere klanken, 'ich', 'mich', 'zittesj'.",
        "hotwords": "ich mich dich zich hiej kump richtig zusamme Zitterd sjpraoke",
        "word_boost": ["ich", "mich", "dich", "zich", "Zitterd", "richtig"],
        "custom_spelling": {"ich": ["ik"], "mich": ["mij"], "zich": ["zich"]},
        "translation_key": "Zittesje kern: ich=ik, mich=mij, dich=jou, richtig=juist."
    },
    "venloos": {
        "name": "Venloos",
        "style_prompt": "Venloos dialect. Noordelijker, dichter bij standaard Nederlands maar met duidelijke 'Venlose' klanken.",
        "hotwords": "ik mich dich ouch gans Venlo mótte waas kómme",
        "word_boost": ["mich", "dich", "Venlo", "waas", "mótte"],
        "custom_spelling": {"mich": ["mij"], "dich": ["jou"], "waas": ["was"]},
        "translation_key": "Venlose kern: mich=mij, dich=jou, waas=was, mótte=moeten."
    },
    "kirchroeadsj": {
        "name": "Kirchröadsj",
        "style_prompt": "Kirchröadsj (Ripuarisch). Sterke Duitse invloed, 'jonge', 'han', 'hant', 'mure'.",
        "hotwords": "iech miéch diéch d'r hant han hät Kirchröa d'r jonge mure",
        "word_boost": ["iech", "miéch", "diéch", "hant", "han", "Kirchröa"],
        "custom_spelling": {"hant": ["hebben"], "han": ["heb"], "iech": ["ik"]},
        "translation_key": "Kirchröadsje kern: iech=ik, han=heb, hant=hebben, d'r=de/het."
    }
}

def get_dialect_config(region_key: str):
    """Retrieve the configuration for a specific regional dialect."""
    profile = REGIONAL_PROFILES.get(region_key, REGIONAL_PROFILES["limburgs"])
    
    # Merge with generic if keys are missing (though they are all present above for now)
    return {
        "initial_prompt": f"{profile['style_prompt']}\n{profile['hotwords']}",
        "word_boost": profile.get("word_boost", DIALECT_WORD_BOOST),
        "custom_spelling": profile.get("custom_spelling", DIALECT_CUSTOM_SPELLING),
        "translation_key": profile.get("translation_key", DIALECT_TRANSLATION_KEY)
    }
