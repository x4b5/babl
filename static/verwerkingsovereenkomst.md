# Verwerkingsovereenkomst (Data Processing Agreement)

**BABL — Spraak-naar-tekst met Limburgse dialectcorrectie**

Versie: 1.0
Datum: [DATUM INVULLEN]

---

## Artikel 1 — Partijen

1. **Verwerkingsverantwoordelijke** (hierna: "Verantwoordelijke"):
   - Naam: [NAAM ORGANISATIE]
   - Adres: [ADRES]
   - KvK-nummer: [KVK]
   - Contactpersoon: [NAAM]
   - E-mail: [EMAIL]

2. **Verwerker** (hierna: "Verwerker"):
   - Naam: [NAAM VERWERKER / EXPLOITANT BABL]
   - Adres: [ADRES]
   - KvK-nummer: [KVK]
   - Contactpersoon: [NAAM]
   - E-mail: [EMAIL]

Gezamenlijk aangeduid als "Partijen".

---

## Artikel 2 — Definities

| Term                 | Betekenis                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **AVG**              | Algemene Verordening Gegevensbescherming (EU 2016/679)                                     |
| **Persoonsgegevens** | Alle informatie over een geidentificeerde of identificeerbare natuurlijke persoon          |
| **Verwerking**       | Elke bewerking van persoonsgegevens (verzamelen, opslaan, raadplegen, verstrekken, wissen) |
| **Betrokkene**       | De natuurlijke persoon op wie de persoonsgegevens betrekking hebben                        |
| **Subverwerker**     | Een derde partij die namens de Verwerker persoonsgegevens verwerkt                         |
| **Datalek**          | Een inbreuk op de beveiliging die leidt tot ongeoorloofde toegang tot persoonsgegevens     |
| **Lokale modus**     | Verwerkingsmodus waarbij alle data op het apparaat van de gebruiker blijft                 |
| **API-modus**        | Verwerkingsmodus waarbij data via externe API-diensten wordt verwerkt                      |

---

## Artikel 3 — Onderwerp en doel van de verwerking

3.1. De Verwerker verwerkt persoonsgegevens uitsluitend ten behoeve van de Verantwoordelijke voor het volgende doel:

> **Het omzetten van gesproken taal (spraakopnames) naar geschreven tekst, met correctie van Limburgs dialect naar standaard Nederlands.**

3.2. De verwerking omvat twee stappen:

1.  **Transcriptie** — spraakopname omzetten naar ruwe tekst
2.  **Correctie** — ruwe tekst corrigeren van dialect naar standaard Nederlands

3.3. De grondslag voor verwerking is: **toestemming van de betrokkene** (artikel 6 lid 1 sub a AVG) of **gerechtvaardigd belang** (artikel 6 lid 1 sub f AVG), zoals bepaald door de Verantwoordelijke.

---

## Artikel 4 — Categorieeen persoonsgegevens

4.1. De volgende categorieeen persoonsgegevens kunnen worden verwerkt:

| Categorie                  | Beschrijving                              | Bewaartermijn                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------ |
| Spraakopnames (audio)      | Opgenomen via microfoon of bestandsupload | Alleen tijdens verwerking, niet opgeslagen |
| Transcripties (ruwe tekst) | Resultaat van spraak-naar-tekst           | Sessieduur, niet persistent opgeslagen     |
| Gecorrigeerde tekst        | Resultaat van dialectcorrectie            | Sessieduur, niet persistent opgeslagen     |

4.2. **PII-redactie**: Bij gebruik van API-modus (AssemblyAI) wordt automatische PII-redactie toegepast op de transcriptie. Gevoelige informatie zoals namen, adressen en telefoonnummers wordt automatisch geanonimiseerd voordat verdere verwerking plaatsvindt.

4.3. **Bijzondere persoonsgegevens**: BABL is niet bedoeld voor de verwerking van bijzondere categorieeen persoonsgegevens (artikel 9 AVG). De Verantwoordelijke is verantwoordelijk voor het voorkomen van dergelijke verwerking.

---

## Artikel 5 — Verwerkingsmodi en datalocatie

### 5.1 Lokale modus

| Stap         | Technologie            | Datalocatie            |
| ------------ | ---------------------- | ---------------------- |
| Transcriptie | mlx-whisper (large-v3) | Apparaat van gebruiker |
| Correctie    | Ollama / Gemma3        | Apparaat van gebruiker |

Bij lokale modus verlaat **geen enkele data** het apparaat van de gebruiker. Er is geen sprake van doorgifte aan derden.

### 5.2 API-modus

| Stap         | Dienst     | Datalocatie            | DPA beschikbaar         |
| ------------ | ---------- | ---------------------- | ----------------------- |
| Transcriptie | AssemblyAI | EU — Dublin, Ierland   | Ja, automatisch via ToS |
| Correctie    | Mistral AI | EU — Parijs, Frankrijk | Ja, automatisch via ToS |

Bij API-modus wordt data **uitsluitend verwerkt binnen de EU**. Zie artikel 7 voor subverwerkers.

### 5.3 Keuze van de gebruiker

De gebruiker kiest zelf per stap (transcriptie en correctie) welke modus wordt gebruikt. De applicatie toont duidelijk welke modus actief is.

---

## Artikel 6 — Verplichtingen van de Verwerker

De Verwerker verbindt zich tot het volgende:

6.1. Persoonsgegevens **uitsluitend verwerken** op basis van schriftelijke instructies van de Verantwoordelijke.

6.2. **Geen persoonsgegevens opslaan** na afloop van de verwerkingssessie, tenzij wettelijk verplicht.

6.3. **Geheimhouding** waarborgen — alle personen die toegang hebben tot persoonsgegevens zijn gebonden aan geheimhouding.

6.4. **Passende technische en organisatorische maatregelen** treffen (zie artikel 8).

6.5. De Verantwoordelijke **onmiddellijk informeren** bij een vermoedelijk datalek (zie artikel 10).

6.6. **Geen persoonsgegevens** gebruiken voor eigen doeleinden, waaronder het trainen van AI-modellen.

6.7. Na beeindiging van de overeenkomst alle persoonsgegevens **wissen of retourneren**, naar keuze van de Verantwoordelijke.

---

## Artikel 7 — Subverwerkers

7.1. De Verantwoordelijke geeft toestemming voor het inschakelen van de volgende subverwerkers, uitsluitend in API-modus:

### 7.1.1 AssemblyAI

| Veld                   | Waarde                                                    |
| ---------------------- | --------------------------------------------------------- |
| **Bedrijf**            | AssemblyAI, Inc.                                          |
| **Doel**               | Spraak-naar-tekst transcriptie                            |
| **Datalocatie**        | EU — Dublin, Ierland                                      |
| **DPA**                | Automatisch via Terms of Service                          |
| **DPA-link**           | https://www.assemblyai.com/legal/data-processing-addendum |
| **Data voor training** | Nee — data wordt niet gebruikt voor modeltraining         |
| **PII-redactie**       | Ja, ingebouwde automatische redactie ingeschakeld         |
| **Bewaartermijn**      | Geen opslag na verwerking                                 |

### 7.1.2 Mistral AI

| Veld                   | Waarde                                                      |
| ---------------------- | ----------------------------------------------------------- |
| **Bedrijf**            | Mistral AI, SAS                                             |
| **Doel**               | Dialectcorrectie (tekst-naar-tekst)                         |
| **Datalocatie**        | EU — Parijs, Frankrijk                                      |
| **DPA**                | Automatisch via Terms of Service                            |
| **DPA-link**           | https://legal.mistral.ai/terms/data-processing-addendum     |
| **Data voor training** | Nee — standaard geen training op API-input (opt-in vereist) |
| **Bewaartermijn**      | Max 30 dagen voor abuse monitoring, daarna verwijderd       |

7.2. De Verwerker informeert de Verantwoordelijke **vooraf** over wijzigingen in subverwerkers. De Verantwoordelijke heeft het recht bezwaar te maken.

7.3. De Verwerker sluit met elke subverwerker een overeenkomst die **minimaal dezelfde verplichtingen** bevat als deze verwerkingsovereenkomst.

---

## Artikel 8 — Beveiligingsmaatregelen

De Verwerker treft de volgende maatregelen ter bescherming van persoonsgegevens:

### Technisch

- [ ] **Encryptie in transit**: Alle communicatie via HTTPS/TLS 1.2+
- [ ] **Geen persistente opslag**: Audio en transcripties worden niet opgeslagen na de sessie
- [ ] **PII-redactie**: Automatische redactie via AssemblyAI in API-modus
- [ ] **Lokale verwerking**: Optie om alle verwerking op het apparaat te houden
- [ ] **Geen logging van inhoud**: Transcriptie-inhoud wordt nooit gelogd
- [ ] **API-sleutels beveiligd**: Credentials opgeslagen als environment variables, nooit in broncode

### Organisatorisch

- [ ] **Toegangsbeperking**: Alleen geautoriseerd personeel heeft toegang tot systemen
- [ ] **Geheimhoudingsverklaring**: Alle medewerkers zijn gebonden aan geheimhouding
- [ ] **Bewustwordingstraining**: Personeel is getraind in privacybescherming
- [ ] **Incidentprocedure**: Procedure voor het melden en afhandelen van datalekken

---

## Artikel 9 — Rechten van betrokkenen

9.1. De Verwerker helpt de Verantwoordelijke bij het nakomen van verzoeken van betrokkenen, waaronder:

| Recht             | Artikel AVG | Toelichting                                                     |
| ----------------- | ----------- | --------------------------------------------------------------- |
| Inzage            | Art. 15     | Betrokkene mag opvragen welke gegevens verwerkt worden          |
| Rectificatie      | Art. 16     | Betrokkene mag onjuiste gegevens laten corrigeren               |
| Wissing           | Art. 17     | Betrokkene mag verwijdering verzoeken ("recht op vergetelheid") |
| Beperking         | Art. 18     | Betrokkene mag verwerking laten beperken                        |
| Overdraagbaarheid | Art. 20     | Betrokkene mag gegevens in machine-leesbaar formaat ontvangen   |
| Bezwaar           | Art. 21     | Betrokkene mag bezwaar maken tegen verwerking                   |

9.2. Omdat BABL **geen persoonsgegevens persistent opslaat**, zijn de meeste rechten in de praktijk automatisch geborgd: er is na de sessie niets meer om in te zien, te corrigeren of te verwijderen.

9.3. De Verwerker meldt verzoeken van betrokkenen **binnen 48 uur** aan de Verantwoordelijke.

---

## Artikel 10 — Datalekken

10.1. De Verwerker meldt een (vermoedelijk) datalek **zonder onredelijke vertraging** en uiterlijk **binnen 24 uur** na ontdekking aan de Verantwoordelijke.

10.2. De melding bevat minimaal:

- Aard van het datalek
- Categorieeen en geschat aantal betrokkenen
- Waarschijnlijke gevolgen
- Genomen en voorgestelde maatregelen

  10.3. De Verantwoordelijke is verantwoordelijk voor melding aan de Autoriteit Persoonsgegevens (binnen 72 uur, art. 33 AVG) en eventueel aan betrokkenen (art. 34 AVG).

---

## Artikel 11 — Audits

11.1. De Verantwoordelijke heeft het recht om **audits** uit te (laten) voeren om naleving van deze overeenkomst te controleren.

11.2. De Verwerker verleent medewerking aan audits en stelt alle relevante informatie beschikbaar.

11.3. Audits worden aangekondigd met een redelijke termijn van minimaal **14 dagen**, tenzij er sprake is van een vermoedelijk datalek.

---

## Artikel 12 — Doorgifte buiten de EU

12.1. Persoonsgegevens worden **niet doorgegeven** buiten de Europese Economische Ruimte (EER).

12.2. Alle subverwerkers verwerken data uitsluitend binnen de EU:

- AssemblyAI: Dublin, Ierland
- Mistral AI: Parijs, Frankrijk
- Lokale modus: apparaat van de gebruiker

  12.3. Mocht doorgifte buiten de EER onvermijdelijk worden, dan treft de Verwerker passende waarborgen (art. 46 AVG), zoals Standard Contractual Clauses (SCC's).

---

## Artikel 13 — Duur en beeindiging

13.1. Deze overeenkomst treedt in werking op **[DATUM]** en geldt voor de duur van de samenwerking tussen Partijen.

13.2. Bij beeindiging van de overeenkomst zal de Verwerker:

- Alle persoonsgegevens **wissen** binnen **30 dagen**, of
- Alle persoonsgegevens **retourneren** aan de Verantwoordelijke, naar keuze van de Verantwoordelijke

  13.3. De Verwerker bevestigt schriftelijk dat alle persoonsgegevens zijn gewist.

---

## Artikel 14 — Aansprakelijkheid

14.1. De aansprakelijkheid van Partijen wordt beheerst door de hoofdovereenkomst tussen Partijen en het toepasselijke recht.

14.2. De Verwerker is aansprakelijk voor schade veroorzaakt door verwerking die in strijd is met deze overeenkomst of de AVG.

---

## Artikel 15 — Toepasselijk recht en geschillen

15.1. Op deze overeenkomst is **Nederlands recht** van toepassing.

15.2. Geschillen worden voorgelegd aan de bevoegde rechter te **[PLAATS]**.

---

## Artikel 16 — EU AI Act compliance

16.1. BABL maakt gebruik van AI-systemen voor spraakherkenning en tekstcorrectie. Onder de EU AI Act (Verordening 2024/1689) worden deze geclassificeerd als **beperkt risico** (limited risk).

16.2. De Verwerker voldoet aan de transparantieverplichtingen:

- Gebruikers worden geinformeerd dat AI wordt ingezet voor transcriptie en correctie
- De gebruikte modellen en hun herkomst worden vermeld
- De gebruiker heeft de keuze tussen lokale en API-verwerking

---

## Ondertekening

|                  | Verantwoordelijke              | Verwerker                      |
| ---------------- | ------------------------------ | ------------------------------ |
| **Naam**         | [NAAM]                         | [NAAM]                         |
| **Functie**      | [FUNCTIE]                      | [FUNCTIE]                      |
| **Datum**        | [DATUM]                        | [DATUM]                        |
| **Handtekening** | **\*\*\*\***\_\_\_**\*\*\*\*** | **\*\*\*\***\_\_\_**\*\*\*\*** |
