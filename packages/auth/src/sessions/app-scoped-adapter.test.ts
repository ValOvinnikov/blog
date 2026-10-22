import {
  TEST_PROVIDER,
  TEST_PROVIDER_ACCOUNT_ID,
  TEST_SESSION_EXPIRES,
  TEST_SESSION_TOKEN,
  TEST_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import { AUTH_APP } from '@blog/config/constants';
import { queries } from '@blog/db';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { sha256Hex } from '@blog/utils/hash';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';

import { scopeAdapterToApp } from './app-scoped-adapter';

const user = {
  id: TEST_USER_ID,
  email: 'owner@example.com',
  name: null,
  emailVerified: null,
};
const expires = TEST_SESSION_EXPIRES;
const SESSION_TOKEN_HASH = sha256Hex(TEST_SESSION_TOKEN);

usePersonalDataKeys();

const storedUser = () => ({
  ...user,
  ...queries.users.userPersonalColumns(user),
});

function buildAdapter(
  storedApp: string,
): Required<
  Pick<
    Adapter,
    | 'createSession'
    | 'getSessionAndUser'
    | 'updateSession'
    | 'deleteSession'
    | 'linkAccount'
  >
> {
  return {
    createSession: vi.fn(async (session) => session),
    linkAccount: vi.fn(async () => undefined),
    getSessionAndUser: vi.fn(async (sessionToken) => ({
      session: { sessionToken, userId: user.id, expires, app: storedApp },
      user: storedUser(),
    })),
    updateSession: vi.fn(async (session) => ({
      userId: user.id,
      expires,
      ...session,
    })),
    deleteSession: vi.fn(async () => {}),
  };
}

describe(scopeAdapterToApp, () => {
  it('stores each new session under its token hash, stamped with the app', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.createSession?.({
      sessionToken: TEST_SESSION_TOKEN,
      userId: user.id,
      expires,
    });

    expect(adapter.createSession).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN_HASH,
      userId: user.id,
      expires,
      app: AUTH_APP.PLATFORM,
    });
  });

  it('hands the raw token back for the session cookie', async () => {
    const scoped = scopeAdapterToApp(
      buildAdapter(AUTH_APP.PLATFORM),
      AUTH_APP.PLATFORM,
    );

    const created = await scoped.createSession?.({
      sessionToken: TEST_SESSION_TOKEN,
      userId: user.id,
      expires,
    });

    expect(created?.sessionToken).toBe(TEST_SESSION_TOKEN);
  });

  it('looks a session up by the hash of the cookie token', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.getSessionAndUser?.(TEST_SESSION_TOKEN);

    expect(adapter.getSessionAndUser).toHaveBeenCalledWith(SESSION_TOKEN_HASH);
  });

  it('extends a session by the hash of the cookie token', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.updateSession?.({ sessionToken: TEST_SESSION_TOKEN, expires });

    expect(adapter.updateSession).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN_HASH,
      expires,
    });
  });

  it('returns a session the app issued', async () => {
    const scoped = scopeAdapterToApp(
      buildAdapter(AUTH_APP.PLATFORM),
      AUTH_APP.PLATFORM,
    );

    const found = await scoped.getSessionAndUser?.(TEST_SESSION_TOKEN);

    expect(found?.user).toMatchObject(user);
  });

  it('reads a session another app issued as no session', async () => {
    const scoped = scopeAdapterToApp(
      buildAdapter(AUTH_APP.SITE),
      AUTH_APP.PLATFORM,
    );

    const found = await scoped.getSessionAndUser?.(TEST_SESSION_TOKEN);

    expect(found).toBeNull();
  });

  it('deletes a session the app issued by its token hash', async () => {
    const adapter = buildAdapter(AUTH_APP.PLATFORM);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.deleteSession?.(TEST_SESSION_TOKEN);

    expect(adapter.deleteSession).toHaveBeenCalledWith(SESSION_TOKEN_HASH);
  });

  it('leaves a session another app issued in place', async () => {
    const adapter = buildAdapter(AUTH_APP.SITE);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);

    await scoped.deleteSession?.(TEST_SESSION_TOKEN);

    expect(adapter.deleteSession).not.toHaveBeenCalled();
  });

  it('links a provider account without its tokens', async () => {
    const adapter = buildAdapter(AUTH_APP.SITE);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.SITE);
    const account: AdapterAccount = {
      userId: user.id,
      type: 'oidc',
      provider: TEST_PROVIDER,
      providerAccountId: TEST_PROVIDER_ACCOUNT_ID,
      token_type: 'bearer',
      scope: 'read:user',
    };

    await scoped.linkAccount?.({
      ...account,
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      id_token: 'id-token',
    });

    expect(adapter.linkAccount).toHaveBeenCalledWith(account);
  });
});
