import { TEST_SESSION_TOKEN } from '@blog/auth/testing/session-fixtures';
import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { withEncryptedUsers } from './encrypted-users';

const { getUserByEmailIndexMock } = vi.hoisted(() => ({
  getUserByEmailIndexMock: vi.fn(),
}));

vi.mock('@blog/db', async (importActual) => {
  const actual = await importActual<typeof import('@blog/db')>();
  return {
    ...actual,
    queries: {
      ...actual.queries,
      users: {
        ...actual.queries.users,
        getUserByEmailIndex: getUserByEmailIndexMock,
      },
    },
  };
});

usePersonalDataKeys();

const USER_ID = 'user-1';
const EMAIL = 'reader@example.com';
const NAME = 'Ada Reader';
const CHANGED_EMAIL = 'renamed@example.com';
const STALE_EMAIL = 'stale@example.com';
const STALE_NAME = 'Stale Name';

const signedUpUser = (): AdapterUser => ({
  id: USER_ID,
  email: EMAIL,
  name: NAME,
  emailVerified: null,
});

const storedUser = (): TUser & AdapterUser => ({
  id: USER_ID,
  email: STALE_EMAIL,
  name: STALE_NAME,
  emailVerified: null,
  image: null,
  termsAcceptedAt: null,
  termsVersion: null,
  emailEncrypted: null,
  nameEncrypted: null,
  emailIndex: null,
  ...queries.users.userPersonalColumns({ email: EMAIL, name: NAME }),
});

const echoUser = async (user: AdapterUser) => user;

function buildAdapter() {
  const stored = storedUser();

  return {
    createUser: vi.fn(echoUser),
    updateUser: vi.fn(async (user) => ({ ...stored, ...user })),
    getUser: vi.fn(async () => stored),
    getUserByEmail: vi.fn(async () => stored),
    getUserByAccount: vi.fn(async () => stored),
    getSessionAndUser: vi.fn(async (sessionToken: string) => ({
      session: { sessionToken, userId: USER_ID, expires: new Date() },
      user: stored,
    })),
  } satisfies Adapter;
}

const decrypted = { email: EMAIL, name: NAME };

describe(withEncryptedUsers, () => {
  it('writes a new user with the encrypted email, its index and the encrypted name', async () => {
    const adapter = buildAdapter();

    await withEncryptedUsers(adapter).createUser?.(signedUpUser());

    expect(adapter.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: EMAIL,
        name: NAME,
        emailIndex: testPersonalEmailIndex(EMAIL),
        emailEncrypted: expect.not.stringContaining(EMAIL),
        nameEncrypted: expect.not.stringContaining(NAME),
      }),
    );
  });

  it('returns the created user with the email and name read from the encrypted columns', async () => {
    const created =
      await withEncryptedUsers(buildAdapter()).createUser?.(signedUpUser());

    expect(created).toMatchObject(decrypted);
  });

  it('encrypts a changed email and name on update', async () => {
    const adapter = buildAdapter();

    const updated = await withEncryptedUsers(adapter).updateUser?.({
      id: USER_ID,
      email: CHANGED_EMAIL,
      name: null,
    });

    expect(adapter.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        emailIndex: testPersonalEmailIndex(CHANGED_EMAIL),
        nameEncrypted: null,
      }),
    );
    expect(updated).toMatchObject({ email: CHANGED_EMAIL, name: null });
  });

  it('leaves the encrypted columns alone when an update sets neither email nor name', async () => {
    const adapter = buildAdapter();
    const emailVerified = new Date();

    await withEncryptedUsers(adapter).updateUser?.({
      id: USER_ID,
      emailVerified,
    });

    expect(adapter.updateUser).toHaveBeenCalledWith({
      id: USER_ID,
      emailVerified,
    });
  });

  it('reads a user by id from the encrypted columns', async () => {
    const user = await withEncryptedUsers(buildAdapter()).getUser?.(USER_ID);

    expect(user).toMatchObject(decrypted);
  });

  it('reads a user by provider account from the encrypted columns', async () => {
    const user = await withEncryptedUsers(buildAdapter()).getUserByAccount?.({
      provider: 'github',
      providerAccountId: 'provider-account-1',
    });

    expect(user).toMatchObject(decrypted);
  });

  it("reads the session's user from the encrypted columns", async () => {
    const found =
      await withEncryptedUsers(buildAdapter()).getSessionAndUser?.(
        TEST_SESSION_TOKEN,
      );

    expect(found?.user).toMatchObject(decrypted);
  });

  it('looks a user up by email index, never through the plain column', async () => {
    const adapter = buildAdapter();
    getUserByEmailIndexMock.mockResolvedValue(storedUser());

    const user = await withEncryptedUsers(adapter).getUserByEmail?.(EMAIL);

    expect(getUserByEmailIndexMock).toHaveBeenCalledWith(EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(user).toMatchObject(decrypted);
  });

  it('finds no user when no index matches', async () => {
    getUserByEmailIndexMock.mockResolvedValue(undefined);

    const user =
      await withEncryptedUsers(buildAdapter()).getUserByEmail?.(EMAIL);

    expect(user).toBeNull();
  });

  it('refuses a user the adapter returns without its encrypted columns', async () => {
    const adapter = { getUser: vi.fn(async () => signedUpUser()) };

    await expect(
      withEncryptedUsers(adapter).getUser?.(USER_ID),
    ).rejects.toThrow();
  });
});
