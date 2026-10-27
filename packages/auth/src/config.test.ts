import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import {
  MOCK_GITHUB_ID,
  MOCK_GITHUB_SECRET,
  MOCK_GOOGLE_ID,
  MOCK_GOOGLE_SECRET,
} from '@blog/auth/testing/oauth-fixtures';
import {
  MOCK_AUTH_SECRET,
  MOCK_EMAIL,
  MOCK_SESSION_EXPIRES,
  MOCK_SESSION_TOKEN,
  MOCK_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import { AUTH_APP } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { schema } from '@blog/db';
import type { DefaultSession, NextAuthConfig } from 'next-auth';

import { buildAuthConfig } from './config';

const { drizzleAdapterStub } = vi.hoisted(() => ({
  drizzleAdapterStub: {},
}));

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => drizzleAdapterStub),
}));

const { consumePendingInvitesOnSignInMock, recordSignupTermsOnSignInMock } =
  vi.hoisted(() => ({
    consumePendingInvitesOnSignInMock: vi.fn(),
    recordSignupTermsOnSignInMock: vi.fn(),
  }));

vi.mock('@blog/auth/events/consume-pending-invites-on-sign-in', () => ({
  consumePendingInvitesOnSignIn: consumePendingInvitesOnSignInMock,
}));

vi.mock('@blog/auth/events/record-signup-terms-on-sign-in', () => ({
  recordSignupTermsOnSignIn: recordSignupTermsOnSignInMock,
}));

const MOCK_SIGNED_IN_USER = { id: MOCK_USER_ID, email: MOCK_EMAIL };
const onMagicLinkSendRefused = vi.fn();

type TSessionCallbackParams = Parameters<
  NonNullable<NonNullable<NextAuthConfig['callbacks']>['session']>
>[0];

async function resolveSessionResponse(
  config: NextAuthConfig,
): Promise<TMaybeUndefined<DefaultSession>> {
  const user = {
    ...MOCK_SIGNED_IN_USER,
    name: null,
    image: null,
    emailVerified: null,
  };
  const databaseStrategyParams = {
    session: {
      sessionToken: MOCK_SESSION_TOKEN,
      userId: MOCK_USER_ID,
      app: AUTH_APP.SITE,
      expires: MOCK_SESSION_EXPIRES,
      user,
    },
    user,
    newSession: undefined,
  };

  return config.callbacks?.session?.(
    databaseStrategyParams as unknown as TSessionCallbackParams,
  );
}

function providerIdsOf(config: NextAuthConfig): unknown[] {
  return config.providers.map((provider) => {
    const resolved = typeof provider === 'function' ? provider() : provider;
    return resolved.id;
  });
}

describe(buildAuthConfig, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([AUTH_APP.SITE, AUTH_APP.PLATFORM])(
    'scopes the sessions of a %s config to its app',
    (app) => {
      const config = buildAuthConfig(app, onMagicLinkSendRefused);

      expect(config.adapter).not.toBe(drizzleAdapterStub);
    },
  );

  it("binds the Drizzle adapter to @blog/db's Auth.js tables", () => {
    buildAuthConfig(AUTH_APP.SITE, onMagicLinkSendRefused);

    const [, tables] = vi.mocked(DrizzleAdapter).mock.calls[0] ?? [];
    expect(tables).toEqual({
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    });
  });

  it('reads the secret from AUTH_SECRET', () => {
    vi.stubEnv('AUTH_SECRET', MOCK_AUTH_SECRET);

    const config = buildAuthConfig(AUTH_APP.SITE, onMagicLinkSendRefused);

    expect(config.secret).toBe(MOCK_AUTH_SECRET);
  });

  it('offers only the magic-link provider when no OAuth credentials are set', () => {
    const config = buildAuthConfig(AUTH_APP.SITE, onMagicLinkSendRefused);

    expect(providerIdsOf(config)).toEqual([MAGIC_LINK_PROVIDER_ID]);
  });

  it('adds GitHub and Google ahead of the magic link when their credentials are set', () => {
    vi.stubEnv('AUTH_GITHUB_ID', MOCK_GITHUB_ID);
    vi.stubEnv('AUTH_GITHUB_SECRET', MOCK_GITHUB_SECRET);
    vi.stubEnv('AUTH_GOOGLE_ID', MOCK_GOOGLE_ID);
    vi.stubEnv('AUTH_GOOGLE_SECRET', MOCK_GOOGLE_SECRET);

    const config = buildAuthConfig(AUTH_APP.SITE, onMagicLinkSendRefused);

    expect(providerIdsOf(config)).toEqual([
      'github',
      'google',
      MAGIC_LINK_PROVIDER_ID,
    ]);
  });

  describe('for a site', () => {
    let config: NextAuthConfig;

    beforeEach(() => {
      config = buildAuthConfig(AUTH_APP.SITE, onMagicLinkSendRefused);
    });

    it('keeps the default Auth.js cookies', () => {
      expect(config.cookies).toBeUndefined();
    });

    it('returns only the public user fields and the expiry as the session', async () => {
      const response = await resolveSessionResponse(config);

      expect(response).toEqual({
        user: {
          id: MOCK_USER_ID,
          name: null,
          email: MOCK_EMAIL,
          image: null,
        },
        expires: MOCK_SESSION_EXPIRES.toISOString(),
      });
    });

    it('acts on neither invites nor signup terms on sign-in', async () => {
      await config.events?.signIn?.({
        user: MOCK_SIGNED_IN_USER,
        isNewUser: true,
      });

      expect(consumePendingInvitesOnSignInMock).not.toHaveBeenCalled();
      expect(recordSignupTermsOnSignInMock).not.toHaveBeenCalled();
    });
  });

  describe('for the platform', () => {
    let config: NextAuthConfig;

    beforeEach(() => {
      config = buildAuthConfig(AUTH_APP.PLATFORM, onMagicLinkSendRefused);
    });

    it('consumes pending invites and records signup terms on sign-in', async () => {
      await config.events?.signIn?.({
        user: MOCK_SIGNED_IN_USER,
        isNewUser: true,
      });

      expect(consumePendingInvitesOnSignInMock).toHaveBeenCalledWith({
        user: MOCK_SIGNED_IN_USER,
      });
      expect(recordSignupTermsOnSignInMock).toHaveBeenCalledWith({
        user: MOCK_SIGNED_IN_USER,
        isNewUser: true,
      });
    });

    it('names every cookie apart from the default Auth.js cookies', () => {
      expect(config.cookies?.sessionToken?.name).not.toBe(
        'authjs.session-token',
      );
      expect(Object.keys(config.cookies ?? {})).toEqual([
        'sessionToken',
        'callbackUrl',
        'csrfToken',
        'pkceCodeVerifier',
        'state',
        'nonce',
        'webauthnChallenge',
      ]);
    });

    it('drops the secure cookie prefixes outside production', () => {
      expect(config.useSecureCookies).toBe(false);
      expect(config.cookies?.sessionToken?.name).not.toMatch(/^__/);
    });
  });

  describe('for the platform in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('keeps the secure cookie prefixes', () => {
      const config = buildAuthConfig(AUTH_APP.PLATFORM, onMagicLinkSendRefused);

      expect(config.useSecureCookies).toBe(true);
      expect(config.cookies?.sessionToken?.name).toMatch(/^__Secure-/);
      expect(config.cookies?.csrfToken?.name).toMatch(/^__Host-/);
    });
  });
});
