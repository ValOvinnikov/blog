import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { AUTH_APP } from '@blog/config/constants';
import { schema } from '@blog/db';
import type { NextAuthConfig } from 'next-auth';

import { buildAuthConfig } from './config';

const { drizzleAdapterStub } = vi.hoisted(() => ({
  drizzleAdapterStub: {},
}));

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => drizzleAdapterStub),
}));

const { consumePendingInvitesOnSignInMock } = vi.hoisted(() => ({
  consumePendingInvitesOnSignInMock: vi.fn(),
}));

vi.mock('@blog/auth/events/consume-pending-invites-on-sign-in', () => ({
  consumePendingInvitesOnSignIn: consumePendingInvitesOnSignInMock,
}));

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

  describe('with the default environment', () => {
    let config: NextAuthConfig;

    beforeEach(() => {
      config = buildAuthConfig();
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

    it('uses the Drizzle adapter as it is', () => {
      expect(config.adapter).toBe(drizzleAdapterStub);
    });

    it('always includes the magic-link email provider', () => {
      expect(providerIdsOf(config)).toEqual(expect.arrayContaining(['email']));
    });

    it('omits GitHub and Google when neither credential pair is set', () => {
      expect(providerIdsOf(config)).not.toEqual(
        expect.arrayContaining(['github', 'google']),
      );
    });

    it("exposes a session callback that adds the adapter user's id", () => {
      expect(config.callbacks?.session).toEqual(expect.any(Function));
    });

    it('exposes a signIn event that consumes pending membership invites', async () => {
      const user = { id: 'user-1', email: 'owner@example.com' };

      await config.events?.signIn?.({ user });

      expect(consumePendingInvitesOnSignInMock).toHaveBeenCalledWith({ user });
    });
  });

  describe('with AUTH_SECRET set', () => {
    beforeEach(() => {
      process.env['AUTH_SECRET'] = 'test-secret';
    });

    it('ignores AUTH_COOKIE_DOMAIN', async () => {
      process.env['AUTH_COOKIE_DOMAIN'] = '.example.com';
      const freshBuildAuthConfig = await importBuildAuthConfig();

      const config = freshBuildAuthConfig();

      expect(config.cookies).toBeUndefined();
    });

    it('reads the secret from AUTH_SECRET', async () => {
      const freshBuildAuthConfig = await importBuildAuthConfig();

      const config = freshBuildAuthConfig();

      expect(config.secret).toBe('test-secret');
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

        const config = freshBuildAuthConfig();

        expect(providerIdsOf(config)).toEqual(
          expect.arrayContaining(['github', 'google']),
        );
      });

      it('omits GitHub when only one of its credential pair is set', async () => {
        const freshBuildAuthConfig = await importBuildAuthConfig();

        const config = freshBuildAuthConfig();

        expect(providerIdsOf(config)).not.toContain('github');
      });
    });
  });

  describe('for the platform', () => {
    it('scopes its sessions to the platform', () => {
      const config = buildAuthConfig(AUTH_APP.PLATFORM);

      expect(config.adapter).not.toBe(drizzleAdapterStub);
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
    it('keeps the default Auth.js cookies', () => {
      const config = buildAuthConfig(AUTH_APP.SITE);

      expect(config.cookies).toBeUndefined();
    });
  });
});
