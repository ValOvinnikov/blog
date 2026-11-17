import 'server-only';

import { logEmailSendCountFailure } from '@platform/server/auth/log-email-send-count-failure';
import { logMagicLinkRefusal } from '@platform/server/auth/log-magic-link-refusal';
import { withOwnerSignInActivity } from '@platform/server/auth/with-owner-sign-in-activity';
import { adminRoutes, SIGN_IN_PATH } from '@platform/utils/routes/routes';
import { buildAuthConfig } from '@shinefold/auth';
import { AUTH_APP } from '@shinefold/config/constants';
import NextAuth from 'next-auth';
import { cache } from 'react';

// Lazy so `getDb()` waits for the first request; at import it breaks the build, where `DATABASE_URL` is unset.
const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  ...withOwnerSignInActivity(
    buildAuthConfig(AUTH_APP.PLATFORM, {
      onSendRefused: logMagicLinkRefusal,
      onSendCountFailed: logEmailSendCountFailure,
    }),
  ),
  pages: { signIn: SIGN_IN_PATH, error: adminRoutes.signInError() },
}));

/** Server Components and gates read the session through this; `auth()` is a database lookup on every call. */
export const getSession = cache(() => auth());

export const { GET, POST } = handlers;
export { auth, signIn, signOut };
