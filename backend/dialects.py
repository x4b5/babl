# Limburgs dialect configuration

# 1.1 Whisper Prompt Optimization (Legacy/Generic)
DIALECT_STYLE_PROMPT = (
    "Limburgs dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
    "Ich hub gister nao de maat gegange en dao woor het sjoen weer.\n"
    "De kinjer höbbe efkes oet de sjtroat gesjpeelt, dat woor richtig flot.\n"
    "Veer gaon nao hoes want het is al loat en veer zeen moe."
)

DIALECT_HOTWORDS = (
    "ich mich dich zich veer wae geer nao heem hoes kump neet doon kóm hiej "
    "sjool sjaol maat mert kirk hub han höb hant gekalld geproat versjtaon "
    "gegange oet efkes richtig zusamme veur woor hät mäkt boe mie die us "
    "vendaog Mestreech sjat sjoen meziek get loupe kalle vaan uuch ajieda "
    "eur hön dae dat gaon kómme höbbe zeen wete sjtad sjtroat kènk wèrk aovend "
    "groeët good sjtil flot sjoen dae efkes"
)

DIALECT_INITIAL_PROMPT = DIALECT_STYLE_PROMPT

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
        "style_prompt": (
            "Limburgs dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
            "Ich hub gister nao de maat gegange en dao woor het sjoen weer.\n"
            "De kinjer höbbe efkes oet de sjtroat gesjpeelt, dat woor richtig flot.\n"
            "Veer gaon nao hoes want het is al loat en veer zeen moe."
        ),
        "hotwords": DIALECT_HOTWORDS,
        "word_boost": DIALECT_WORD_BOOST,
        "custom_spelling": DIALECT_CUSTOM_SPELLING,
        "translation_key": DIALECT_TRANSLATION_KEY,
        "few_shot_examples": [
            {
                "input": "Ich hub gister nao de maat gegange en dao woor het sjoen weer.",
                "output": {
                    "original": "Ich hub gister nao de maat gegange en dao woor het sjoen weer.",
                    "corrected": "Ik heb gisteren naar de markt gegaan en daar was het mooi weer.",
                    "applied_rules": ["ich=ik", "hub=heb", "nao=naar", "gegange=gegaan", "dao=daar", "woor=was", "sjoen=mooi"]
                }
            },
            {
                "input": "De kinjer höbbe vanoavend efkes oet de sjtroat gesjpeelt.",
                "output": {
                    "original": "De kinjer höbbe vanoavend efkes oet de sjtroat gesjpeelt.",
                    "corrected": "De kinderen hebben vanavond even uit de straat gespeeld."
                }
            },
            {
                "input": "Wae mótte nao hoes gaon want het is al loat en veer zeen moe.",
                "output": {
                    "original": "Wae mótte nao hoes gaon want het is al loat en veer zeen moe.",
                    "corrected": "Wij moeten naar huis gaan want het is al laat en wij zijn moe."
                }
            }
        ],
        "glossary": {
            # From custom_spelling (20 entries)
            "neet": "niet",
            "sjoon": "mooi",
            "sjoen": "mooi",
            "sjool": "school",
            "maat": "markt",
            "kirk": "kerk",
            "hoes": "huis",
            "nao": "naar",
            "hub": "heb",
            "höbbe": "hebben",
            "vendaog": "vandaag",
            "hiej": "hier",
            "hae": "hij",
            "dae": "die",
            "gaon": "gaan",
            "kómme": "komen",
            "veur": "voor",
            "woor": "was",
            "oet": "uit",
            "efkes": "even",
            # Additional common Limburgish words (35+ more)
            "ich": "ik",
            "mich": "mij",
            "dich": "jou",
            "veer": "wij",
            "wae": "wij",
            "geer": "jullie",
            "dao": "daar",
            "heem": "hem",
            "kump": "komt",
            "doon": "doen",
            "kóm": "kom",
            "gekalld": "gepraat",
            "geproat": "gepraat",
            "versjtaon": "verstaan",
            "gegange": "gegaan",
            "sjaol": "sjaal",
            "mert": "maart",
            "han": "heb",
            "höb": "heb",
            "hant": "hebben",
            "hät": "heeft",
            "mäkt": "maakt",
            "boe": "hoe",
            "mie": "mij",
            "die": "jou",
            "us": "ons",
            "groeët": "groot",
            "good": "goed",
            "sjtil": "stil",
            "flot": "vlot",
            "sjtad": "stad",
            "sjtroat": "straat",
            "kènk": "kind",
            "wèrk": "werk",
            "aovend": "avond",
            "mörge": "morgen",
            "zeen": "zijn",
            "wete": "weten",
            "loupe": "lopen",
            "kalle": "praten",
            "kinjer": "kinderen",
            "richtig": "juist",
            "zusamme": "samen",
            "loat": "laat",
            "sjpele": "spelen",
            "gesjpeelt": "gespeeld",
            # Voorzetsels/voegwoorden
            "tösje": "tussen",
            "durch": "door",
            "weil": "want",
            "obwohl": "hoewel",
            "toege": "toch",
            "bove": "boven",
            "ónger": "onder",
            # Bijwoorden van tijd
            "noe": "nu",
            "dökser": "vaker",
            "daonoets": "daarna",
            "ieësjt": "eerst",
            "nag": "nog",
            "altiëd": "altijd",
            # Werkwoord-vervoegingen
            "höbs": "heb je",
            "höbt": "hebt",
            "woors": "was je",
            "kömp": "komt",
            "giëng": "ging",
            "koam": "kwam",
            "zouw": "zou",
            "kós": "kon",
            "mós": "moest",
            "wool": "wilde",
            # Samenstellingen
            "gisteraovend": "gisteravond",
            "vanoavend": "vanavond",
            "vanmörge": "vanmorgen",
            "overmaore": "overmorgen",
            # Emotionele/informele taal
            "auw": "au",
            "jao": "ja",
            "alleh": "vooruit",
            "asjemenou": "hemeltjelief",
            # Telwoorden
            "ein": "een",
            "twei": "twee",
            "veer": "vier",
            "vief": "vijf",
            "zeve": "zeven",
            "ach": "acht",
            "nege": "negen",
            # Fonetische varianten
            "iech": "ik",
            "sjun": "mooi",
            # Body/daily life
            "oge": "ogen",
            "oore": "oren",
            "kop": "hoofd",
            "henj": "hand",
            "hank": "handen",
            "voot": "voet",
            "veut": "voeten",
            "ete": "eten",
            "drinke": "drinken",
            "sjlope": "slapen",
            "wasche": "wassen",
            # Family/social
            "kèndj": "kind",
            "mooder": "moeder",
            "broor": "broer",
            "zöster": "zuster",
            "naoberj": "buurman",
            # Weather/nature
            "reëge": "regen",
            "wink": "wind",
            "zón": "zon",
            "wólke": "wolken",
            "kouw": "koud",
            "werm": "warm",
            "dróg": "droog"
        }
    },
    "mestreechs": {
        "name": "Mestreechs",
        "style_prompt": (
            "Mestreechs dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
            "Iech bin vaan de mörge nao de Vrijthof gegange en hub dao mien vrundin getroffe.\n"
            "Uuch mót dees sjampetter sjnel oppe trottoir pakke vuur et kapot geit.\n"
            "Iech höbbe gisteraovend mit de paraplu geloupe vaan Sjlaansen nao hoes toe."
        ),
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
        "translation_key": "Mestreechse kern: iech=ik, vaan=van, uuch=u/jullie, sjat=schat, kalle=praten, loupe=lopen, waere=zijn, dök=vaak.",
        "few_shot_examples": [
            {
                "input": "Iech bin vaan de mörge nao de Vrijthof gegange en hub dao mien vrundin getroffe.",
                "output": {
                    "original": "Iech bin vaan de mörge nao de Vrijthof gegange en hub dao mien vrundin getroffe.",
                    "corrected": "Ik ben vanmorgen naar de Vrijthof gegaan en heb daar mijn vriendin getroffen."
                }
            },
            {
                "input": "Uuch mót dees sjampetter sjnel oppe trottoir pakke vuur et kapot geit.",
                "output": {
                    "original": "Uuch mót dees sjampetter sjnel oppe trottoir pakke vuur et kapot geit.",
                    "corrected": "Jullie moeten deze champignons snel op het trottoir pakken voordat het kapot gaat.",
                    "applied_rules": ["uuch=jullie", "mót=moet", "dees=deze", "sjampetter=champignons", "oppe=op het", "trottoir=trottoir (Frans)", "vuur=voordat", "geit=gaat"]
                }
            },
            {
                "input": "Mien heur kalle good Mestreechs en ziech waere dök aan de Maas te vinje.",
                "output": {
                    "original": "Mien heur kalle good Mestreechs en ziech waere dök aan de Maas te vinje.",
                    "corrected": "Mijn haar spreekt goed Maastrichts en zij zijn vaak aan de Maas te vinden."
                }
            },
            {
                "input": "Iech höbbe gisteraovend mit de paraplu geloupe vaan Sjlaansen nao hoes toe.",
                "output": {
                    "original": "Iech höbbe gisteraovend mit de paraplu geloupe vaan Sjlaansen nao hoes toe.",
                    "corrected": "Ik heb gisteravond met de paraplu gelopen van Schlaensen naar huis toe."
                }
            }
        ],
        "glossary": {
            # From custom_spelling (22 entries)
            "iech": "ik",
            "iéch": "ik",
            "miéch": "mij",
            "diéch": "jou",
            "uuch": "jullie",
            "heur": "haar",
            "ziech": "zich",
            "vaan": "van",
            "nao": "naar",
            "sjoen": "mooi",
            "sjun": "mooi",
            "kalle": "praten",
            "loupe": "lopen",
            "höbbe": "hebben",
            "waere": "zijn",
            "kinne": "kunnen",
            "maoge": "mogen",
            "moote": "moeten",
            "sjtroat": "straat",
            "kling": "klein",
            "dök": "vaak",
            "dankewaal": "dankjewel",
            # Additional French-influenced and Maastricht-specific words (40+ more)
            "sjampetter": "champignons",
            "bin": "ben",
            "mörge": "morgen",
            "hub": "heb",
            "dao": "daar",
            "mien": "mijn",
            "vrundin": "vriendin",
            "getroffe": "getroffen",
            "mót": "moet",
            "dees": "deze",
            "sjnel": "snel",
            "oppe": "op het",
            "pakke": "pakken",
            "vuur": "voordat",
            "geit": "gaat",
            "et": "het",
            "zeen": "zijn",
            "vinje": "vinden",
            "gisteraovend": "gisteravond",
            "mit": "met",
            "geloupe": "gelopen",
            "hoes": "huis",
            "sjat": "schat",
            "groeët": "groot",
            "good": "goed",
            "sjtil": "stil",
            "flot": "vlot",
            "hiej": "hier",
            "oet": "uit",
            "mèt": "met",
            "zónger": "zonder",
            "naor": "naar",
            "ieëder": "ieder",
            "aafies": "misschien",
            "dink": "ding",
            "nörges": "nergens",
            "hiel": "heel",
            "aon": "aan",
            "sjriëve": "schrijven",
            "leze": "lezen",
            "waore": "waren",
            "sjpele": "spelen",
            "sjlaon": "slaan",
            "vroge": "vragen",
            "vraoge": "vragen",
            "antjwaorde": "antwoorden",
            "ajuu": "adieu",
            "adiees": "adieu",
            "asjeblieft": "alsjeblieft",
            "gaon": "gaan",
            "kómme": "komen",
            "höbbe": "hebben",
            "meziek": "muziek",
            "ènne": "een",
            "Mestreech": "Maastricht",
            "Sjlaansen": "Schlaensen",
            # Voorzetsels/voegwoorden
            "tösje": "tussen",
            "durch": "door",
            "weil": "want",
            "obwohl": "hoewel",
            "toege": "toch",
            "bove": "boven",
            "ónger": "onder",
            # Bijwoorden van tijd
            "noe": "nu",
            "dökser": "vaker",
            "daonoets": "daarna",
            "ieësjt": "eerst",
            "nag": "nog",
            "altiëd": "altijd",
            "altied": "altijd",
            # Werkwoord-vervoegingen
            "höbs": "heb je",
            "höbt": "hebt",
            "woors": "was je",
            "kömp": "komt",
            "giëng": "ging",
            "koam": "kwam",
            "zouw": "zou",
            "kós": "kon",
            "mós": "moest",
            "wool": "wilde",
            # Samenstellingen
            "vanoavend": "vanavond",
            "vanmörge": "vanmorgen",
            "overmaore": "overmorgen",
            # Emotionele/informele taal
            "auw": "au",
            "jao": "ja",
            "alleh": "vooruit",
            "asjemenou": "hemeltjelief",
            # Telwoorden
            "ein": "een",
            "twei": "twee",
            "veer": "vier",
            "vief": "vijf",
            "zeve": "zeven",
            "ach": "acht",
            "nege": "negen",
            # Body/daily life
            "oge": "ogen",
            "oore": "oren",
            "kop": "hoofd",
            "henj": "hand",
            "hank": "handen",
            "voot": "voet",
            "veut": "voeten",
            "ete": "eten",
            "drinke": "drinken",
            "sjlope": "slapen",
            "wasche": "wassen",
            # Family/social (French-influenced)
            "kèndj": "kind",
            "mooder": "moeder",
            "broor": "broer",
            "zöster": "zuster",
            "naoberj": "buurman",
            # Weather/nature
            "reëge": "regen",
            "wink": "wind",
            "zón": "zon",
            "wólke": "wolken",
            "kouw": "koud",
            "werm": "warm",
            "dróg": "droog"
        }
    },
    "zittesj": {
        "name": "Zittesj",
        "style_prompt": (
            "Zittesj dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
            "Ich han dat richtig zusamme mit de kinjer gedoon bitte.\n"
            "De vrouw kump vaan Zitterd en sjpraoke altied Zittesj mit heur kinjer.\n"
            "Ós uur höb plötzlich geseen dat wirklich neet good woor."
        ),
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
        "translation_key": "Zittesje kern: ich=ik, mich=mij, dich=jou, richtig=juist, zusamme=samen, sjpraoke=spreken, kump=komt, geit=gaat.",
        "few_shot_examples": [
            {
                "input": "Ich han dat richtig zusamme mit de kinjer gedoon bitte.",
                "output": {
                    "original": "Ich han dat richtig zusamme mit de kinjer gedoon bitte.",
                    "corrected": "Ik heb dat goed samen met de kinderen gedaan alsjeblieft.",
                    "applied_rules": ["ich=ik", "han=heb", "richtig=goed/juist", "zusamme=samen", "kinjer=kinderen", "gedoon=gedaan", "bitte=alsjeblieft"]
                }
            },
            {
                "input": "Ós uur höb plötzlich geseen dat wirklich neet good woor.",
                "output": {
                    "original": "Ós uur höb plötzlich geseen dat wirklich neet good woor.",
                    "corrected": "Onze jullie hebben plotseling gezien dat werkelijk niet goed was."
                }
            },
            {
                "input": "De vrouw kump vaan Zitterd en sjpraoke altied Zittesj mit heur kinjer inne kirchof.",
                "output": {
                    "original": "De vrouw kump vaan Zitterd en sjpraoke altied Zittesj mit heur kinjer inne kirchof.",
                    "corrected": "De vrouw komt van Sittard en spreekt altijd Sittards met haar kinderen in het kerkhof."
                }
            }
        ],
        "glossary": {
            # From custom_spelling (21 entries)
            "ich": "ik",
            "mich": "mij",
            "dich": "jou",
            "ós": "ons",
            "uur": "jullie",
            "richtig": "juist",
            "zusamme": "samen",
            "sjpraoke": "spreken",
            "kump": "komt",
            "geit": "gaat",
            "hant": "hebben",
            "wees": "wist",
            "zoot": "zat",
            "sjtraot": "straat",
            "kinjer": "kinderen",
            "neet": "niet",
            "hiej": "hier",
            "nao": "naar",
            "höb": "heb",
            "bitte": "alsjeblieft",
            "wirklich": "werkelijk",
            # Additional German-influenced and Sittard-specific words (35+ more)
            "han": "heb",
            "gedoon": "gedaan",
            "plötzlich": "plotseling",
            "geseen": "gezien",
            "woor": "was",
            "good": "goed",
            "vaan": "van",
            "Zitterd": "Sittard",
            "altied": "altijd",
            "mit": "met",
            "heur": "haar",
            "inne": "in het",
            "kirchof": "kerkhof",
            "hub": "heb",
            "gaon": "gaan",
            "kómme": "komen",
            "höbbe": "hebben",
            "zeen": "zijn",
            "sjtad": "stad",
            "hoes": "huis",
            "kirk": "kerk",
            "sjool": "school",
            "maat": "markt",
            "sjtroat": "straat",
            "kènk": "kind",
            "aovend": "avond",
            "groeët": "groot",
            "kling": "klein",
            "sjtil": "stil",
            "flot": "vlot",
            "veur": "voor",
            "oet": "uit",
            "efkes": "even",
            "dao": "daar",
            "heem": "hem",
            "mörge": "morgen",
            "mie": "mij",
            "die": "jou",
            "us": "ons",
            "dees": "deze",
            "boe": "hoe",
            "waas": "was",
            "waat": "wat",
            "woe": "waar",
            "wuruum": "waarom",
            "sjoen": "mooi",
            "dök": "vaak",
            "nöit": "nooit",
            "altiëd": "altijd",
            "oppe": "op het",
            "sjun": "mooi",
            "gekalld": "gepraat",
            # Voorzetsels/voegwoorden (German-influenced)
            "tösje": "tussen",
            "durch": "door",
            "weil": "want",
            "obwohl": "hoewel",
            "toege": "toch",
            "bove": "boven",
            "ónger": "onder",
            # Bijwoorden van tijd
            "noe": "nu",
            "dökser": "vaker",
            "daonoets": "daarna",
            "ieësjt": "eerst",
            "nag": "nog",
            # Werkwoord-vervoegingen
            "höbs": "heb je",
            "höbt": "hebt",
            "woors": "was je",
            "kömp": "komt",
            "giëng": "ging",
            "koam": "kwam",
            "zouw": "zou",
            "kós": "kon",
            "mós": "moest",
            "wool": "wilde",
            # Samenstellingen
            "gisteraovend": "gisteravond",
            "vanoavend": "vanavond",
            "vanmörge": "vanmorgen",
            "overmaore": "overmorgen",
            # Emotionele/informele taal
            "auw": "au",
            "jao": "ja",
            "alleh": "vooruit",
            "asjemenou": "hemeltjelief",
            # Telwoorden
            "ein": "een",
            "twei": "twee",
            "veer": "vier",
            "vief": "vijf",
            "zeve": "zeven",
            "ach": "acht",
            "nege": "negen",
            # Fonetische varianten
            "noar": "naar",
            # Body/daily life
            "oge": "ogen",
            "oore": "oren",
            "kop": "hoofd",
            "henj": "hand",
            "hank": "handen",
            "voot": "voet",
            "veut": "voeten",
            "ete": "eten",
            "drinke": "drinken",
            "sjlope": "slapen",
            "wasche": "wassen",
            # Family/social
            "kèndj": "kind",
            "mooder": "moeder",
            "broor": "broer",
            "zöster": "zuster",
            "naoberj": "buurman",
            "vrundin": "vriendin",
            # Weather/nature
            "reëge": "regen",
            "wink": "wind",
            "zón": "zon",
            "wólke": "wolken",
            "kouw": "koud",
            "werm": "warm",
            "dróg": "droog"
        }
    },
    "venloos": {
        "name": "Venloos",
        "style_prompt": (
            "Venloos dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
            "Ik mótte gans gauw nao Venlo toe want de Maas is ouch sjoen vandaag.\n"
            "Mich en dich höbbe gister inne sjtad geloupe en dao waas het drök.\n"
            "De kènk zeen hiej veur de kirk en sjpele ouch aan de sjtroat."
        ),
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
        "translation_key": "Venlose kern: mich=mij, dich=jou, waas=was, mótte=moeten, ouch=ook, gans=heel.",
        "few_shot_examples": [
            {
                "input": "Ik mótte gans gauw nao Venlo toe want de Maas is ouch sjoen vandaag.",
                "output": {
                    "original": "Ik mótte gans gauw nao Venlo toe want de Maas is ouch sjoen vandaag.",
                    "corrected": "Ik moet heel gauw naar Venlo toe want de Maas is ook mooi vandaag."
                }
            },
            {
                "input": "Mich en dich höbbe gister inne sjtad geloupe en dao waas het drök.",
                "output": {
                    "original": "Mich en dich höbbe gister inne sjtad geloupe en dao waas het drök.",
                    "corrected": "Mij en jou hebben gisteren in de stad gelopen en daar was het druk.",
                    "applied_rules": ["mich=mij", "dich=jou", "höbbe=hebben", "inne=in de", "sjtad=stad", "geloupe=gelopen", "dao=daar", "waas=was"]
                }
            },
            {
                "input": "De kènk zeen hiej veur de kirk en sjpele ouch aan de sjtroat.",
                "output": {
                    "original": "De kènk zeen hiej veur de kirk en sjpele ouch aan de sjtroat.",
                    "corrected": "De kinderen zijn hier voor de kerk en spelen ook aan de straat."
                }
            }
        ],
        "glossary": {
            # From custom_spelling (18 entries)
            "mich": "mij",
            "dich": "jou",
            "waas": "was",
            "mótte": "moeten",
            "ouch": "ook",
            "gans": "heel",
            "höbbe": "hebben",
            "kómme": "komen",
            "neet": "niet",
            "hoes": "huis",
            "kirk": "kerk",
            "nao": "naar",
            "hiej": "hier",
            "hub": "heb",
            "gaon": "gaan",
            "sjtroat": "straat",
            "loupe": "lopen",
            "veur": "voor",
            # Additional Venlo-specific words (35+ more)
            "sjoen": "mooi",
            "gister": "gisteren",
            "inne": "in de",
            "sjtad": "stad",
            "geloupe": "gelopen",
            "dao": "daar",
            "drök": "druk",
            "kènk": "kinderen",
            "zeen": "zijn",
            "sjpele": "spelen",
            "woor": "was",
            "oet": "uit",
            "efkes": "even",
            "sjool": "school",
            "maat": "markt",
            "aovend": "avond",
            "mörge": "morgen",
            "good": "goed",
            "groeët": "groot",
            "kling": "klein",
            "sjtil": "stil",
            "flot": "vlot",
            "heem": "hem",
            "mie": "mij",
            "die": "jou",
            "us": "ons",
            "dees": "deze",
            "boe": "hoe",
            "waat": "wat",
            "woe": "waar",
            "wuruum": "waarom",
            "dök": "vaak",
            "nöit": "nooit",
            "altiëd": "altijd",
            "oppe": "op het",
            "mèt": "met",
            "zónger": "zonder",
            "höb": "heb",
            "sjun": "mooi",
            "vaan": "van",
            "gegange": "gegaan",
            "versjtaon": "verstaan",
            "kalle": "praten",
            # Voorzetsels/voegwoorden
            "tösje": "tussen",
            "durch": "door",
            "toege": "toch",
            "bove": "boven",
            "ónger": "onder",
            # Bijwoorden van tijd
            "noe": "nu",
            "dökser": "vaker",
            "daonoets": "daarna",
            "ieësjt": "eerst",
            "nag": "nog",
            "altied": "altijd",
            # Werkwoord-vervoegingen
            "höbs": "heb je",
            "höbt": "hebt",
            "woors": "was je",
            "kömp": "komt",
            "giëng": "ging",
            "koam": "kwam",
            "zouw": "zou",
            "kós": "kon",
            "mós": "moest",
            "wool": "wilde",
            "hät": "heeft",
            # Samenstellingen
            "gisteraovend": "gisteravond",
            "vanoavend": "vanavond",
            "vanmörge": "vanmorgen",
            "overmaore": "overmorgen",
            # Emotionele/informele taal
            "auw": "au",
            "jao": "ja",
            "alleh": "vooruit",
            "asjemenou": "hemeltjelief",
            # Telwoorden
            "ein": "een",
            "twei": "twee",
            "veer": "vier",
            "vief": "vijf",
            "zeve": "zeven",
            "ach": "acht",
            "nege": "negen",
            # Fonetische varianten
            "noar": "naar",
            # Body/daily life
            "oge": "ogen",
            "oore": "oren",
            "kop": "hoofd",
            "henj": "hand",
            "hank": "handen",
            "voot": "voet",
            "veut": "voeten",
            "ete": "eten",
            "drinke": "drinken",
            "sjlope": "slapen",
            "wasche": "wassen",
            # Family/social
            "kèndj": "kind",
            "mooder": "moeder",
            "broor": "broer",
            "zöster": "zuster",
            "naoberj": "buurman",
            "vrundin": "vriendin",
            # Weather/nature
            "reëge": "regen",
            "wink": "wind",
            "zón": "zon",
            "wólke": "wolken",
            "kouw": "koud",
            "werm": "warm",
            "dróg": "droog"
        }
    },
    "kirchroeadsj": {
        "name": "Kirchröadsj",
        "style_prompt": (
            "Kirchröadsj dialect transcriptie. Behoud dialectwoorden letterlijk, vertaal NIET naar Nederlands.\n"
            "Iech han mure d'r wasser uvver inne tsimmer gegosse want het woor zo hoeëg.\n"
            "De jonge en d'r meëdsje hant inne kirchof gesjpeelt mit plat sjpas.\n"
            "Ós junt mure nao Kirchröa toe en koame dan wier trök."
        ),
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
        "translation_key": "Kirchröadsje kern: iech=ik, han=heb, hant=hebben, d'r=de/het, junt=gaan, koame=komen, mure=morgen.",
        "few_shot_examples": [
            {
                "input": "Iech han mure d'r wasser uvver inne tsimmer gegosse want het woor zo hoeëg.",
                "output": {
                    "original": "Iech han mure d'r wasser uvver inne tsimmer gegosse want het woor zo hoeëg.",
                    "corrected": "Ik heb morgen het water over in de kamer gegoten want het was zo hoog.",
                    "applied_rules": ["iech=ik", "han=heb", "mure=morgen", "d'r=het", "wasser=water", "uvver=over", "inne=in de", "tsimmer=kamer", "gegosse=gegoten", "woor=was", "hoeëg=hoog"]
                }
            },
            {
                "input": "De jonge en d'r meëdsje hant inne kirchof gesjpeelt mit plat sjpas.",
                "output": {
                    "original": "De jonge en d'r meëdsje hant inne kirchof gesjpeelt mit plat sjpas.",
                    "corrected": "De jongen en het meisje hebben in het kerkhof gespeeld met dialect pret."
                }
            },
            {
                "input": "Ós junt mure nao Kirchröa toe en koame dan wier trök.",
                "output": {
                    "original": "Ós junt mure nao Kirchröa toe en koame dan wier trök.",
                    "corrected": "Ons gaan morgen naar Kerkrade toe en komen dan weer terug."
                }
            },
            {
                "input": "D'r wisse neet wat iech zage uvver de deep sjtraos van Kirchröa.",
                "output": {
                    "original": "D'r wisse neet wat iech zage uvver de deep sjtraos van Kirchröa.",
                    "corrected": "Hij wist niet wat ik zeg over de diepe straat van Kerkrade."
                }
            }
        ],
        "glossary": {
            # From custom_spelling (22 entries)
            "iech": "ik",
            "miéch": "mij",
            "diéch": "jou",
            "d'r": "de",
            "hant": "hebben",
            "han": "heb",
            "junt": "gaan",
            "koame": "komen",
            "zage": "zeggen",
            "wisse": "weten",
            "mure": "morgen",
            "uvver": "over",
            "wasser": "water",
            "tsimmer": "kamer",
            "sjtraos": "straat",
            "jonge": "jongen",
            "meëdsje": "meisje",
            "hoeëg": "hoog",
            "ós": "ons",
            "sjpas": "pret",
            "neet": "niet",
            "plat": "dialect",
            # Additional Ripuarian and Kerkrade-specific words (40+ more)
            "gegosse": "gegoten",
            "woor": "was",
            "gesjpeelt": "gespeeld",
            "mit": "met",
            "nao": "naar",
            "Kirchröa": "Kerkrade",
            "wier": "weer",
            "trök": "terug",
            "inne": "in de",
            "kirchof": "kerkhof",
            "deep": "diep",
            "hiej": "hier",
            "höb": "heb",
            "hub": "heb",
            "gaon": "gaan",
            "kómme": "komen",
            "höbbe": "hebben",
            "zeen": "zijn",
            "sjtad": "stad",
            "hoes": "huis",
            "kirk": "kerk",
            "sjool": "school",
            "maat": "markt",
            "sjtroat": "straat",
            "kènk": "kind",
            "aovend": "avond",
            "good": "goed",
            "groeët": "groot",
            "kling": "klein",
            "sjtil": "stil",
            "flot": "vlot",
            "veur": "voor",
            "oet": "uit",
            "efkes": "even",
            "dao": "daar",
            "heem": "hem",
            "mörge": "morgen",
            "mie": "mij",
            "die": "jou",
            "us": "ons",
            "dees": "deze",
            "boe": "hoe",
            "waas": "was",
            "waat": "wat",
            "woe": "waar",
            "wuruum": "waarom",
            "sjoen": "mooi",
            "dök": "vaak",
            "nöit": "nooit",
            "altiëd": "altijd",
            "hät": "heeft",
            "vaan": "van",
            "gegange": "gegaan",
            "versjtaon": "verstaan",
            "kalle": "praten",
            "loupe": "lopen",
            "sjpele": "spelen",
            # Voorzetsels/voegwoorden (strong German influence)
            "tösje": "tussen",
            "durch": "door",
            "weil": "want",
            "obwohl": "hoewel",
            "toege": "toch",
            "bove": "boven",
            "ónger": "onder",
            # Bijwoorden van tijd
            "noe": "nu",
            "dökser": "vaker",
            "daonoets": "daarna",
            "ieësjt": "eerst",
            "nag": "nog",
            # Werkwoord-vervoegingen
            "höbs": "heb je",
            "höbt": "hebt",
            "woors": "was je",
            "kömp": "komt",
            "giëng": "ging",
            "zouw": "zou",
            "kós": "kon",
            "mós": "moest",
            "wool": "wilde",
            # Samenstellingen
            "gisteraovend": "gisteravond",
            "vanoavend": "vanavond",
            "vanmörge": "vanmorgen",
            "overmaore": "overmorgen",
            # Emotionele/informele taal
            "auw": "au",
            "jao": "ja",
            "alleh": "vooruit",
            "asjemenou": "hemeltjelief",
            # Telwoorden
            "ein": "een",
            "twei": "twee",
            "veer": "vier",
            "vief": "vijf",
            "zeve": "zeven",
            "ach": "acht",
            "nege": "negen",
            # Fonetische varianten
            "noar": "naar",
            "sjun": "mooi",
            # Body/daily life
            "oge": "ogen",
            "oore": "oren",
            "kop": "hoofd",
            "henj": "hand",
            "hank": "handen",
            "voot": "voet",
            "veut": "voeten",
            "ete": "eten",
            "drinke": "drinken",
            "sjlope": "slapen",
            "wasche": "wassen",
            # Family/social
            "kèndj": "kind",
            "mooder": "moeder",
            "broor": "broer",
            "zöster": "zuster",
            "naoberj": "buurman",
            "vrundin": "vriendin",
            # Weather/nature
            "reëge": "regen",
            "wink": "wind",
            "zón": "zon",
            "wólke": "wolken",
            "kouw": "koud",
            "werm": "warm",
            "dróg": "droog"
        }
    }
}

def get_dialect_config(region_key: str):
    """Retrieve the configuration for a specific regional dialect."""
    profile = REGIONAL_PROFILES.get(region_key, REGIONAL_PROFILES["limburgs"])
    
    # Merge with generic if keys are missing (though they are all present above for now)
    return {
        "initial_prompt": profile["style_prompt"],
        "word_boost": profile.get("word_boost", DIALECT_WORD_BOOST),
        "custom_spelling": profile.get("custom_spelling", DIALECT_CUSTOM_SPELLING),
        "translation_key": profile.get("translation_key", DIALECT_TRANSLATION_KEY)
    }
