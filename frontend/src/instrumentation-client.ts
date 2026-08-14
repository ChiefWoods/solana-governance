import * as Sentry from '@sentry/nextjs';

import { isThirdPartyScriptError } from '@/lib/sentryFilters';

import { env } from './env';

Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    sendDefaultPii: false,
    beforeSend(event) {
        return isThirdPartyScriptError(event) ? null : event;
    },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
