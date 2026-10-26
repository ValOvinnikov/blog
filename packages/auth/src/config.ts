import 'server-only';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { consumePendingInvitesOnSignIn } from '@blog/auth/events/consume-pending-invites-on-sign-in';
import { recordSignupTermsOnSignIn } from '@blog/auth/events/record-signup-terms-on-sign-in';
import { buildMagicLinkProvider } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { scopeAdapterToApp } from '@blog/auth/sessions/app-scoped-adapter';
import { buildPlatformCookies } from '@blog/auth/sessions/platform-cookies';
import { env } from '@blog/auth/utils/env/env';
import { getOAuthProviderCredentials } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { AUTH_APP, type TAuthApp } from '@blog/config/constants';
import type { IMagicLinkSendRefusal } from '@blog/config/types';
import { getDb, schema } from '@blog/db';
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export function buildAuthConfig(
  app: TAuthApp,
  onMagicLinkSendRefused: (refusal: IMagicLinkSendRefusal) => void,
): NextAuthConfig {
  const githubCredentials = getOAuthProviderCredentials('github');
  const googleCredentials = getOAuthProviderCredentials('google');
  const adapter = DrizzleAdapter(getDb(), {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  });
  // Auth.js picks secure cookies per request protocol, which a static config cannot see.
  const useSecureCookies = process.env.NODE_ENV === 'production';

  return {
    adapter: scopeAdapterToApp(adapter, app),
    session: { strategy: 'database' },
    secret: env.AUTH_SECRET,
    ...(app === AUTH_APP.PLATFORM && {
      useSecureCookies,
      cookies: buildPlatformCookies(useSecureCookies),
    }),
    callbacks: {
      // The returned object is the public /api/auth/session body, so it never spreads the session row.
      session: ({ session, user }) => ({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        expires: new Date(session.expires).toISOString(),
      }),
    },
    ...(app === AUTH_APP.PLATFORM && {
      events: {
        signIn: async ({ user, isNewUser }) => {
          await Promise.all([
            consumePendingInvitesOnSignIn({ user }),
            recordSignupTermsOnSignIn({ user, isNewUser }),
          ]);
        },
      },
    }),
    providers: [
      ...(githubCredentials ? [GitHub(githubCredentials)] : []),
      ...(googleCredentials ? [Google(googleCredentials)] : []),
      buildMagicLinkProvider(app, onMagicLinkSendRefused),
    ],
  };
}
