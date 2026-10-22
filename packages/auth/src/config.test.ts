import { DrizzleAdapter } from '@auth/drizzle-adapter';
import {
  TEST_SESSION_EXPIRES,
  TEST_SESSION_TOKEN,
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

const SIGNED_IN_USER = { id: 'user-1', email: 'owner@example.com' };
const AUTH_SECRET_VALUE = 'test-secret';

type TSessionCallbackParams = Parameters<
  NonNullable<NonNullable<NextAuthConfig['callbacks']>['session']>
>[0];

const SESSION_ROW_ONLY_FIELDS = {
  sessionToken: TEST_SESSION_TOKEN,
  userId: SIGNED_IN_USER.id,
  app: AUTH_APP.SITE,
};

async function resolveSessionResponse(
  config: NextAuthConfig,
): Promise<TMaybeUndefined<DefaultSession>> {
  const user = {
    ...SIGNED_IN_USER,
    name: null,
    image: null,
    emailVerified: null,
  };
  const databaseStrategyParams = {
    session: {
      ...SESSION_ROW_ONLY_FIELDS,
      expires: TEST_SESSION_EXPIRES,
      user,
    },
    user,
    newSession: undefined,
  };

  return config.callbacks?.session?.(
    databaseStrategyParams as unknown as TSessionCallbackParams,
  );
}

async function importBuildAuthConfig(): Promise<typeof buildAuthConfig> {
  vi.resetModules();
  return (await import('./config')).buildAuthConfig;
}

function providerIdsOf(config: NextAuthConfig): unknown[] {
  return config.providers.map((provider) => {
    const resolved = typeof provider === 'function' ? provider() : provider;
    return resolved.id;
  });
}

describe(buildAuthConfig, () => {
  afterEach(() => {
    delete process.env['AUTH_SECRET'];
    delete process.env['AUTH_COOKIE_DOMAIN'];
    vi.unstubAllEnvs();
    delete process.env['AUTH_GITHUB_ID'];
    delete process.env['AUTH_GITHUB_SECRET'];
    delete process.env['AUTH_GOOGLE_ID'];
    delete process.env['AUTH_GOOGLE_SECRET'];
  });

  describe('for a site with the default environment', () => {
    let config: NextAuthConfig;

    beforeEach(() => {
      config = buildAuthConfig(AUTH_APP.SITE);
    });

    it('uses the database session strategy', () => {
      expect(config.session).toEqual({ strategy: 'database' });
    });

    it("binds the Drizzle adapter to @blog/db's Auth.js tables", () => {
      expect(DrizzleAdapter).toHaveBeenCalledWith(expect.anything(), {
        usersTable: schema.users,
        accountsTable: schema.accounts,
        sessionsTable: schema.sessions,
        verificationTokensTable: schema.verificationTokens,
      });
    });

    it('sets no cookie options', () => {
      expect(config.cookies).toBeUndefined();
    });

    it('always includes the magic-link email provider', () => {
      expect(providerIdsOf(config)).toEqual(expect.arrayContaining(['email']));
    });

    it('omits GitHub and Google when neither credential pair is set', () => {
      expect(providerIdsOf(config)).not.toEqual(
        expect.arrayContaining(['github', 'google']),
      );
    });

    it('returns the user with their id, and the expiry, as the session', async () => {
      expect(await resolveSessionResponse(config)).toEqual({
        user: {
          id: SIGNED_IN_USER.id,
          name: null,
          email: SIGNED_IN_USER.email,
          image: null,
        },
        expires: TEST_SESSION_EXPIRES.toISOString(),
      });
    });

    it('never puts the session token, user id or app in the session', async () => {
      const response = await resolveSessionResponse(config);

      expect(
        Object.keys(response ?? {}).filter(
          (field) => field in SESSION_ROW_ONLY_FIELDS,
        ),
      ).toEqual([]);
    });

    it('leaves pending membership invites alone on sign-in', async () => {
      await config.events?.signIn?.({
        user: SIGNED_IN_USER,
      });

      expect(consumePendingInvitesOnSignInMock).not.toHaveBeenCalled();
    });

    it('records no signup terms on sign-in', async () => {
      await config.events?.signIn?.({
        user: SIGNED_IN_USER,
        isNewUser: true,
      });

      expect(recordSignupTermsOnSignInMock).not.toHaveBeenCalled();
    });
  });

  describe('with AUTH_SECRET set', () => {
    beforeEach(() => {
      process.env['AUTH_SECRET'] = AUTH_SECRET_VALUE;
    });

    it('ignores AUTH_COOKIE_DOMAIN', async () => {
      process.env['AUTH_COOKIE_DOMAIN'] = '.example.com';
      const freshBuildAuthConfig = await importBuildAuthConfig();

      const config = freshBuildAuthConfig(AUTH_APP.SITE);

      expect(config.cookies).toBeUndefined();
    });

    it('reads the secret from AUTH_SECRET', async () => {
      const freshBuildAuthConfig = await importBuildAuthConfig();

      const config = freshBuildAuthConfig(AUTH_APP.SITE);

      expect(config.secret).toBe(AUTH_SECRET_VALUE);
    });

    describe('with a GitHub client id set', () => {
      beforeEach(() => {
        process.env['AUTH_GITHUB_ID'] = 'github-id';
      });

      it('includes GitHub and Google when their credentials are set', async () => {
        process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
        process.env['AUTH_GOOGLE_ID'] = 'google-id';
        process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';
        const freshBuildAuthConfig = await importBuildAuthConfig();

        const config = freshBuildAuthConfig(AUTH_APP.SITE);

        expect(providerIdsOf(config)).toEqual(
          expect.arrayContaining(['github', 'google']),
        );
      });

      it('omits GitHub when only one of its credential pair is set', async () => {
        const freshBuildAuthConfig = await importBuildAuthConfig();

        const config = freshBuildAuthConfig(AUTH_APP.SITE);

        expect(providerIdsOf(config)).not.toContain('github');
      });
    });
  });

  describe('for the platform', () => {
    it('scopes its sessions to the platform', () => {
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      expect(config.adapter).not.toBe(drizzleAdapterStub);
    });

    it('consumes pending membership invites on sign-in', async () => {
      const user = SIGNED_IN_USER;
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      await config.events?.signIn?.({ user });

      expect(consumePendingInvitesOnSignInMock).toHaveBeenCalledWith({ user });
    });

    it('records signup terms for a new user on sign-in', async () => {
      const user = SIGNED_IN_USER;
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      await config.events?.signIn?.({ user, isNewUser: true });

      expect(recordSignupTermsOnSignInMock).toHaveBeenCalledWith({
        user,
        isNewUser: true,
      });
    });

    it('names every cookie apart from the default Auth.js cookies', () => {
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      expect(config.cookies?.sessionToken?.name).not.toBe(
        'authjs.session-token',
      );
      expect(Object.keys(config.cookies ?? {})).toEqual(
        expect.arrayContaining([
          'sessionToken',
          'callbackUrl',
          'csrfToken',
          'pkceCodeVerifier',
          'state',
          'nonce',
        ]),
      );
    });

    it('keeps the secure cookie prefixes in production', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      expect(config.useSecureCookies).toBe(true);
      expect(config.cookies?.sessionToken?.name).toMatch(/^__Secure-/);
      expect(config.cookies?.csrfToken?.name).toMatch(/^__Host-/);
    });

    it('drops the secure cookie prefixes outside production', () => {
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      expect(config.useSecureCookies).toBe(false);
      expect(config.cookies?.sessionToken?.name).not.toMatch(/^__/);
    });
  });

  describe('for a site', () => {
    it('scopes its sessions to sites', () => {
      const config = buildAuthConfig(AUTH_APP.SITE);

      expect(config.adapter).not.toBe(drizzleAdapterStub);
    });

    it('keeps the default Auth.js cookies', () => {
      const config = buildAuthConfig(AUTH_APP.SITE);

      expect(config.cookies).toBeUndefined();
    });
  });
});
