import {
  MOCK_EMAIL,
  MOCK_PROVIDER,
  MOCK_PROVIDER_ACCOUNT_ID,
  MOCK_SESSION_EXPIRES,
  MOCK_SESSION_TOKEN,
  MOCK_USER_ID,
} from '@blog/auth/testing/session-fixtures';
import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import {
  mockAccountEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { faker } from '@faker-js/faker';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { withEncryptedUsers } from './encrypted-users';

faker.seed(6027);

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

const MOCK_NAME = faker.person.fullName();
const MOCK_CHANGED_EMAIL = faker.internet.exampleEmail();
const MOCK_PLAIN_EMAIL = faker.internet.exampleEmail();
const MOCK_PLAIN_NAME = faker.person.fullName();
const MOCK_PERSONAL_DATA = { email: MOCK_EMAIL, name: MOCK_NAME };
const MOCK_PLAIN_PERSONAL_DATA = {
  email: MOCK_PLAIN_EMAIL,
  name: MOCK_PLAIN_NAME,
};
const PERSONAL_COLUMNS = ['emailEncrypted', 'emailIndex', 'nameEncrypted'];

const mockSignedUpUser = (): AdapterUser => ({
  id: MOCK_USER_ID,
  ...MOCK_PERSONAL_DATA,
  emailVerified: null,
});

const mockUnbackfilledUser = (): TUser & AdapterUser => ({
  id: MOCK_USER_ID,
  ...MOCK_PLAIN_PERSONAL_DATA,
  emailVerified: null,
  image: null,
  termsAcceptedAt: null,
  termsVersion: null,
  emailEncrypted: null,
  nameEncrypted: null,
  emailIndex: null,
});

const mockStoredUser = (): TUser & AdapterUser => ({
  ...mockUnbackfilledUser(),
  ...queries.users.userPersonalColumns(MOCK_PERSONAL_DATA),
});

const mockSession = () => ({
  sessionToken: MOCK_SESSION_TOKEN,
  userId: MOCK_USER_ID,
  expires: MOCK_SESSION_EXPIRES,
});

const personalDataOf = (user: Partial<AdapterUser> | null | undefined) => ({
  email: user?.email,
  name: user?.name,
});

function buildAdapter() {
  const stored = mockStoredUser();

  return {
    createUser: vi.fn(async (user: AdapterUser) => user),
    updateUser: vi.fn(async (user) => ({ ...stored, ...user })),
    getUser: vi.fn(async () => stored),
    getUserByEmail: vi.fn(async () => stored),
    getUserByAccount: vi.fn(async () => stored),
    getSessionAndUser: vi.fn(async () => ({
      session: mockSession(),
      user: stored,
    })),
  } satisfies Adapter;
}

describe(withEncryptedUsers, () => {
  let adapter: ReturnType<typeof buildAdapter>;
  let encryptedAdapter: ReturnType<typeof withEncryptedUsers>;

  beforeEach(() => {
    adapter = buildAdapter();
    encryptedAdapter = withEncryptedUsers(adapter);
  });

  it('writes a new user with the encrypted email, its index and the encrypted name', async () => {
    await encryptedAdapter.createUser?.(mockSignedUpUser());

    const [created] = adapter.createUser.mock.calls[0] ?? [];
    const { email, name, emailIndex, emailEncrypted, nameEncrypted } =
      created as TUser;
    expect({ email, name }).toEqual(MOCK_PERSONAL_DATA);
    expect(emailIndex).toBe(mockAccountEmailIndex(MOCK_EMAIL));
    expect(emailEncrypted).not.toContain(MOCK_EMAIL);
    expect(nameEncrypted).not.toContain(MOCK_NAME);
  });

  it('returns the created user read from the encrypted columns', async () => {
    const created = await encryptedAdapter.createUser?.(mockSignedUpUser());

    expect(personalDataOf(created)).toEqual(MOCK_PERSONAL_DATA);
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
    expect(personalDataOf(updated)).toEqual({
      email: MOCK_CHANGED_EMAIL,
      name: null,
    });
  });

  it('leaves the encrypted columns alone when an update sets neither field', async () => {
    const changes = { id: MOCK_USER_ID, emailVerified: faker.date.past() };

    await encryptedAdapter.updateUser?.(changes);

    expect(adapter.updateUser).toHaveBeenCalledWith(changes);
  });

  it.each([
    ['by id', () => encryptedAdapter.getUser?.(MOCK_USER_ID)],
    [
      'by provider account',
      () =>
        encryptedAdapter.getUserByAccount?.({
          provider: MOCK_PROVIDER,
          providerAccountId: MOCK_PROVIDER_ACCOUNT_ID,
        }),
    ],
    [
      'for a session',
      async () =>
        (await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN))?.user,
    ],
  ])('reads a user %s from the encrypted columns', async (_, readUser) => {
    const user = await readUser();

    expect(personalDataOf(user)).toEqual(MOCK_PERSONAL_DATA);
  });

  it('reads a user found by email from the encrypted columns', async () => {
    findUserByEmailMock.mockResolvedValue(mockStoredUser());

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(findUserByEmailMock).toHaveBeenCalledWith(MOCK_EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(personalDataOf(user)).toEqual(MOCK_PERSONAL_DATA);
  });

  it('finds no user when no address matches', async () => {
    findUserByEmailMock.mockResolvedValue(undefined);

    await expect(
      encryptedAdapter.getUserByEmail?.(MOCK_EMAIL),
    ).resolves.toBeNull();
  });

  it('signs in a user not yet backfilled, read from the plain columns', async () => {
    findUserByEmailMock.mockResolvedValue(mockUnbackfilledUser());

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_PLAIN_EMAIL);

    expect(personalDataOf(user)).toEqual(MOCK_PLAIN_PERSONAL_DATA);
  });

  it('keeps the session of a user not yet backfilled', async () => {
    adapter.getSessionAndUser.mockResolvedValue({
      session: mockSession(),
      user: mockUnbackfilledUser(),
    });

    const found =
      await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

    expect(personalDataOf(found?.user)).toEqual(MOCK_PLAIN_PERSONAL_DATA);
  });

  it.each(PERSONAL_COLUMNS)(
    'returns the user to Auth.js without %s',
    async (column) => {
      const created = await encryptedAdapter.createUser?.(mockSignedUpUser());
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
      const created = await encryptedAdapter.createUser?.(mockSignedUpUser());

      const [written] = adapter.createUser.mock.calls[0] ?? [];
      const { emailEncrypted, emailIndex, nameEncrypted } = written as TUser;
      expect([emailEncrypted, emailIndex, nameEncrypted]).toEqual([
        null,
        null,
        null,
      ]);
      expect(personalDataOf(created)).toEqual(MOCK_PERSONAL_DATA);
    });

    it("reads a backfilled user's session from the plain columns", async () => {
      const found =
        await encryptedAdapter.getSessionAndUser?.(MOCK_SESSION_TOKEN);

      expect(personalDataOf(found?.user)).toEqual(MOCK_PLAIN_PERSONAL_DATA);
    });
  });
});
