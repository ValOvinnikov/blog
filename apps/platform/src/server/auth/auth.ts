import 'server-only';

import { buildAuthConfig } from '@blog/auth';
import { AUTH_APP } from '@blog/config/constants';
import { logMagicLinkRefusal } from '@platform/server/auth/log-magic-link-refusal';
import { withOwnerSignInActivity } from '@platform/server/auth/with-owner-sign-in-activity';
import { adminRoutes, SIGN_IN_PATH } from '@platform/utils/routes/routes';
import NextAuth from 'next-auth';
import { cache } from 'react';

// Lazy so `getDb()` waits for the first request; at import it breaks the build, where `DATABASE_URL` is unset.
const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  ...withOwnerSignInActivity(
    buildAuthConfig(AUTH_APP.PLATFORM, logMagicLinkRefusal),
  ),
  pages: { signIn: SIGN_IN_PATH, error: adminRoutes.signInError() },
}));

/** Server Components and gates read the session through this; `auth()` is a database lookup on every call. */
export const getSession = cache(() => auth());

export const { GET, POST } = handlers;
export { auth, signIn, signOut };
