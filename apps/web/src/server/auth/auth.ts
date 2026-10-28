import 'server-only';

import { buildAuthConfig } from '@blog/auth';
import { AUTH_APP } from '@blog/config/constants';
import { logMagicLinkRefusal } from '@web/server/auth/log-magic-link-refusal';
import { clearNewsletterSubscribedCookieSafely } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import NextAuth from 'next-auth';

// Lazy so `getDb()` waits for the first request; at import it breaks the build, where `DATABASE_URL` is unset.
const { handlers, auth } = NextAuth(() => ({
  ...buildAuthConfig(AUTH_APP.SITE, logMagicLinkRefusal),
  // Sign-in is a header popover with no `/login` route; `useOAuthErrorParam` reads `?error=` from here.
  pages: { error: '/' },
  // The subscribed cookie belongs to the browser, so it must not outlive the reader who set it.
  events: {
    signIn: clearNewsletterSubscribedCookieSafely,
    signOut: clearNewsletterSubscribedCookieSafely,
  },
}));

export const { GET, POST } = handlers;
export { auth };
