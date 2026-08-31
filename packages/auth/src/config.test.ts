import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { schema } from '@blog/db';
import type { NextAuthConfig } from 'next-auth';

import { buildAuthConfig } from './config';

// Real `DrizzleAdapter` output is an opaque `Adapter` object (methods, no
// inspectable table references) — mocked so the "bound to the right tables"
// test below can assert on the call args instead.
vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(() => ({})),
}));

const { consumePendingInvitesOnSignInMock } = vi.hoisted(() => ({
  consumePendingInvitesOnSignInMock: vi.fn(),
}));

vi.mock('@blog/auth/events/consume-pending-invites-on-sign-in', () => ({
  consumePendingInvitesOnSignIn: consumePendingInvitesOnSignInMock,
}));

// `env.ts` validates AUTH_SECRET eagerly on import, so the one test that
// changes it needs a fresh module instance via resetModules + dynamic import
// (same pattern as utils/env/env.test.ts).
async function importBuildAuthConfig(): Promise<typeof buildAuthConfig> {
  vi.resetModules();
  return (await import('./config')).buildAuthConfig;
}

describe(buildAuthConfig, () => {
  afterEach(() => {
    delete process.env['AUTH_SECRET'];
    delete process.env['AUTH_COOKIE_DOMAIN'];
    delete process.env['AUTH_GITHUB_ID'];
    delete process.env['AUTH_GITHUB_SECRET'];
    delete process.env['AUTH_GOOGLE_ID'];
    delete process.env['AUTH_GOOGLE_SECRET'];
  });

  it('uses the database session strategy', () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });

    expect(config.session).toEqual({ strategy: 'database' });
  });

  it("binds the Drizzle adapter to @blog/db's Auth.js tables", () => {
    buildAuthConfig({ sendEmail: vi.fn() });

    expect(DrizzleAdapter).toHaveBeenCalledWith(expect.anything(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    });
  });

  it('sets no cookie options', () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });

    expect(config.cookies).toBeUndefined();
  });

  it('scopes the session cookie to AUTH_COOKIE_DOMAIN when it is set', async () => {
    process.env['AUTH_SECRET'] = 'test-secret';
    process.env['AUTH_COOKIE_DOMAIN'] = '.example.com';
    const freshBuildAuthConfig = await importBuildAuthConfig();

    const config = freshBuildAuthConfig({ sendEmail: vi.fn() });

    expect(config.cookies?.sessionToken).toEqual({
      name: '__Secure-authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: '.example.com',
      },
    });
  });

  it('reads the secret from AUTH_SECRET', async () => {
    process.env['AUTH_SECRET'] = 'test-secret';
    const freshBuildAuthConfig = await importBuildAuthConfig();

    const config = freshBuildAuthConfig({ sendEmail: vi.fn() });

    expect(config.secret).toBe('test-secret');
  });

  function providerIdsOf(config: NextAuthConfig): unknown[] {
    return config.providers.map((provider) => {
      // A provider entry is either a config object or a factory returning
      // one — `id` sits on the object form every provider here resolves to.
      const resolved = typeof provider === 'function' ? provider() : provider;
      return resolved.id;
    });
  }

  it('always includes the magic-link email provider', () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });

    expect(providerIdsOf(config)).toEqual(expect.arrayContaining(['email']));
  });

  it('includes GitHub and Google when their credentials are set', async () => {
    process.env['AUTH_SECRET'] = 'test-secret';
    process.env['AUTH_GITHUB_ID'] = 'github-id';
    process.env['AUTH_GITHUB_SECRET'] = 'github-secret';
    process.env['AUTH_GOOGLE_ID'] = 'google-id';
    process.env['AUTH_GOOGLE_SECRET'] = 'google-secret';
    const freshBuildAuthConfig = await importBuildAuthConfig();

    const config = freshBuildAuthConfig({ sendEmail: vi.fn() });

    expect(providerIdsOf(config)).toEqual(
      expect.arrayContaining(['github', 'google']),
    );
  });

  it('omits GitHub when only one of its credential pair is set', async () => {
    process.env['AUTH_SECRET'] = 'test-secret';
    process.env['AUTH_GITHUB_ID'] = 'github-id';
    const freshBuildAuthConfig = await importBuildAuthConfig();

    const config = freshBuildAuthConfig({ sendEmail: vi.fn() });

    expect(providerIdsOf(config)).not.toContain('github');
  });

  it('omits GitHub and Google when neither credential pair is set', () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });

    expect(providerIdsOf(config)).not.toEqual(
      expect.arrayContaining(['github', 'google']),
    );
  });

  it("exposes a session callback that adds the adapter user's id", () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });

    expect(config.callbacks?.session).toEqual(expect.any(Function));
  });

  it('exposes a signIn event that consumes pending membership invites', async () => {
    const config = buildAuthConfig({ sendEmail: vi.fn() });
    const user = { id: 'user-1', email: 'owner@example.com' };

    await config.events?.signIn?.({ user });

    expect(consumePendingInvitesOnSignInMock).toHaveBeenCalledWith({ user });
  });
});
