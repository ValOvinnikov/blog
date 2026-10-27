import {
  MOCK_EMAIL,
  MOCK_PROVIDER,
  MOCK_PROVIDER_ACCOUNT_ID,
  MOCK_SESSION_EXPIRES,
  MOCK_SESSION_TOKEN,
  MOCK_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import { AUTH_APP, type TAuthApp } from '@blog/config/constants';
import { queries } from '@blog/db';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { sha256Hex } from '@blog/utils/hash';
import { faker } from '@faker-js/faker';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';

import { scopeAdapterToApp } from './app-scoped-adapter';

faker.seed(6027);

const MOCK_USER = {
  id: MOCK_USER_ID,
  email: MOCK_EMAIL,
  name: null,
  emailVerified: null,
};
const SESSION_TOKEN_HASH = sha256Hex(MOCK_SESSION_TOKEN);

usePersonalDataKeys();

const mockNewSession = () => ({
  sessionToken: MOCK_SESSION_TOKEN,
  userId: MOCK_USER_ID,
  expires: MOCK_SESSION_EXPIRES,
});

function buildAdapter(
  storedApp: TAuthApp,
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
      session: {
        sessionToken,
        userId: MOCK_USER_ID,
        expires: MOCK_SESSION_EXPIRES,
        app: storedApp,
      },
      user: { ...MOCK_USER, ...queries.users.userPersonalColumns(MOCK_USER) },
    })),
    updateSession: vi.fn(async (session) => ({
      userId: MOCK_USER_ID,
      expires: MOCK_SESSION_EXPIRES,
      ...session,
    })),
    deleteSession: vi.fn(async () => {}),
  };
}

describe(scopeAdapterToApp, () => {
  describe('with a session the app issued', () => {
    let adapter: ReturnType<typeof buildAdapter>;
    let scoped: ReturnType<typeof scopeAdapterToApp>;

    beforeEach(() => {
      adapter = buildAdapter(AUTH_APP.PLATFORM);
      scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);
    });

    it('stores each new session under its token hash, stamped with the app', async () => {
      await scoped.createSession?.(mockNewSession());

      expect(adapter.createSession).toHaveBeenCalledWith({
        ...mockNewSession(),
        sessionToken: SESSION_TOKEN_HASH,
        app: AUTH_APP.PLATFORM,
      });
    });

    it('hands the raw token back for the session cookie', async () => {
      const created = await scoped.createSession?.(mockNewSession());

      expect(created?.sessionToken).toBe(MOCK_SESSION_TOKEN);
    });

    it('looks a session up by the hash of the cookie token', async () => {
      await scoped.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(adapter.getSessionAndUser).toHaveBeenCalledWith(
        SESSION_TOKEN_HASH,
      );
    });

    it('extends a session by the hash of the cookie token', async () => {
      await scoped.updateSession?.({
        sessionToken: MOCK_SESSION_TOKEN,
        expires: MOCK_SESSION_EXPIRES,
      });

      expect(adapter.updateSession).toHaveBeenCalledWith({
        sessionToken: SESSION_TOKEN_HASH,
        expires: MOCK_SESSION_EXPIRES,
      });
    });

    it('returns the user of a session the app issued', async () => {
      const found = await scoped.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(found?.user).toEqual(MOCK_USER);
    });

    it('deletes a session the app issued by its token hash', async () => {
      await scoped.deleteSession?.(MOCK_SESSION_TOKEN);

      expect(adapter.deleteSession).toHaveBeenCalledWith(SESSION_TOKEN_HASH);
    });
  });

  describe('with a session another app issued', () => {
    let adapter: ReturnType<typeof buildAdapter>;
    let scoped: ReturnType<typeof scopeAdapterToApp>;

    beforeEach(() => {
      adapter = buildAdapter(AUTH_APP.SITE);
      scoped = scopeAdapterToApp(adapter, AUTH_APP.PLATFORM);
    });

    it('reads a session another app issued as no session', async () => {
      const found = await scoped.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(found).toBeNull();
    });

    it('leaves a session another app issued in place', async () => {
      await scoped.deleteSession?.(MOCK_SESSION_TOKEN);

      expect(adapter.deleteSession).not.toHaveBeenCalled();
    });
  });

  it('links a provider account without its tokens', async () => {
    const adapter = buildAdapter(AUTH_APP.SITE);
    const scoped = scopeAdapterToApp(adapter, AUTH_APP.SITE);
    const account: AdapterAccount = {
      userId: MOCK_USER_ID,
      type: 'oidc',
      provider: MOCK_PROVIDER,
      providerAccountId: MOCK_PROVIDER_ACCOUNT_ID,
      token_type: 'bearer',
      scope: faker.lorem.word(),
    };

    await scoped.linkAccount?.({
      ...account,
      access_token: faker.string.alphanumeric(32),
      refresh_token: faker.string.alphanumeric(32),
      id_token: faker.string.alphanumeric(32),
    });

    expect(adapter.linkAccount).toHaveBeenCalledWith({
      ...account,
      access_token: undefined,
      refresh_token: undefined,
      id_token: undefined,
    });
  });
});
