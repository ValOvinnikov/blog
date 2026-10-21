import { AUTH_APP } from '@blog/config/constants';
import type { Adapter } from 'next-auth/adapters';

import { scopeAdapterToApp } from './app-scoped-adapter';

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  emailVerified: null,
};
const expires = new Date('2030-01-01T00:00:00Z');

function buildAdapter(
  storedApp: string,
): Required<
  Pick<
    Adapter,
    'createSession' | 'getSessionAndUser' | 'deleteSession' | 'linkAccount'
  >
> {
  return {
    createSession: vi.fn(async (session) => session),
    linkAccount: vi.fn(async () => undefined),
    getSessionAndUser: vi.fn(async (sessionToken) => ({
      session: { sessionToken, userId: user.id, expires, app: storedApp },
      user,
    })),
    deleteSession: vi.fn(async () => {}),
  };
}

describe(scopeAdapterToApp, () => {
  it('stamps each new session with the app', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.createSession?.({
      sessionToken: 'token',
      userId: user.id,
      expires,
    });

    expect(adapter.createSession).toHaveBeenCalledWith({
      sessionToken: 'token',
      userId: user.id,
      expires,
      app: AUTH_APP.PLATFORM,
    });
  });

  it('returns a session the app issued', async () => {
    const scoped = scopeAdapterToApp(
      buildAdapter(AUTH_APP.PLATFORM),
      AUTH_APP.PLATFORM,
    );

    const found = await scoped.getSessionAndUser?.('token');

    expect(found?.user).toEqual(user);
  });

  it('reads a session another app issued as no session', async () => {
    const scoped = scopeAdapterToApp(
      buildAdapter(AUTH_APP.SITE),
      AUTH_APP.PLATFORM,
    );

    const found = await scoped.getSessionAndUser?.('token');

    expect(found).toBeNull();
  });

  it('deletes a session the app issued', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.deleteSession?.('token');

    expect(adapter.deleteSession).toHaveBeenCalledWith('token');
  });

  it('leaves a session another app issued in place', async () => {
    const adapter = buildAdapter(AUTH_APP.SITE);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.deleteSession?.('token');

    expect(adapter.deleteSession).not.toHaveBeenCalled();
  });

  it('links a provider account without its tokens', async () => {
    const adapter = buildAdapter(AUTH_APP.SITE);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.SITE);

    await scoped.linkAccount?.({
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'gh-1',
      access_token: 'access',
      refresh_token: 'refresh',
      id_token: 'id',
      token_type: 'bearer',
      scope: 'read:user',
    });

    expect(adapter.linkAccount).toHaveBeenCalledWith({
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'gh-1',
      token_type: 'bearer',
      scope: 'read:user',
    });
  });
});
