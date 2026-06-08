# Verwerkingsregister — BABL

> Vereist op grond van artikel 30 AVG. Dit register documenteert alle verwerkingsactiviteiten
> waarbij persoonsgegevens worden verwerkt.

**Versie:** 1.0
**Datum:** [DATUM]
**Volgende review:** [DATUM + 12 maanden]

---

## 1. Verwerkingsverantwoordelijke

| Veld                             | Waarde                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| Organisatie                      | [NAAM ORGANISATIE]                                                     |
| Adres                            | [ADRES]                                                                |
| KvK-nummer                       | [KVK NUMMER]                                                           |
| Contactpersoon                   | [NAAM CONTACTPERSOON]                                                  |
| E-mail                           | [CONTACT EMAIL]                                                        |
| Functionaris gegevensbescherming | Niet van toepassing (< 250 medewerkers, geen grootschalige verwerking) |

---

## 2. Verwerkingsactiviteiten

### 2.1 Audio-opname

| Veld                             | Waarde                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Doel**                         | Vastleggen van gesproken woord voor spraak-naar-tekst conversie                                                                                        |
| **Grondslag**                    | Toestemming (art. 6 lid 1 sub a AVG)                                                                                                                   |
| **Categorieen betrokkenen**      | Gebruikers van de applicatie, sprekers in opnames                                                                                                      |
| **Categorieen persoonsgegevens** | Stemgeluid, gesproken inhoud                                                                                                                           |
| **Bewaartermijn**                | Alleen tijdens de browsersessie. Wordt niet opgeslagen op een server. Optioneel lokaal opgeslagen in IndexedDB (browser) tot gebruiker het verwijdert. |
| **Ontvangers**                   | Geen (audio blijft op het apparaat van de gebruiker tot verwerking)                                                                                    |
| **Doorgifte buiten EU**          | Nee                                                                                                                                                    |
| **Beveiligingsmaatregelen**      | Verwerking in browser (Web Audio API). Audio wordt na transcriptie verwijderd van tijdelijke serveropslag.                                             |

### 2.2 Spraaktranscriptie — lokale modus

| Veld                             | Waarde                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Doel**                         | Omzetting van audio naar tekst via lokaal AI-model                                                                                                              |
| **Grondslag**                    | Toestemming (art. 6 lid 1 sub a AVG)                                                                                                                            |
| **Categorieen betrokkenen**      | Gebruikers, sprekers in opnames                                                                                                                                 |
| **Categorieen persoonsgegevens** | Stemgeluid (input), getranscribeerde tekst (output)                                                                                                             |
| **Bewaartermijn**                | Alleen tijdens de sessie. Audio wordt direct na verwerking verwijderd. Getranscribeerde tekst wordt alleen in de browser getoond, niet opgeslagen op de server. |
| **Verwerker**                    | Geen (verwerking vindt lokaal plaats op het apparaat)                                                                                                           |
| **Software**                     | mlx-whisper (large-v3) op Apple Silicon                                                                                                                         |
| **Doorgifte buiten EU**          | Nee (volledig lokaal)                                                                                                                                           |
| **Beveiligingsmaatregelen**      | Geen netwerkverkeer. Verwerking op lokale hardware.                                                                                                             |

### 2.3 Spraaktranscriptie — API-modus

| Veld                             | Waarde                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Doel**                         | Omzetting van audio naar tekst via externe AI-service                                                                      |
| **Grondslag**                    | Toestemming (art. 6 lid 1 sub a AVG) — expliciete consent via ApiConsentModal                                              |
| **Categorieen betrokkenen**      | Gebruikers, sprekers in opnames                                                                                            |
| **Categorieen persoonsgegevens** | Stemgeluid (input), getranscribeerde tekst (output)                                                                        |
| **Bewaartermijn**                | Audio wordt door AssemblyAI verwijderd na verwerking. Transcriptie alleen in browsersessie.                                |
| **Verwerker**                    | AssemblyAI Inc.                                                                                                            |
| **Verwerkersovereenkomst**       | Ja — zie AssemblyAI DPA                                                                                                    |
| **Datacenter**                   | Dublin, Ierland (EU)                                                                                                       |
| **PII-redactie**                 | Ja — namen, telefoonnummers, e-mailadressen, geboortedata, medische processen en condities worden automatisch geredacteerd |
| **Doorgifte buiten EU**          | Nee (EU datacenter Dublin)                                                                                                 |
| **Beveiligingsmaatregelen**      | TLS 1.2+ in transit. PII-redactie actief. Expliciete gebruikerstoestemming vereist.                                        |

### 2.4 Dialectpolijsten — lokale modus

| Veld                             | Waarde                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| **Doel**                         | Vertaling/polijsting van Limburgs dialect naar standaard Nederlands |
| **Grondslag**                    | Toestemming (art. 6 lid 1 sub a AVG)                                |
| **Categorieen persoonsgegevens** | Getranscribeerde tekst (input), gepolijste tekst (output)           |
| **Bewaartermijn**                | Alleen tijdens de sessie                                            |
| **Verwerker**                    | Geen (verwerking vindt lokaal plaats)                               |
| **Software**                     | Ollama + Gemma3 (4b/12b) op lokale hardware                         |
| **Doorgifte buiten EU**          | Nee (volledig lokaal)                                               |
| **Beveiligingsmaatregelen**      | Geen netwerkverkeer. Verwerking op lokale hardware.                 |

### 2.5 Dialectpolijsten — API-modus

| Veld                             | Waarde                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Doel**                         | Vertaling/polijsting van Limburgs dialect naar standaard Nederlands                                                        |
| **Grondslag**                    | Toestemming (art. 6 lid 1 sub a AVG) — expliciete consent via ApiConsentModal                                              |
| **Categorieen persoonsgegevens** | Getranscribeerde tekst (input), gepolijste tekst (output)                                                                  |
| **Bewaartermijn**                | Mistral bewaart data maximaal 30 dagen voor abuse monitoring, daarna verwijderd. Gepolijste tekst alleen in browsersessie. |
| **Verwerker**                    | Mistral AI (Parijs, Frankrijk)                                                                                             |
| **Verwerkersovereenkomst**       | Ja — zie Mistral AI DPA                                                                                                    |
| **Datacenter**                   | EU (Frankrijk)                                                                                                             |
| **Doorgifte buiten EU**          | Nee (EU servers)                                                                                                           |
| **Beveiligingsmaatregelen**      | TLS 1.2+ in transit. Expliciete gebruikerstoestemming vereist.                                                             |

### 2.6 Audit logging

| Veld                             | Waarde                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Doel**                         | Verantwoording en compliance-demonstratie (art. 5 lid 2 AVG)                                                         |
| **Grondslag**                    | Gerechtvaardigd belang (art. 6 lid 1 sub f AVG) — noodzakelijk voor compliance                                       |
| **Categorieen persoonsgegevens** | Sessie-ID (UUID, niet herleidbaar tot persoon), verwerkingsmodus, provider, successtatus. Geen inhoudelijke data.    |
| **Bewaartermijn**                | 90 dagen, daarna verwijderd                                                                                          |
| **Ontvangers**                   | Alleen interne beheerders                                                                                            |
| **Doorgifte buiten EU**          | Nee (lokale opslag)                                                                                                  |
| **Beveiligingsmaatregelen**      | Append-only JSONL bestanden. Geen PII in logs. Sessie-IDs zijn random UUIDs zonder koppeling aan gebruikersaccounts. |

### 2.7 Evaluatie en feedback

| Veld                             | Waarde                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- |
| **Doel**                         | Kwaliteitsverbetering van transcriptie en vertaling (WER/CER metrics)         |
| **Grondslag**                    | Gerechtvaardigd belang (art. 6 lid 1 sub f AVG)                               |
| **Categorieen persoonsgegevens** | Sessie-ID, kwaliteitsmetrics (WER, CER). Correcties bevatten tekstfragmenten. |
| **Bewaartermijn**                | 90 dagen                                                                      |
| **Ontvangers**                   | Alleen interne beheerders                                                     |
| **Doorgifte buiten EU**          | Nee                                                                           |
| **Beveiligingsmaatregelen**      | Lokale JSONL opslag. Metrics bevatten geen herleidbare PII.                   |

### 2.8 Webanalytics

| Veld                             | Waarde                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| **Doel**                         | Inzicht in gebruik van de applicatie                               |
| **Grondslag**                    | Gerechtvaardigd belang (art. 6 lid 1 sub f AVG)                    |
| **Categorieen persoonsgegevens** | Geen PII. `person_profiles: 'never'`. Alleen geaggregeerde events. |
| **Bewaartermijn**                | Conform PostHog retentiebeleid                                     |
| **Verwerker**                    | PostHog (EU endpoint: eu.posthog.com)                              |
| **Doorgifte buiten EU**          | Nee (EU endpoint)                                                  |
| **Beveiligingsmaatregelen**      | Geen persoonprofielen. Geen PII. Cookie consent vereist.           |

---

## 3. Overzicht verwerkers (subverwerkers)

| Verwerker       | Dienst                | Datacenter       | DPA | Contactgegevens        |
| --------------- | --------------------- | ---------------- | --- | ---------------------- |
| AssemblyAI Inc. | Spraaktranscriptie    | Dublin, IE (EU)  | Ja  | privacy@assemblyai.com |
| Mistral AI      | Tekstverwerking (LLM) | Parijs, FR (EU)  | Ja  | dpo@mistral.ai         |
| PostHog         | Webanalytics          | EU               | Ja  | privacy@posthog.com    |
| Vercel Inc.     | Frontend hosting      | Edge (EU region) | Ja  | privacy@vercel.com     |

---

## 4. Rechten van betrokkenen

| Recht                           | Implementatie                                                         |
| ------------------------------- | --------------------------------------------------------------------- |
| **Inzage** (art. 15)            | GET /audit/logs?session_id={id} — betrokkene kan audit trail opvragen |
| **Verwijdering** (art. 17)      | DELETE /audit/sessions/{id} — alle data voor een sessie wordt gewist  |
| **Beperking** (art. 18)         | Gebruiker kan kiezen voor lokale modus (geen data naar verwerkers)    |
| **Overdraagbaarheid** (art. 20) | Export-functie in de frontend (tekst kopiëren, audio downloaden)      |
| **Bezwaar** (art. 21)           | Contactformulier via [CONTACT EMAIL]                                  |

---

## 5. Beveiligingsmaatregelen (art. 32)

### Technisch

- [x] TLS 1.2+ voor alle API-communicatie
- [x] PII-redactie bij AssemblyAI transcriptie
- [x] Geen persistente opslag van audio of transcripties op de server
- [x] Sessie-IDs als random UUIDs (niet herleidbaar)
- [x] Rate limiting (20 requests/minuut per IP)
- [x] Dagelijks budgetlimiet (50 transcripties, 100 polijstverzoeken)
- [x] Tijdelijke bestanden worden direct na verwerking verwijderd
- [x] Atomaire bestandsoperaties voor audit logs

### Organisatorisch

- [ ] Toegangsbeperking tot productieomgeving
- [ ] Incidentresponsplan (zie /audit/breaches endpoint)
- [ ] Periodieke review van verwerkers en DPAs
- [ ] Training medewerkers gegevensbescherming

---

## 6. Data Protection Impact Assessment (DPIA)

Een DPIA is **niet verplicht** op basis van de volgende overwegingen:

- Geen systematische en uitgebreide beoordeling van persoonlijke aspecten (art. 35 lid 3a)
- Geen grootschalige verwerking van bijzondere categorieën (art. 35 lid 3b)
- Geen stelselmatige en grootschalige monitoring (art. 35 lid 3c)
- Audio wordt niet opgeslagen; verwerking is tijdelijk en sessiegebonden
- Lokale modus beschikbaar als alternatief zonder dataoverdracht

**Heroverweging nodig bij:**

- Toevoeging van gebruikersaccounts of profielen
- Persistente opslag van transcripties
- Verwerking van medische of juridische gesprekken als primair doel

---

## 7. Incidentregistratie

Beveiligingsincidenten worden geregistreerd via:

- `POST /audit/breaches` — incident vastleggen
- `GET /audit/breaches` — incidenten opvragen

Bij een datalek dat risico oplevert voor betrokkenen:

1. Melding aan Autoriteit Persoonsgegevens binnen 72 uur (art. 33)
2. Melding aan betrokkenen bij hoog risico (art. 34)
3. Documentatie van het incident, de gevolgen en de genomen maatregelen

---

## 8. Wijzigingslogboek

| Datum   | Versie | Wijziging       | Door   |
| ------- | ------ | --------------- | ------ |
| [DATUM] | 1.0    | Initiële versie | [NAAM] |
