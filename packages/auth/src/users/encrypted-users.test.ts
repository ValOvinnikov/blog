import {
  MOCK_EMAIL,
  MOCK_PROVIDER,
  MOCK_PROVIDER_ACCOUNT_ID,
  MOCK_SESSION_TOKEN,
  MOCK_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import {
  mockAccountEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { withEncryptedUsers } from './encrypted-users';

const { findUserByEmailMock } = vi.hoisted(() => ({
  findUserByEmailMock: vi.fn(),
}));

vi.mock('@blog/db', async (importActual) => {
  const actual = await importActual<typeof import('@blog/db')>();
  return {
    ...actual,
    queries: {
      ...actual.queries,
      users: {
        ...actual.queries.users,
        findUserByEmail: findUserByEmailMock,
      },
    },
  };
});

usePersonalDataKeys();

const MOCK_NAME = 'Ada Reader';
const MOCK_CHANGED_EMAIL = 'renamed-reader@example.com';
const MOCK_PLAIN_EMAIL = 'plain-reader@example.com';
const MOCK_PLAIN_NAME = 'Plain Name';

const signedUpUser = (): AdapterUser => ({
  id: MOCK_USER_ID,
  email: MOCK_EMAIL,
  name: MOCK_NAME,
  emailVerified: null,
});

const storedUser = (): TUser & AdapterUser => ({
  id: MOCK_USER_ID,
  email: MOCK_PLAIN_EMAIL,
  name: MOCK_PLAIN_NAME,
  emailVerified: null,
  image: null,
  termsAcceptedAt: null,
  termsVersion: null,
  emailEncrypted: null,
  nameEncrypted: null,
  emailIndex: null,
  ...queries.users.userPersonalColumns({ email: MOCK_EMAIL, name: MOCK_NAME }),
});

const unbackfilledUser = (): TUser & AdapterUser => ({
  ...storedUser(),
  emailEncrypted: null,
  nameEncrypted: null,
  emailIndex: null,
});

const PERSONAL_COLUMNS = ['emailEncrypted', 'emailIndex', 'nameEncrypted'];

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

const decrypted = { email: MOCK_EMAIL, name: MOCK_NAME };

describe(withEncryptedUsers, () => {
  let adapter: ReturnType<typeof buildAdapter>;
  let encryptedAdapter: ReturnType<typeof withEncryptedUsers>;

  beforeEach(() => {
    adapter = buildAdapter();
    encryptedAdapter = withEncryptedUsers(adapter);
  });

  it('writes a new user with the encrypted email, its index and the encrypted name', async () => {
    await encryptedAdapter.createUser?.(signedUpUser());

    const [created] = adapter.createUser.mock.calls[0] ?? [];
    const { email, name, emailIndex, emailEncrypted, nameEncrypted } =
      created as TUser;
    expect(email).toBe(MOCK_EMAIL);
    expect(name).toBe(MOCK_NAME);
    expect(emailIndex).toBe(mockAccountEmailIndex(MOCK_EMAIL));
    expect(emailEncrypted).not.toContain(MOCK_EMAIL);
    expect(nameEncrypted).not.toContain(MOCK_NAME);
  });

  it('returns the created user with the email and name read from the encrypted columns', async () => {
    const created = await encryptedAdapter.createUser?.(signedUpUser());

    expect(created).toMatchObject(decrypted);
  });

  it('encrypts a changed email and name on update', async () => {
    const updated = await encryptedAdapter.updateUser?.({
      id: MOCK_USER_ID,
      email: MOCK_CHANGED_EMAIL,
      name: null,
    });

    const [changes] = adapter.updateUser.mock.calls[0] ?? [];
    const { emailIndex, nameEncrypted } = changes as TUser;
    expect(emailIndex).toBe(mockAccountEmailIndex(MOCK_CHANGED_EMAIL));
    expect(nameEncrypted).toBeNull();
    expect(updated).toMatchObject({ email: MOCK_CHANGED_EMAIL, name: null });
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

  it('reads a user found by email from the encrypted columns', async () => {
    findUserByEmailMock.mockResolvedValue(storedUser());

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(findUserByEmailMock).toHaveBeenCalledWith(MOCK_EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(user).toMatchObject(decrypted);
  });

  it('finds no user when no address matches', async () => {
    findUserByEmailMock.mockResolvedValue(undefined);

    await expect(
      encryptedAdapter.getUserByEmail?.(MOCK_EMAIL),
    ).resolves.toBeNull();
  });

  it('signs in a user not yet backfilled, read from the plain columns', async () => {
    findUserByEmailMock.mockResolvedValue(unbackfilledUser());

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_PLAIN_EMAIL);

    expect(user).toMatchObject({
      email: MOCK_PLAIN_EMAIL,
      name: MOCK_PLAIN_NAME,
    });
  });

  it('keeps the session of a user not yet backfilled', async () => {
    adapter.getSessionAndUser.mockResolvedValue({
      session: {
        sessionToken: MOCK_SESSION_TOKEN,
        userId: MOCK_USER_ID,
        expires: new Date(),
      },
      user: unbackfilledUser(),
    });

    const found =
      await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

    expect(found?.user).toMatchObject({
      email: MOCK_PLAIN_EMAIL,
      name: MOCK_PLAIN_NAME,
    });
  });

  it.each(PERSONAL_COLUMNS)(
    'returns the user to Auth.js without %s',
    async (column) => {
      const created = await encryptedAdapter.createUser?.(signedUpUser());
      const found =
        await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(created).not.toHaveProperty(column);
      expect(found?.user).not.toHaveProperty(column);
    },
  );

  describe('with no personal data keys configured', () => {
    beforeEach(() => {
      vi.stubEnv('PERSONAL_DATA_ENCRYPTION_KEY', undefined);
      vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);
    });

    it('creates a user with only the plain email and name', async () => {
      const created = await encryptedAdapter.createUser?.(signedUpUser());

      const [written] = adapter.createUser.mock.calls[0] ?? [];
      const { emailEncrypted, emailIndex, nameEncrypted } = written as TUser;
      expect([emailEncrypted, emailIndex, nameEncrypted]).toEqual([
        null,
        null,
        null,
      ]);
      expect(created).toMatchObject(decrypted);
    });

    it("reads a backfilled user's session from the plain columns", async () => {
      const found =
        await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(found?.user).toMatchObject({
        email: MOCK_PLAIN_EMAIL,
        name: MOCK_PLAIN_NAME,
      });
    });
  });
});
