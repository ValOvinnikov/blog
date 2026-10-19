import 'server-only';

import { buildAuthConfig } from '@blog/auth';
import { AUTH_APP } from '@blog/config/constants';
import NextAuth from 'next-auth';

// Lazy so `getDb()` waits for the first request; at import it breaks the build, where `DATABASE_URL` is unset.
const { handlers, auth } = NextAuth(() => ({
  ...buildAuthConfig(AUTH_APP.SITE),
  // Sign-in is a header popover with no `/login` route; `useOAuthErrorParam` reads `?error=` from here.
  pages: { error: '/' },
}));

export const { GET, POST } = handlers;
export { auth };
