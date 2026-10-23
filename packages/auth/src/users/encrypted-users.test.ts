import {
  TEST_PROVIDER,
  TEST_PROVIDER_ACCOUNT_ID,
  TEST_SESSION_TOKEN,
  TEST_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import type { TNullable } from '@blog/config/types';
import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import {
  testAccountEmailIndex,
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

const EMAIL = 'encrypted-reader@example.com';
const NAME = 'Ada Reader';
const CHANGED_EMAIL = 'renamed-reader@example.com';
const PLAIN_EMAIL = 'plain-reader@example.com';
const PLAIN_NAME = 'Plain Name';
const TAGGED_EMAIL = 'encrypted-reader+x@example.com';

const signedUpUser = (): AdapterUser => ({
  id: TEST_USER_ID,
  email: EMAIL,
  name: NAME,
  emailVerified: null,
});

const storedUser = (): TUser & AdapterUser => ({
  id: TEST_USER_ID,
  email: PLAIN_EMAIL,
  name: PLAIN_NAME,
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
      session: { sessionToken, userId: TEST_USER_ID, expires: new Date() },
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
        emailIndex: testAccountEmailIndex(EMAIL),
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
      id: TEST_USER_ID,
      email: CHANGED_EMAIL,
      name: null,
    });

    expect(adapter.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        emailIndex: testAccountEmailIndex(CHANGED_EMAIL),
        nameEncrypted: null,
      }),
    );
    expect(updated).toMatchObject({ email: CHANGED_EMAIL, name: null });
  });

  it('leaves the encrypted columns alone when an update sets neither email nor name', async () => {
    const adapter = buildAdapter();
    const emailVerified = new Date();

    await withEncryptedUsers(adapter).updateUser?.({
      id: TEST_USER_ID,
      emailVerified,
    });

    expect(adapter.updateUser).toHaveBeenCalledWith({
      id: TEST_USER_ID,
      emailVerified,
    });
  });

  it.each<[string, (adapter: Adapter) => Promise<TNullable<AdapterUser>>]>([
    ['by id', async (adapter) => adapter.getUser?.(TEST_USER_ID)],
    [
      'by provider account',
      async (adapter) =>
        adapter.getUserByAccount?.({
          provider: TEST_PROVIDER,
          providerAccountId: TEST_PROVIDER_ACCOUNT_ID,
        }),
    ],
    [
      'for a session',
      async (adapter) =>
        (await adapter.getSessionAndUser?.(TEST_SESSION_TOKEN))?.user,
    ],
  ])('reads a user %s from the encrypted columns', async (_label, read) => {
    const user = await read(withEncryptedUsers(buildAdapter()));

    expect(user).toMatchObject(decrypted);
  });

  it('looks a user up by email index, never through the plain column', async () => {
    const adapter = buildAdapter();
    getUserByEmailIndexMock.mockResolvedValue(storedUser());

    const user = await withEncryptedUsers(adapter).getUserByEmail?.(EMAIL);

    expect(getUserByEmailIndexMock).toHaveBeenCalledWith(EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(user).toMatchObject(decrypted);
  });

  it.each([
    ['another casing of the address', EMAIL.toUpperCase(), EMAIL],
    ['a +tag variant of the stored address', TAGGED_EMAIL, null],
  ])('resolves %s by email', async (_label, requested, expected) => {
    getUserByEmailIndexMock.mockResolvedValue(storedUser());

    const user =
      await withEncryptedUsers(buildAdapter()).getUserByEmail?.(requested);

    expect(user?.email ?? null).toBe(expected);
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
      withEncryptedUsers(adapter).getUser?.(TEST_USER_ID),
    ).rejects.toThrow();
  });
});
