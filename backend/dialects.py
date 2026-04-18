# Limburgs dialect configuration

# 1.1 Whisper Prompt Optimization (Legacy/Generic)
DIALECT_STYLE_PROMPT = (
    "Limburgs, West-Germaanse taal (Nederlands/Duits). "
    "Behoud dialect: sj, ao, oa, gk. Vertaal NIET."
)

DIALECT_HOTWORDS = (
    "ich mich dich zich veer wae geer nao heem hoes kump neet doon kóm hiej "
    "sjool sjaol maat mert kirk hub han höb hant gekalld geproat versjtaon "
    "gegange oet efkes richtig zusamme veur woor hät mäkt boe mie die us "
    "vendaog Mestreech sjat sjoen meziek get loupe kalle vaan uuch ajieda "
    "eur hön dae dat gaon kómme höbbe zeen wete sjtad sjtroat kènk wèrk aovend "
    "groeët good sjtil flot sjoen dae efkes"
)

DIALECT_INITIAL_PROMPT = f"{DIALECT_STYLE_PROMPT}\n{DIALECT_HOTWORDS}"

# 1.2 AssemblyAI Word Boost (Generic) — expanded to 70 entries
DIALECT_WORD_BOOST = [
    # Pronouns and determiners
    "ich", "mich", "dich", "zich", "veer", "wae", "geer", "eur", "hön", "dae", "dat",
    # Verbs
    "gaon", "kómme", "höbbe", "zeen", "wete", "kump", "doon", "kóm", "gekalld", "geproat",
    "versjtaon", "gegange", "loupe", "kalle",
    # Nouns
    "heem", "hoes", "sjtad", "sjtroat", "kènk", "wèrk", "aovend", "sjool", "sjaol",
    "maat", "mert", "kirk", "meziek",
    # Adjectives and adverbs
    "nao", "neet", "hiej", "hie", "oet", "efkes", "richtig", "zusamme", "veur", "woor",
    "groeët", "good", "sjtil", "flot",
    # Verb forms and particles
    "hub", "han", "höb", "hant", "hät", "mäkt",
    # Common expressions
    "boe", "mie", "die", "us", "vendaog", "sjat", "sjoen", "sjun", "ajieda",
    # Place names
    "Mestreech",
    # Accented variants
    "iéch", "miéch"
]

# 1.2 AssemblyAI Custom Spelling (Generic) — expanded to 20 entries
DIALECT_CUSTOM_SPELLING = {
    "neet": ["niet"],
    "sjoon": ["mooi"],
    "sjoen": ["mooi"],
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
    "dae": ["die"],
    "gaon": ["gaan"],
    "kómme": ["komen"],
    "veur": ["voor"],
    "woor": ["was"],
    "oet": ["uit"],
    "efkes": ["even"],
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
        "hotwords": "iech miéch diéch uuch vaan dees dink sjat kalle geit nörges hiel Mestreech ziech heur kómme höbbe waere kinne maoge moote sjoen sjun groeët kling good sjtil flot dök sjampetter trottoir paraplu Vrijthof Maas Sjlaansen Mooswief ajuu adiees asjeblieft dankewaal",
        "word_boost": [
            # Pronouns (Maastricht-specific)
            "iech", "miéch", "diéch", "uuch", "heur", "ziech",
            # Verbs
            "kalle", "loupe", "gaon", "kómme", "höbbe", "zeen", "waere", "kinne", "maoge", "moote",
            # Nouns
            "sjtroat", "sjool", "kèrk", "sjtad", "plein", "meziek", "ènne", "aovend", "mörge", "vrundin",
            # Adjectives
            "sjoen", "sjun", "groeët", "kling", "good", "sjtil", "flot", "dök",
            # French loanwords
            "sjampetter", "trottoir", "paraplu",
            # Local places/culture
            "Mestreech", "Vrijthof", "Maas", "Sjlaansen", "Mooswief",
            # Common expressions
            "ajuu", "adiees", "asjeblieft", "dankewaal",
            # Additional high-frequency Maastricht words
            "vaan", "nao", "hiej", "dao", "oet", "inne", "mèt", "zónger", "achter",
            "vuur", "naor", "ieëder", "aafies", "dees", "dink", "geit", "nörges", "hiel",
            "aon", "sjriëve", "leze", "waore", "sjpele", "sjlaon", "sjteike",
            "vroge", "vraoge", "antjwaorde"
        ],
        "custom_spelling": {
            "iech": ["ik"], "iéch": ["ik"], "miéch": ["mij"], "diéch": ["jou"],
            "uuch": ["u", "jullie"], "heur": ["haar"], "ziech": ["zich"],
            "vaan": ["van"], "nao": ["naar"], "sjoen": ["mooi"], "sjun": ["mooi"],
            "kalle": ["praten"], "loupe": ["lopen"], "höbbe": ["hebben"],
            "waere": ["zijn"], "kinne": ["kunnen"], "maoge": ["mogen"],
            "moote": ["moeten"], "sjtroat": ["straat"], "kling": ["klein"],
            "dök": ["vaak"], "dankewaal": ["dankjewel"],
        },
        "translation_key": "Mestreechse kern: iech=ik, vaan=van, uuch=u/jullie, sjat=schat, kalle=praten, loupe=lopen, waere=zijn, dök=vaak."
    },
    "zittesj": {
        "name": "Zittesj",
        "style_prompt": "Zittesj dialect. Meer Duits-geïnspireerd, hardere klanken, 'ich', 'mich', 'zittesj'.",
        "hotwords": "ich mich dich zich hiej kump richtig zusamme Zitterd sjpraoke ós uur bitte wirklich plötzlich geit hant wees zoot",
        "word_boost": [
            # Pronouns (Sittard-specific)
            "ich", "mich", "dich", "zich", "ós", "uur",
            # German-influenced words
            "richtig", "zusamme", "plötzlich", "bitte", "wirklich",
            # Verbs
            "sjpraoke", "kump", "geit", "hant", "wees", "zoot",
            # Nouns
            "Zitterd", "kirchof", "sjtraot", "kinjer", "vrouw",
            # Additional Sittard-specific vocabulary
            "nao", "neet", "hiej", "höb", "hub", "gaon", "kómme", "höbbe", "zeen",
            "sjtad", "hoes", "kirk", "sjool", "maat", "sjtroat", "kènk", "aovend",
            "good", "groeët", "kling", "sjtil", "flot", "veur", "woor", "oet", "efkes",
            "dao", "heem", "mörge", "mie", "die", "us", "dees", "dat", "boe",
            "waas", "waar", "waat", "wie", "woe", "wuruum", "sjoen", "lelijk", "dök",
            "nöit", "altiëd", "ieder", "alle", "inne", "oppe"
        ],
        "custom_spelling": {
            "ich": ["ik"], "mich": ["mij"], "dich": ["jou"],
            "ós": ["ons"], "uur": ["jullie"], "richtig": ["juist"],
            "zusamme": ["samen"], "sjpraoke": ["spreken"], "kump": ["komt"],
            "geit": ["gaat"], "hant": ["hebben"], "wees": ["wist"],
            "zoot": ["zat"], "sjtraot": ["straat"], "kinjer": ["kinderen"],
            "neet": ["niet"], "hiej": ["hier"], "nao": ["naar"],
            "höb": ["heb"], "bitte": ["alsjeblieft"], "wirklich": ["werkelijk"],
        },
        "translation_key": "Zittesje kern: ich=ik, mich=mij, dich=jou, richtig=juist, zusamme=samen, sjpraoke=spreken, kump=komt, geit=gaat."
    },
    "venloos": {
        "name": "Venloos",
        "style_prompt": "Venloos dialect. Noordelijker, dichter bij standaard Nederlands maar met duidelijke 'Venlose' klanken.",
        "hotwords": "ik mich dich ouch gans Venlo mótte waas kómme höbbe zeen loupe gaon nao hiej neet hoes kirk sjtroat sjtad veur",
        "word_boost": [
            # Pronouns (Venlo-specific)
            "mich", "dich", "ouch", "gans",
            # Verbs
            "mótte", "kómme", "waas", "höbbe", "zeen", "loupe", "gaon",
            # Nouns
            "Venlo", "Maas", "sjtroat", "sjtad", "kirk", "hoes",
            # Additional Venlo vocabulary
            "nao", "neet", "hiej", "hub", "höb", "veur", "woor", "oet", "efkes",
            "sjool", "maat", "kènk", "aovend", "mörge", "good", "groeët", "kling",
            "sjtil", "flot", "dao", "heem", "mie", "die", "us", "dees", "dat",
            "boe", "waar", "waat", "wie", "woe", "wuruum", "sjoen", "dök", "nöit",
            "altiëd", "ieder", "alle", "inne", "oppe", "mèt", "zónger"
        ],
        "custom_spelling": {
            "mich": ["mij"], "dich": ["jou"], "waas": ["was"],
            "mótte": ["moeten"], "ouch": ["ook"], "gans": ["heel"],
            "höbbe": ["hebben"], "kómme": ["komen"], "neet": ["niet"],
            "hoes": ["huis"], "kirk": ["kerk"], "nao": ["naar"],
            "hiej": ["hier"], "hub": ["heb"], "gaon": ["gaan"],
            "sjtroat": ["straat"], "loupe": ["lopen"], "veur": ["voor"],
        },
        "translation_key": "Venlose kern: mich=mij, dich=jou, waas=was, mótte=moeten, ouch=ook, gans=heel."
    },
    "kirchroeadsj": {
        "name": "Kirchröadsj",
        "style_prompt": "Kirchröadsj (Ripuarisch). Sterke Duitse invloed, 'jonge', 'han', 'hant', 'mure'.",
        "hotwords": "iech miéch diéch d'r hant han hät Kirchröa jonge mure uvver wasser tsimmer sjtraos junt koame zage wisse ós plat sjpas hoeëg deep meëdsje kirchof",
        "word_boost": [
            # Pronouns (Kerkrade-specific, Ripuarian)
            "iech", "miéch", "diéch", "d'r", "ós",
            # Strong German influence
            "mure", "uvver", "wasser", "tsimmer", "sjtraos",
            # Verbs
            "han", "hant", "junt", "koame", "zage", "wisse",
            # Nouns
            "Kirchröa", "jonge", "meëdsje", "kirchof",
            # Ripuarian-specific
            "plat", "sjpas", "hoeëg", "deep",
            # Additional Kerkrade vocabulary
            "nao", "neet", "hiej", "höb", "hub", "gaon", "kómme", "höbbe", "zeen",
            "sjtad", "hoes", "kirk", "sjool", "maat", "sjtroat", "kènk", "aovend",
            "good", "groeët", "kling", "sjtil", "flot", "veur", "woor", "oet", "efkes",
            "dao", "heem", "mörge", "mie", "die", "us", "dees", "dat", "boe",
            "waas", "waar", "waat", "wie", "woe", "wuruum", "sjoen", "dök", "nöit",
            "altiëd", "ieder", "alle"
        ],
        "custom_spelling": {
            "iech": ["ik"], "miéch": ["mij"], "diéch": ["jou"],
            "d'r": ["de", "het", "hij"], "hant": ["hebben"], "han": ["heb"],
            "junt": ["gaan"], "koame": ["komen"], "zage": ["zeggen"],
            "wisse": ["weten"], "mure": ["morgen"], "uvver": ["over"],
            "wasser": ["water"], "tsimmer": ["kamer"], "sjtraos": ["straat"],
            "jonge": ["jongen"], "meëdsje": ["meisje"], "hoeëg": ["hoog"],
            "ós": ["ons"], "sjpas": ["pret"], "neet": ["niet"],
            "plat": ["dialect"],
        },
        "translation_key": "Kirchröadsje kern: iech=ik, han=heb, hant=hebben, d'r=de/het, junt=gaan, koame=komen, mure=morgen."
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
