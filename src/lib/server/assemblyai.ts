import type { TranscriptOptionalParams } from 'assemblyai';

// EU-endpoint (Dublin) — vereist voor de privacybelofte "data blijft in de EU"
export const ASSEMBLYAI_EU_BASE_URL = 'https://api.eu.assemblyai.com';

// Zelfde redactiebeleid als het lokale backend-pad (backend/routes/transcribe_api.py)
export const PII_REDACTION: Pick<
	TranscriptOptionalParams,
	'redact_pii' | 'redact_pii_policies' | 'redact_pii_sub'
> = {
	redact_pii: true,
	redact_pii_policies: [
		'person_name',
		'phone_number',
		'email_address',
		'date_of_birth',
		'medical_process',
		'medical_condition'
	],
	redact_pii_sub: 'entity_name'
};
