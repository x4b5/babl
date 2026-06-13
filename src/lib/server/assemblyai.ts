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

/** Mapt een AssemblyAI-foutmelding naar een bekend error_type voor de frontend. */
export function classifyAssemblyError(msg: string): string {
	const lower = msg.toLowerCase();
	if (msg.includes('429') || lower.includes('rate limit')) return 'rate_limit';
	if (msg.includes('502') || msg.includes('503')) return 'upstream_disconnect';
	if (lower.includes('timeout')) return 'timeout';
	return 'server_error';
}
