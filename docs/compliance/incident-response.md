# Incident Response Plan — BABL

> Op grond van artikelen 33 en 34 AVG. Dit plan beschrijft de procedures
> bij beveiligingsincidenten en datalekken.

**Versie:** 1.0
**Datum:** [DATUM]
**Volgende review:** [DATUM + 12 maanden]

---

## 1. Definities

| Term                     | Definitie                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Beveiligingsincident** | Elke gebeurtenis die de vertrouwelijkheid, integriteit of beschikbaarheid van persoonsgegevens in gevaar brengt                          |
| **Datalek**              | Een beveiligingsincident dat leidt tot ongeautoriseerde toegang, vernietiging, verlies, wijziging of openbaarmaking van persoonsgegevens |
| **AP**                   | Autoriteit Persoonsgegevens (Nederlandse toezichthouder)                                                                                 |
| **Betrokkene**           | Persoon wiens persoonsgegevens worden verwerkt                                                                                           |

---

## 2. Contactpersonen

| Rol                          | Naam   | E-mail          | Telefoon   |
| ---------------------------- | ------ | --------------- | ---------- |
| Verwerkingsverantwoordelijke | [NAAM] | [CONTACT EMAIL] | [TELEFOON] |
| Technisch contact            | [NAAM] | [CONTACT EMAIL] | [TELEFOON] |

---

## 3. Incidentclassificatie

### 3.1 Ernstgradatie

| Ernst       | Beschrijving                                           | Voorbeelden                                                                                | Meldingsplicht AP                 |
| ----------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------- |
| **Kritiek** | Grote hoeveelheid gevoelige data gecompromitteerd      | Datalek bij sub-verwerker met audio/transcripties, ongeautoriseerde toegang tot audit logs | Ja (72 uur) + melding betrokkenen |
| **Hoog**    | Beperkte data gecompromitteerd of systeemkwetsbaarheid | API-key gelekt, ongeautoriseerde API-toegang                                               | Ja (72 uur)                       |
| **Middel**  | Potentieel risico zonder bewezen compromittering       | Verdachte loginpogingen, ongewone API-patronen                                             | Beoordeling nodig                 |
| **Laag**    | Minimaal risico, geen persoonsgegevens betrokken       | Configuratiefout zonder data-impact, beschikbaarheidsprobleem                              | Nee (intern loggen)               |

---

## 4. Procedures

### 4.1 Fase 1: Identificatie (0-1 uur)

1. Incident detecteren (monitoring, melding, audit log)
2. Ernst classificeren (zie tabel hierboven)
3. Eerste beoordeling: welke data is betrokken?
4. Incident registreren via `POST /audit/breaches`

**Vragen bij eerste beoordeling:**

- Welke persoonsgegevens zijn betrokken? (audio, tekst, sessie-IDs)
- Hoeveel betrokkenen zijn geraakt?
- Is het incident nog gaande?
- Welke verwerkingsmodus was actief? (lokaal vs API)

### 4.2 Fase 2: Inperking (1-4 uur)

1. Bron van het incident isoleren
2. Bij API-lek: API-keys roteren
3. Bij sub-verwerker incident: contact opnemen met verwerker
4. Tijdelijke maatregelen nemen (feature uitschakelen, rate limiting aanscherpen)

**Technische acties:**

- API-keys roteren via `.env` configuratie
- Rate limiting aanscherpen
- Betrokken endpoints tijdelijk uitschakelen
- Audit logs veiligstellen

### 4.3 Fase 3: Melding (binnen 72 uur na ontdekking)

#### Melding aan Autoriteit Persoonsgegevens (art. 33)

**Wanneer**: Bij elk datalek dat een risico oplevert voor betrokkenen.

**Niet nodig bij**: Incidenten zonder risico (bijv. versleutelde data gelekt, data al publiek).

**Hoe**: Via het meldloket van de AP: https://datalekken.autoriteitpersoonsgegevens.nl

**Inhoud melding:**

- Aard van het datalek
- Categorieeen betrokkenen en persoonsgegevens
- Geschat aantal betrokkenen
- Contactgegevens van de verwerkingsverantwoordelijke
- Beschrijving van de gevolgen
- Beschrijving van de genomen maatregelen

#### Melding aan betrokkenen (art. 34)

**Wanneer**: Bij een hoog risico voor de rechten en vrijheden van betrokkenen.

**Hoe**: Via e-mail of via de applicatie (als contactgegevens beschikbaar zijn).

**Inhoud melding:**

- Beschrijving van het incident in duidelijke taal
- Welke gegevens betrokken zijn
- Wat de mogelijke gevolgen zijn
- Welke maatregelen zijn genomen
- Aanbevelingen voor betrokkenen (bijv. wachtwoord wijzigen)

### 4.4 Fase 4: Herstel (1-7 dagen)

1. Oorzaak vaststellen (root cause analysis)
2. Structurele oplossing implementeren
3. Controleren of het incident is opgelost
4. Monitoring aanscherpen

### 4.5 Fase 5: Evaluatie (binnen 30 dagen)

1. Incident evalueren: wat ging goed, wat kan beter?
2. Procedures bijwerken indien nodig
3. Documentatie compleet maken
4. Incidentrapport archiveren

---

## 5. Documentatievereisten

Elk incident wordt gedocumenteerd met minimaal:

| Veld               | Beschrijving                                          |
| ------------------ | ----------------------------------------------------- |
| Incident-ID        | Unieke identifier                                     |
| Datum ontdekking   | Wanneer het incident is ontdekt                       |
| Datum melding AP   | Wanneer de AP is geinformeerd (indien van toepassing) |
| Ernst              | Kritiek / Hoog / Middel / Laag                        |
| Beschrijving       | Wat is er gebeurd                                     |
| Betrokken data     | Welke categorieeen persoonsgegevens                   |
| Aantal betrokkenen | Geschat aantal                                        |
| Oorzaak            | Root cause                                            |
| Maatregelen        | Wat is er gedaan om het incident te verhelpen         |
| Status             | Open / In behandeling / Afgesloten                    |

### 5.1 Technische registratie

Incidenten worden geregistreerd via de BABL audit API:

- `POST /audit/breaches` — incident vastleggen
- `GET /audit/breaches` — incidenten opvragen

---

## 6. Specifieke scenario's

### 6.1 API-key lekt

1. Onmiddellijk de betrokken key roteren
2. Controleren of de key is misbruikt (logs checken)
3. Nieuwe key configureren in `.env`
4. Ernst: Hoog (indien misbruik bewezen) of Middel (zonder misbruik)

### 6.2 Sub-verwerker meldt datalek

1. Ernst beoordelen op basis van melding verwerker
2. Controleren of BABL-data betrokken is
3. Zo ja: eigen meldingsprocedure starten (72 uur)
4. Contact met verwerker voor updates en maatregelen

### 6.3 Ongeautoriseerde toegang tot server

1. Toegang onmiddellijk blokkeren
2. Audit logs veiligstellen en analyseren
3. Vaststellen welke data is benaderd
4. Meldingsprocedure starten indien persoonsgegevens betrokken

---

## 7. Preventieve maatregelen

| Maatregel                                                       | Status          |
| --------------------------------------------------------------- | --------------- |
| Rate limiting (20 req/min per IP)                               | Geimplementeerd |
| Dagelijks budgetlimiet (50 transcripties, 100 polijstverzoeken) | Geimplementeerd |
| TLS 1.2+ voor alle API-communicatie                             | Geimplementeerd |
| PII-redactie bij AssemblyAI                                     | Geimplementeerd |
| Geen persistente opslag van audio/transcripties op server       | Geimplementeerd |
| Audit logging (append-only JSONL)                               | Geimplementeerd |
| Sessie-IDs als random UUIDs                                     | Geimplementeerd |
| API-keys in environment variables                               | Geimplementeerd |

---

## 8. Wijzigingslogboek

| Datum   | Versie | Wijziging       | Door   |
| ------- | ------ | --------------- | ------ |
| [DATUM] | 1.0    | Initiele versie | [NAAM] |
