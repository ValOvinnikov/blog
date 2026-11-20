import 'server-only';

import { buildAuthConfig } from '@shinefold/auth';
import { routes } from '@shinefold/config';
import { AUTH_APP } from '@shinefold/config/constants';
import { logMagicLinkRefusal } from '@web/server/auth/log-magic-link-refusal';
import { getRequestSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { logEmailSendCountFailure } from '@web/server/email-usage/log-email-send-count-failure/log-email-send-count-failure';
import { clearNewsletterSubscribedCookieSafely } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import NextAuth from 'next-auth';

// Lazy so `getDb()` waits for the first request; at import it breaks the build, where `DATABASE_URL` is unset.
const { handlers, auth } = NextAuth(async (request) => ({
  ...buildAuthConfig(
    AUTH_APP.SITE,
    {
      onSendRefused: logMagicLinkRefusal,
      onSendCountFailed: logEmailSendCountFailure,
    },
    await getRequestSiteOAuthCredentials(request),
  ),
  // Auth.js sends sign-in errors to `signIn` and the rest to `error`; both land on the header popover, which reads `?error=`.
  pages: { signIn: routes.home(), error: routes.home() },
  // The subscribed cookie belongs to the browser, so it must not outlive the reader who set it.
  events: {
    signIn: clearNewsletterSubscribedCookieSafely,
    signOut: clearNewsletterSubscribedCookieSafely,
  },
}));

export const { GET, POST } = handlers;
export { auth };
