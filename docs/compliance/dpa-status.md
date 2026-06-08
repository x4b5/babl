# DPA-status per sub-verwerker — BABL

> Overzicht van verwerkersovereenkomsten (Data Processing Agreements) conform artikel 28 AVG.

**Versie:** 1.0
**Datum:** [DATUM]
**Volgende review:** [DATUM + 12 maanden]

---

## 1. AssemblyAI Inc.

| Veld                | Waarde                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Dienst**          | Spraaktranscriptie (Universal-2 model)                                                     |
| **DPA**             | Ja — onderdeel van Terms of Service                                                        |
| **DPA-locatie**     | https://www.assemblyai.com/legal/dpa                                                       |
| **Certificeringen** | SOC 2 Type II, ISO 27001                                                                   |
| **Datacenter**      | Dublin, Ierland (EU)                                                                       |
| **Data retentie**   | Audio wordt na verwerking verwijderd; geen persistente opslag                              |
| **PII-redactie**    | Ja — namen, telefoonnummers, e-mailadressen, geboortedata, medische processen en condities |
| **Subverwerkers**   | Zie AssemblyAI subprocessor list                                                           |
| **Contactpersoon**  | privacy@assemblyai.com                                                                     |
| **Laatste review**  | [DATUM]                                                                                    |
| **Status**          | Actief                                                                                     |

---

## 2. Mistral AI

| Veld                | Waarde                                                        |
| ------------------- | ------------------------------------------------------------- |
| **Dienst**          | Tekstverwerking / polijsten (mistral-large-latest)            |
| **DPA**             | Ja — apart DPA-document beschikbaar                           |
| **DPA-locatie**     | https://mistral.ai/terms/#data-processing-agreement           |
| **Certificeringen** | SOC 2 Type II, ISO 27001                                      |
| **Datacenter**      | Parijs, Frankrijk (EU)                                        |
| **Data retentie**   | Maximaal 30 dagen voor abuse monitoring, daarna verwijderd    |
| **PII-redactie**    | Niet van toepassing (tekst-input, geen automatische redactie) |
| **Subverwerkers**   | Zie Mistral AI subprocessor list                              |
| **Contactpersoon**  | dpo@mistral.ai                                                |
| **Laatste review**  | [DATUM]                                                       |
| **Status**          | Actief                                                        |

---

## 3. PostHog

| Veld                | Waarde                                                |
| ------------------- | ----------------------------------------------------- |
| **Dienst**          | Webanalytics (alleen geaggregeerde events)            |
| **DPA**             | Ja — onderdeel van Terms of Service                   |
| **DPA-locatie**     | https://posthog.com/dpa                               |
| **Certificeringen** | SOC 2 Type 2                                          |
| **Datacenter**      | EU (eu.posthog.com endpoint)                          |
| **Data retentie**   | Conform PostHog retentiebeleid                        |
| **PII**             | Geen — `person_profiles: 'never'`, geen PII in events |
| **Contactpersoon**  | privacy@posthog.com                                   |
| **Laatste review**  | [DATUM]                                               |
| **Status**          | Actief                                                |

---

## 4. Vercel Inc.

| Veld                | Waarde                                              |
| ------------------- | --------------------------------------------------- |
| **Dienst**          | Frontend hosting (statische bestanden + API routes) |
| **DPA**             | Ja — onderdeel van Terms of Service                 |
| **DPA-locatie**     | https://vercel.com/legal/dpa                        |
| **Certificeringen** | SOC 2 Type 2                                        |
| **Datacenter**      | Edge network (EU region geconfigureerd)             |
| **Data retentie**   | Geen persistente opslag van gebruikersdata          |
| **PII**             | Geen — alleen statische bestanden en API proxy      |
| **Contactpersoon**  | privacy@vercel.com                                  |
| **Laatste review**  | [DATUM]                                             |
| **Status**          | Actief                                              |

---

## 5. Checklist

- [ ] Alle DPA's jaarlijks reviewen
- [ ] Controleren of subverwerkers nog actueel zijn
- [ ] Certificeringen verifiereren (SOC 2, ISO 27001)
- [ ] Bij wijziging van verwerker: nieuwe DPA afsluiten voor migratie

---

## 6. Wijzigingslogboek

| Datum   | Versie | Wijziging       | Door   |
| ------- | ------ | --------------- | ------ |
| [DATUM] | 1.0    | Initiele versie | [NAAM] |
