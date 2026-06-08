# Data Protection Impact Assessment (DPIA) — BABL

> Op grond van artikel 35 AVG. Deze beoordeling analyseert de privacyrisico's
> van de verwerkingsactiviteiten in BABL.

**Versie:** 1.0
**Datum:** [DATUM]
**Volgende review:** [DATUM + 12 maanden]

---

## 1. Beschrijving van de verwerking

### 1.1 Wat doet BABL?

BABL neemt audio op via de microfoon of bestandsupload, transcribeert spraak naar tekst en polijst Limburgs dialect naar standaard Nederlands. De gebruiker kiest per stap (transcriptie en polijsten) tussen lokale verwerking of API-verwerking.

### 1.2 Verwerkingsactiviteiten

| Activiteit   | Lokale modus                 | API-modus               |
| ------------ | ---------------------------- | ----------------------- |
| Audio-opname | Browser (Web Audio API)      | Browser (Web Audio API) |
| Transcriptie | mlx-whisper op Apple Silicon | AssemblyAI (EU Dublin)  |
| Polijsten    | Ollama + Qwen3 lokaal        | Mistral AI (EU Parijs)  |
| Analytics    | —                            | PostHog (EU endpoint)   |

### 1.3 Categorieeen persoonsgegevens

- Stemgeluid (audio-opname)
- Gesproken inhoud (kan PII bevatten: namen, adressen, medische info)
- Getranscribeerde tekst
- Gepolijste tekst
- Sessie-ID (random UUID, niet herleidbaar)

### 1.4 Categorieeen betrokkenen

- Gebruikers van de applicatie
- Sprekers in opnames (kunnen derden zijn)

---

## 2. Noodzaak en proportionaliteit

### 2.1 Doel

Het doel van BABL is het omzetten van Limburgs dialect naar leesbaar standaard Nederlands. Dit dient:

- Toegankelijkheid van dialectgesprekken
- Documentatie van vergaderingen en gesprekken
- Behoud van cultureel erfgoed (dialect)

### 2.2 Grondslag

- **Toestemming** (art. 6 lid 1 sub a) voor audio-opname, transcriptie en polijsten
- **Gerechtvaardigd belang** (art. 6 lid 1 sub f) voor audit logging en analytics

### 2.3 Proportionaliteit

| Maatregel         | Toelichting                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| Dataminimalisatie | Alleen audio nodig voor transcriptie; wordt direct na verwerking verwijderd |
| Lokale modus      | Gebruiker kan kiezen voor volledige lokale verwerking zonder dataoverdracht |
| Geen accounts     | Geen gebruikersprofielen, geen login, geen persistente identificatie        |
| Sessie-gebonden   | Alle data is gekoppeld aan een sessie-UUID, niet aan een persoon            |
| EU-only API's     | Alle externe verwerkers gebruiken EU-datacenters                            |

---

## 3. Risicobeoordeling

### 3.1 Risicoschaal

| Score | Waarschijnlijkheid    | Impact      |
| ----- | --------------------- | ----------- |
| 1     | Zeer onwaarschijnlijk | Minimaal    |
| 2     | Onwaarschijnlijk      | Beperkt     |
| 3     | Mogelijk              | Aanzienlijk |
| 4     | Waarschijnlijk        | Ernstig     |

### 3.2 Geidentificeerde risico's

#### R1: Audio bevat gevoelige informatie

| Aspect             | Waarde                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Beschrijving       | Gebruikers nemen gesprekken op die medische, juridische of financiele informatie bevatten |
| Waarschijnlijkheid | 3 (Mogelijk)                                                                              |
| Impact             | 3 (Aanzienlijk)                                                                           |
| Risicoscore        | 9 (Hoog)                                                                                  |

**Maatregelen:**

- PII-redactie bij AssemblyAI (namen, telefoonnummers, e-mailadressen, geboortedata, medische termen)
- Lokale modus beschikbaar als alternatief (geen data naar buiten)
- Audio wordt direct na verwerking verwijderd
- Expliciete toestemming via consent modal voor API-modus

**Restrisico:** Laag — PII-redactie + lokale optie + auto-delete

#### R2: Datalek bij sub-verwerker

| Aspect             | Waarde                                          |
| ------------------ | ----------------------------------------------- |
| Beschrijving       | AssemblyAI of Mistral AI wordt gecompromitteerd |
| Waarschijnlijkheid | 1 (Zeer onwaarschijnlijk)                       |
| Impact             | 3 (Aanzienlijk)                                 |
| Risicoscore        | 3 (Laag)                                        |

**Maatregelen:**

- Beide verwerkers hebben SOC 2 Type II en ISO 27001 certificeringen
- Verwerkersovereenkomsten (DPA) afgesloten
- Data wordt niet persistent opgeslagen door verwerkers
- TLS 1.2+ voor alle communicatie

**Restrisico:** Zeer laag — geen persistente opslag bij verwerkers

#### R3: Ongeautoriseerde toegang tot audit logs

| Aspect             | Waarde                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| Beschrijving       | Audit logs bevatten sessie-IDs die gekoppeld kunnen worden aan activiteiten |
| Waarschijnlijkheid | 2 (Onwaarschijnlijk)                                                        |
| Impact             | 1 (Minimaal)                                                                |
| Risicoscore        | 2 (Zeer laag)                                                               |

**Maatregelen:**

- Audit logs bevatten geen PII
- Sessie-IDs zijn random UUIDs zonder koppeling aan gebruikersaccounts
- Logs worden na 90 dagen verwijderd
- Append-only JSONL bestanden

**Restrisico:** Verwaarloosbaar

#### R4: Browser-opslag van audio

| Aspect             | Waarde                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Beschrijving       | Audio wordt optioneel opgeslagen in IndexedDB en is toegankelijk voor scripts op hetzelfde domein |
| Waarschijnlijkheid | 2 (Onwaarschijnlijk)                                                                              |
| Impact             | 2 (Beperkt)                                                                                       |
| Risicoscore        | 4 (Laag)                                                                                          |

**Maatregelen:**

- Maximaal 3 opnames bewaard (oudste wordt automatisch verwijderd)
- Gebruiker kan opnames handmatig verwijderen via "Mijn data" panel
- Geen third-party scripts met toegang tot IndexedDB
- CSP headers beperken script-uitvoering

**Restrisico:** Laag

---

## 4. Overzicht maatregelen

| Maatregel                       | Type            | Status          |
| ------------------------------- | --------------- | --------------- |
| PII-redactie (AssemblyAI)       | Technisch       | Geimplementeerd |
| Lokale verwerkingsmodus         | Technisch       | Geimplementeerd |
| TLS 1.2+ encryptie              | Technisch       | Geimplementeerd |
| Auto-delete audio na verwerking | Technisch       | Geimplementeerd |
| Rate limiting (20 req/min)      | Technisch       | Geimplementeerd |
| Dagelijks budgetlimiet          | Technisch       | Geimplementeerd |
| Consent modal voor API-modus    | Organisatorisch | Geimplementeerd |
| Verwerkersovereenkomsten        | Organisatorisch | Afgesloten      |
| Privacy-pagina                  | Organisatorisch | Geimplementeerd |
| Audit logging                   | Technisch       | Geimplementeerd |
| Data wissen functie             | Technisch       | Geimplementeerd |
| AI-labeling (EU AI Act)         | Technisch       | Geimplementeerd |
| Incident response plan          | Organisatorisch | Gedocumenteerd  |

---

## 5. Conclusie

### 5.1 Is een volledige DPIA verplicht?

**Nee**, op basis van de volgende overwegingen:

- Geen systematische en uitgebreide beoordeling van persoonlijke aspecten (art. 35 lid 3a)
- Geen grootschalige verwerking van bijzondere categorieen (art. 35 lid 3b)
- Geen stelselmatige en grootschalige monitoring (art. 35 lid 3c)
- Audio wordt niet persistent opgeslagen; verwerking is tijdelijk en sessiegebonden
- Lokale modus beschikbaar als alternatief zonder dataoverdracht

### 5.2 Waarom toch dit document?

Dit document dient als voorlopige risicobeoordeling en onderbouwing waarom een volledige DPIA niet nodig is. Het toont aan dat de verwerkingsverantwoordelijke de risico's heeft overwogen en passende maatregelen heeft getroffen (accountability-beginsel, art. 5 lid 2).

### 5.3 Heroverweging nodig bij

- Toevoeging van gebruikersaccounts of profielen
- Persistente opslag van transcripties op een server
- Verwerking van medische of juridische gesprekken als primair doel
- Schaalvergroting (>1000 gebruikers/dag)

---

## 6. Wijzigingslogboek

| Datum   | Versie | Wijziging       | Door   |
| ------- | ------ | --------------- | ------ |
| [DATUM] | 1.0    | Initiele versie | [NAAM] |
