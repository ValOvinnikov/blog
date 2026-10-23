import {
  MOCK_PROVIDER,
  MOCK_PROVIDER_ACCOUNT_ID,
  MOCK_SESSION_TOKEN,
  MOCK_USER_ID,
} from '@blog/auth/testing/session-fixtures';
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

const EMAIL = 'encrypted-reader@example.com';
const NAME = 'Ada Reader';
const CHANGED_EMAIL = 'renamed-reader@example.com';
const PLAIN_EMAIL = 'plain-reader@example.com';
const PLAIN_NAME = 'Plain Name';

const signedUpUser = (): AdapterUser => ({
  id: MOCK_USER_ID,
  email: EMAIL,
  name: NAME,
  emailVerified: null,
});

const storedUser = (): TUser & AdapterUser => ({
  id: MOCK_USER_ID,
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
      session: { sessionToken, userId: MOCK_USER_ID, expires: new Date() },
      user: stored,
    })),
  } satisfies Adapter;
}

const decrypted = { email: EMAIL, name: NAME };

describe(withEncryptedUsers, () => {
  let adapter: ReturnType<typeof buildAdapter>;
  let encryptedAdapter: ReturnType<typeof withEncryptedUsers>;

  beforeEach(() => {
    adapter = buildAdapter();
    encryptedAdapter = withEncryptedUsers(adapter);
  });

  it('writes a new user with the encrypted email, its index and the encrypted name', async () => {
    await encryptedAdapter.createUser?.(signedUpUser());

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
    const created = await encryptedAdapter.createUser?.(signedUpUser());

    expect(created).toMatchObject(decrypted);
  });

  it('encrypts a changed email and name on update', async () => {
    const updated = await encryptedAdapter.updateUser?.({
      id: MOCK_USER_ID,
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
    const emailVerified = new Date();

    await encryptedAdapter.updateUser?.({
      id: MOCK_USER_ID,
      emailVerified,
    });

    expect(adapter.updateUser).toHaveBeenCalledWith({
      id: MOCK_USER_ID,
      emailVerified,
    });
  });

  it('reads a user by id from the encrypted columns', async () => {
    const user = await encryptedAdapter.getUser?.(MOCK_USER_ID);

    expect(user).toMatchObject(decrypted);
  });

  it('reads a user by provider account from the encrypted columns', async () => {
    const user = await encryptedAdapter.getUserByAccount?.({
      provider: MOCK_PROVIDER,
      providerAccountId: MOCK_PROVIDER_ACCOUNT_ID,
    });

    expect(user).toMatchObject(decrypted);
  });

  it("reads the session's user from the encrypted columns", async () => {
    const found =
      await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

    expect(found?.user).toMatchObject(decrypted);
  });

  it('looks a user up by email index, never through the plain column', async () => {
    getUserByEmailIndexMock.mockResolvedValue(storedUser());

    const user = await encryptedAdapter.getUserByEmail?.(EMAIL);

    expect(getUserByEmailIndexMock).toHaveBeenCalledWith(EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(user).toMatchObject(decrypted);
  });

  it('finds no user when no index matches', async () => {
    getUserByEmailIndexMock.mockResolvedValue(undefined);

    const user = await encryptedAdapter.getUserByEmail?.(EMAIL);

    expect(user).toBeNull();
  });

  it('refuses a user the adapter returns without its encrypted columns', async () => {
    const adapter = { getUser: vi.fn(async () => signedUpUser()) };

    await expect(
      withEncryptedUsers(adapter).getUser?.(MOCK_USER_ID),
    ).rejects.toThrow();
  });
});
