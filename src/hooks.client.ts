import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

if (env.PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: env.PUBLIC_SENTRY_DSN,
		environment: import.meta.env.MODE,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0,
		// Privacy: strip request bodies — kunnen transcriptie-inhoud bevatten
		beforeSend(event) {
			if (event.request) {
				delete event.request.data;
				delete event.request.cookies;
			}
			return event;
		}
	});
}

export const handleError = Sentry.handleErrorWithSentry();
