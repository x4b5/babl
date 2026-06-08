# AI-systeem technisch dossier — BABL

> Op grond van EU AI Act artikelen 11 en 53 (transparantieverplichtingen).
> Dit dossier documenteert het AI-systeem en de gebruikte modellen.

**Versie:** 1.0
**Datum:** [DATUM]
**Volgende review:** [DATUM + 12 maanden]

---

## 1. Systeembeschrijving

### 1.1 Beoogd doel

BABL is een spraak-naar-tekst applicatie die:

1. Audio opneemt via de microfoon of bestandsupload
2. Spraak transcribeert naar tekst (AI-stap 1)
3. Limburgs dialect polijst naar standaard Nederlands (AI-stap 2)

### 1.2 Doelgroep

- Professionals in Limburg die vergaderingen en gesprekken willen documenteren
- Gebruikers die dialectgesprekken willen omzetten naar leesbaar Nederlands

### 1.3 Niet-beoogd gebruik

- Medische diagnostiek of klinische besluitvorming
- Juridisch bewijs zonder menselijke verificatie
- Surveillance of monitoring van personen zonder toestemming
- Automatische besluitvorming zonder menselijke tussenkomst

---

## 2. Risicoklassificatie

### 2.1 Classificatie: Beperkt risico (Limited risk)

BABL valt onder de categorie **beperkt risico** (niet hoog-risico) op basis van:

- **Geen Annex III categorie**: Het systeem wordt niet gebruikt voor biometrische identificatie, onderwijs, werkgelegenheid, rechtshandhaving of andere hoog-risico domeinen
- **Geen autonome besluitvorming**: Alle AI-output wordt gepresenteerd aan de gebruiker voor review — er worden geen automatische beslissingen genomen
- **Transparantie**: Gebruikers worden geinformeerd dat de output AI-gegenereerd is

### 2.2 Toepasselijke verplichtingen

Op grond van artikel 50 (transparantieverplichtingen voor beperkt-risico systemen):

| Verplichting                            | Implementatie                  | Status          |
| --------------------------------------- | ------------------------------ | --------------- |
| Gebruiker informeren over AI-interactie | AI-gegenereerd label in UI     | Geimplementeerd |
| AI-output markeren                      | Badge + metadata in SSE stream | Geimplementeerd |
| Technische documentatie                 | Dit dossier                    | Gedocumenteerd  |

---

## 3. Gebruikte AI-modellen

### 3.1 Transcriptie

#### Lokale modus: mlx-whisper

| Veld         | Waarde                                             |
| ------------ | -------------------------------------------------- |
| Model        | Whisper large-v3 (mlx-geoptimaliseerd)             |
| Ontwikkelaar | OpenAI (model), Apple MLX (runtime)                |
| Type         | Automatic Speech Recognition (ASR)                 |
| Input        | Audio (16kHz mono WAV)                             |
| Output       | Tekst (transcriptie)                               |
| Taal         | Automatische detectie, primair Nederlands/Limburgs |
| Draait op    | Apple Silicon (lokaal, geen netwerkverkeer)        |

#### API-modus: AssemblyAI Universal-2

| Veld         | Waarde                                                       |
| ------------ | ------------------------------------------------------------ |
| Model        | Universal-2                                                  |
| Ontwikkelaar | AssemblyAI Inc.                                              |
| Type         | Automatic Speech Recognition (ASR)                           |
| Input        | Audio (diverse formaten)                                     |
| Output       | Tekst met word-level confidence scores + speaker diarization |
| Datacenter   | Dublin, Ierland (EU)                                         |
| PII-redactie | Actief (namen, telefoon, e-mail, geboortedatum, medisch)     |

### 3.2 Polijsten (dialect naar standaard Nederlands)

#### Lokale modus: Ollama

| Veld          | Waarde                                                |
| ------------- | ----------------------------------------------------- |
| Model-familie | Qwen3 (standaard), ook: gemma3, mistral, phi4, llama3 |
| Modelgroottes | 1.7b (light), 4b (medium), 14b (heavy)                |
| Ontwikkelaar  | Diverse (open-source modellen)                        |
| Type          | Large Language Model (tekst-naar-tekst)               |
| Input         | Getranscribeerde tekst (mogelijk dialect)             |
| Output        | Gepolijste tekst in standaard Nederlands              |
| Draait op     | Lokale hardware via Ollama (geen netwerkverkeer)      |

#### API-modus: Mistral AI

| Veld         | Waarde                                        |
| ------------ | --------------------------------------------- |
| Model        | mistral-large-latest (altijd heavy kwaliteit) |
| Ontwikkelaar | Mistral AI                                    |
| Type         | Large Language Model (tekst-naar-tekst)       |
| Input        | Getranscribeerde tekst (mogelijk dialect)     |
| Output       | Gepolijste tekst in standaard Nederlands      |
| Datacenter   | Parijs, Frankrijk (EU)                        |

---

## 4. Inputdata en outputdata

### 4.1 Inputdata

| Type                   | Bron                         | Opslag                                                   |
| ---------------------- | ---------------------------- | -------------------------------------------------------- |
| Audio                  | Microfoon of bestandsupload  | Tijdelijk (browser + eventueel IndexedDB, max 3 opnames) |
| Getranscribeerde tekst | Output van transcriptiemodel | Alleen in browsersessie                                  |

### 4.2 Outputdata

| Type                      | Bestemming                           | Opslag                  |
| ------------------------- | ------------------------------------ | ----------------------- |
| Ruwe transcriptie         | Browser (UI)                         | Alleen in browsersessie |
| Gepolijste tekst          | Browser (UI)                         | Alleen in browsersessie |
| Download (Word/PDF/Tekst) | Lokaal bestand op apparaat gebruiker | Gebruiker beheert       |

### 4.3 AI-labeling van output

Alle AI-gegenereerde output wordt gelabeld:

- **Visueel**: Badge "AI-gegenereerd" met provider en model in de UI
- **Machine-leesbaar**: `ai_metadata` object in SSE stream met `generated_by_ai`, `provider`, `model`, `prompt_version`
- **Bij export**: Tekst wordt gemarkeerd als AI-gegenereerd

---

## 5. Menselijke controle

| Aspect                           | Implementatie                                              |
| -------------------------------- | ---------------------------------------------------------- |
| Gebruiker initieert verwerking   | Opname, transcriptie en polijsten worden handmatig gestart |
| Review voor gebruik              | Gebruiker ziet ruwe en gepolijste tekst en kan vergelijken |
| Geen automatische besluitvorming | Output wordt gepresenteerd, niet automatisch verwerkt      |
| Correctiemogelijkheid            | Gebruiker kan tekst kopiëren en handmatig aanpassen        |
| Modusselectie                    | Gebruiker kiest bewust tussen lokale en API-verwerking     |
| Consent                          | Expliciete toestemming vereist voor API-modus              |

---

## 6. Prestatiemetrieken

### 6.1 Beschikbare metrieken

| Metriek                    | Beschrijving                                  | Doel                           |
| -------------------------- | --------------------------------------------- | ------------------------------ |
| WER (Word Error Rate)      | Percentage foutieve woorden t.o.v. referentie | Transcriptiekwaliteit          |
| CER (Character Error Rate) | Percentage foutieve tekens t.o.v. referentie  | Fijnmazige kwaliteitsmeting    |
| Confidence scores          | Per-woord zekerheid van het transcriptiemodel | Identificatie onzekere woorden |

### 6.2 Evaluatiemethode

- Gebruiker kan handmatig correcties aanbrengen
- Systeem berekent WER/CER op basis van correcties
- Evaluatieresultaten worden anoniem gelogd (sessie-ID, metrics, geen inhoud)
- Lage-zekerheid woorden worden gemarkeerd voor review

---

## 7. Beperkingen en bekende risico's

| Beperking         | Toelichting                                            | Mitigatie                                      |
| ----------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Dialectherkenning | Niet alle Limburgse varianten worden even goed herkend | Glossary en few-shot voorbeelden per regio     |
| Achtergrondgeluid | Transcriptiekwaliteit daalt bij lawaai                 | Gebruikersinstructies + confidence scores      |
| Meerdere sprekers | Spreker-toewijzing is niet altijd accuraat             | Speaker diarization + handmatige labels        |
| Hallucinatie      | LLM kan tekst genereren die niet in de bron staat      | Gebruiker vergelijkt ruwe met gepolijste tekst |
| Bias              | Modellen kunnen bias vertonen in taalgebruik           | Gebruiker valideert alle output                |

---

## 8. Wijzigingslogboek

| Datum   | Versie | Wijziging       | Door   |
| ------- | ------ | --------------- | ------ |
| [DATUM] | 1.0    | Initiele versie | [NAAM] |
