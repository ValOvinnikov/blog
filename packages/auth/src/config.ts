import 'server-only';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { consumePendingInvitesOnSignIn } from '@blog/auth/events/consume-pending-invites-on-sign-in';
import { recordSignupTermsOnSignIn } from '@blog/auth/events/record-signup-terms-on-sign-in';
import { buildMagicLinkProvider } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { buildAppCookies } from '@blog/auth/sessions/app-cookies';
import { scopeAdapterToApp } from '@blog/auth/sessions/app-scoped-adapter';
import { env } from '@blog/auth/utils/env/env';
import {
  getOAuthProviderCredentials,
  OAUTH_PROVIDER_IDS,
  type TOAuthProviderId,
} from '@blog/auth/utils/oauth-providers/oauth-providers';
import type { TOAuthCredentials } from '@blog/config';
import {
  AUTH_APP,
  OAUTH_PROVIDER,
  type TAuthApp,
} from '@blog/config/constants';
import type { IMagicLinkSendHandlers } from '@blog/config/types';
import { getDb, schema } from '@blog/db';
import type { TTenantOAuthCredentialsByProvider } from '@blog/db/queries/tenant-oauth-credentials/get-tenant-oauth-credentials/get-tenant-oauth-credentials';
import { isUndefined } from '@blog/utils/primitives';
import type { NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

type TOAuthProviderOptions = TOAuthCredentials & { redirectProxyUrl?: string };

const OAUTH_PROVIDER_FACTORIES: Record<
  TOAuthProviderId,
  (options: TOAuthProviderOptions) => Provider
> = {
  [OAUTH_PROVIDER.GITHUB]: GitHub,
  [OAUTH_PROVIDER.GOOGLE]: Google,
};

// Auth.js falls back to AUTH_REDIRECT_PROXY_URL on a nullish value, so only an empty string turns the proxy off.
const WITHOUT_REDIRECT_PROXY = { redirectProxyUrl: '' };

function buildOAuthProviders(
  siteCredentials: TTenantOAuthCredentialsByProvider,
): Provider[] {
  return OAUTH_PROVIDER_IDS.flatMap((id) => {
    const credentials = getOAuthProviderCredentials(id, siteCredentials);
    if (isUndefined(credentials)) return [];

    return [
      OAUTH_PROVIDER_FACTORIES[id]({
        ...credentials,
        ...(siteCredentials[id] && WITHOUT_REDIRECT_PROXY),
      }),
    ];
  });
}

export function buildAuthConfig(
  app: TAuthApp,
  magicLinkHandlers: IMagicLinkSendHandlers,
  siteCredentials: TTenantOAuthCredentialsByProvider = {},
): NextAuthConfig {
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
    useSecureCookies,
    cookies: buildAppCookies(app, useSecureCookies),
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
      ...buildOAuthProviders(siteCredentials),
      buildMagicLinkProvider(app, magicLinkHandlers),
    ],
  };
}
