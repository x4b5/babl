Fase 0 — Technische audit (eerst dit, dan de rest)Fase 0 — Technische audit (eerst dit, dan de rest)
0.1 Codebase-audit

Voer een volledige audit uit van de huidige codebase. Breng in kaart: technische schuld, inconsistenties tussen frontend en backend, dode code, ongebruikte imports, en afwijkingen van de CLAUDE.md-regels. Geef een geprioriteerde lijst van problemen vóór er iets nieuws wordt gebouwd.

0.2 Zwakheden inventariseren

Documenteer eerlijk de bekende beperkingen van BABL: hoe goed herkent Whisper Limburgs dialect werkelijk? Wat gaat er mis bij ruis, accenten, snel spreken? Wat zijn de grenzen van de polijststap? Dit vormt de feitelijke basis voor alle transparantie-uitspraken in latere fasen.

Fase 1 — Terminologie & naamgeving (geen afhankelijkheden)
1.1 Corrigeren → Polijsten

Wijzig "corrigeren" naar "polijsten" consequent door de hele app: UI-labels, API-routes (/correct → /polish), variabelenamen, documentatie en CLAUDE.md.

1.2 "Op dit apparaat" → "Op de computer"

Vervang alle varianten van "op dit apparaat" door "op de computer" in de UI en documentatie. Voeg toe: een expliciete waarschuwing dat lokale modus minimaal 8 GB RAM vereist en niet werkt op mobiel.

Fase 2 — Eerlijkheid & transparantie in tekst (bouwt op fase 0.2)
2.1 Bescheiden taalgebruik

Herschrijf marketingtaal naar feitelijke beschrijvingen. Wijzig de tagline naar: "BABL doet zijn best om Limburgs gesproken tekst om te zetten naar Nederlands geschreven tekst." Verwijder alle uitspraken die niet feitelijk onderbouwd zijn. Benoem expliciet wat BABL niet goed kan.

2.2 EU-motivatie onderbouwen

Voeg op de about-pagina en in de modus-toggles een beknopte uitleg toe: waarom EU-servers? Twee redenen: (1) AVG/GDPR-regulering geldt hier volledig, (2) de Amerikaanse CLOUD Act geeft de Amerikaanse overheid toegang tot data bij Amerikaanse aanbieders, ook als die data in Europa staat. Voeg toe: "Als de data de deur verlaat, blijft het in de EU."

2.3 Bewijsvoering bij uitspraken

Voeg bij technische en juridische uitspraken concrete onderbouwing toe: verwijs naar coderegels, commitberichten uit LOGBOOK.md, of externe bronnen (AssemblyAI DPA-link, Mistral privacy-pagina). Geen uitspraak zonder grond.

Fase 3 — Juridische documenten (bouwt op fase 2)
3.1 Verwerkingsovereenkomst downloadbaar

Voeg een downloadknop toe voor de volledige verwerkingsovereenkomst als PDF op de /dpa-pagina. Genereer de PDF server-side of bied het Markdown-bestand aan als download.

3.2 Begrippen in voorwaarden uitleggen

Leg in de voorwaarden uit wat bedoeld wordt met:

"as is": software zonder garanties geleverd
ToS: Terms of Service, de gebruiksvoorwaarden van AssemblyAI en Mistral
opt-in: expliciete toestemming vereist, niet standaard aan

Leg ook uit wie in de context van BABL de verwerkingsverantwoordelijke, verwerker, subverwerker en eindgebruiker is.

3.3 SOC 2 Type II uitleggen

Voeg bij punt 6 van de privacyverklaring een uitleg toe van SOC 2 Type II: een onafhankelijke audit die aantoont dat een dienst veilig, beschikbaar en vertrouwelijk opereert. Controleer of AssemblyAI en Mistral ook ISO 27001 of ISO 27018 certificering hebben en vermeld dit indien van toepassing.

3.4 Risicoklasse EU AI Act onderbouwen

Leg uit waarom BABL valt onder de categorie "beperkt risico": geen geautomatiseerde besluitvorming over personen, geen inzet in kritieke infrastructuur, geen hoogrisico-toepassing zoals bedoeld in artikel 6 en bijlage III van de verordening.

3.5 Verwerkingsregister

Leg uit wat een verwerkingsregister is en of het voor BABL verplicht is. De drempel: organisaties met structurele verwerking van gevoelige data of meer dan 250 medewerkers. Geef een minimaal sjabloon voor wie dit wél nodig heeft.

3.6 Geheimhoudingsverklaring medewerkers

Beoordeel of een format nodig is voor een geheimhoudingsverklaring voor beheerders of medewerkers die toegang hebben tot de BABL-infrastructuur. Maak een minimaal sjabloon.

Fase 4 — Begrippenlijst & uitleg in de app (bouwt op fase 2 en 3)
4.1 Begrippenlijst aanmaken

Maak een pagina /begrippen met definities van alle vakjargon dat in de app voorkomt: AVG, GDPR, CLOUD Act, SOC 2 Type II, ISO 27001, subverwerker, PII, SSE, IndexedDB, WER, CER, LoRA, API, opt-in, verwerkingsovereenkomst. Koppel elk begrip in de app als interne link naar deze pagina.

4.2 IndexedDB uitleggen

Leg op de about-pagina uit wat IndexedDB is: een browsergebaseerde database die opnames tijdelijk lokaal opslaat zodat ze niet verloren gaan bij een paginawissel, maar wél verdwijnen als je de browserdata wist of een privévenster sluit. Benoem expliciet dat dit géén permanente opslag is.

4.3 Sessiebehoud eerlijk beschrijven

Documenteer en verklaar: opnames bestaan uitsluitend in de huidige browsersessie via IndexedDB. Er is geen server-side opslag. Een vorige sessie ophalen is niet mogelijk als de browserdata gewist is. Wees hier volledig transparant over.

4.4 Ollama uitleggen

Leg uit waarom Ollama nodig is: het is de lokale runtime die LLM-modellen op de eigen computer draait, vergelijkbaar met een eigen mini-server voor taalmodellen. Zonder Ollama is er geen lokale polijststap. Voeg toe: Ollama is optioneel — zonder Ollama werkt de API-modus gewoon.

Fase 5 — Mobiele UX & responsiviteit
5.1 Mobiel: alleen API-modus

Detecteer op mobiele apparaten (via user-agent of schermgrootte) en verberg de lokale modus volledig. Lokale Whisper en Ollama werken niet op mobiel. Toon alleen AssemblyAI en Mistral. Voeg een korte uitleg toe waarom.

5.2 Responsiviteit doorvoeren

Controleer en verbeter de responsiviteit van alle schermen op kleine viewports: transcriptiepagina, modus-toggles, about, privacy, voorwaarden, begrippen en FAQ. Test op 375px breedte als minimum.

Fase 6 — Modellen uitbreiden (bouwt op fase 0.1)
6.1 Beste polijstmodellen onderzoeken

Onderzoek welke open-source LLM's momenteel het beste presteren op Nederlandse samenvattings- en verslagtaken. Evalueer op kwaliteit, RAM-gebruik en beschikbaarheid via Ollama. Voeg de 5 beste toe als keuze in de lokale modus, met een duidelijk RAM-label per model. Zorg voor spreiding: van licht (~2-4 GB) tot zwaar (~12-16 GB). Kandidaten: Qwen3-varianten, Mistral-7B, Llama 3.2, Phi-4.

Fase 7 — FAQ (bouwt op fasen 2, 4 en 5)
7.1 FAQ-pagina aanmaken

Maak een /faq-pagina met antwoorden op de meest voorkomende vragen. Baseer de vragen op de uitleg die al geschreven is in eerdere fasen. Minimale set:

Waarom werkt mijn microfoon niet?
Wat gebeurt er met mijn opname na verwerking?
Werkt BABL op mijn telefoon?
Hoe goed herkent BABL Limburgs dialect?
Hoe verwijder ik mijn data?
Wat kost het gebruik?
Kan ik BABL gebruiken voor vertrouwelijke gesprekken?

Fase 8 — Opschaling (bouwt op alles)
8.1 Analyse opschaling

Maak een eerlijke analyse van wat nodig is om BABL op te schalen van hobbyproject naar een app die door veel gebruikers gebruikt kan worden. Onderdelen: authenticatie en gebruikersbeheer, rate limiting en kosten per verzoek, monitoring en foutregistratie, SLA en support, GDPR-compliance op schaal, CI/CD robuustheid, ops-kosten inschatting. Wees realistisch over wat dit vraagt qua tijd en geld.

Fase 9 — Geautomatiseerd onderhoud (toekomstgericht, bouwt op fase 0)
9.1 Terugkerende taken inventariseren

Inventariseer eerst welke terugkerende onderhoudstaken jou als solo-developer nu de meeste tijd kosten: dependency-updates? Debuggen? Refactoring na nieuwe features? Dit bepaalt welke automatisering zinvol is.

9.2 Gerichte Claude Code agents definiëren

Definieer op basis van 9.1 maximaal drie gespecialiseerde agents met elk een eigen CLAUDE.md-contract en duidelijk afgebakende scope. Mogelijke kandidaten:

Update-agent: controleert wekelijks op dependency-updates en maakt een PR
Audit-agent: controleert periodiek of code nog voldoet aan CLAUDE.md-regels
Debug-agent: analyseert foutlogs en stelt een fix voor

Definieer expliciet wat elke agent niet mag doen om conflicten te voorkomen.
