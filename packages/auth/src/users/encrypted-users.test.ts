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
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { withEncryptedUsers } from './encrypted-users';

const { getUsersByEmailIndexMock } = vi.hoisted(() => ({
  getUsersByEmailIndexMock: vi.fn(),
}));

vi.mock('@blog/db', async (importActual) => {
  const actual = await importActual<typeof import('@blog/db')>();
  return {
    ...actual,
    queries: {
      ...actual.queries,
      users: {
        ...actual.queries.users,
        getUsersByEmailIndex: getUsersByEmailIndexMock,
      },
    },
  };
});

usePersonalDataKeys();

const MOCK_NAME = 'Ada Reader';
const MOCK_CHANGED_EMAIL = 'renamed-reader@example.com';
const MOCK_PLAIN_EMAIL = 'plain-reader@example.com';
const MOCK_PLAIN_NAME = 'Plain Name';
const MOCK_TAGGED_EMAIL = taggedMixedCaseAddress(MOCK_EMAIL);

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

const MOCK_EXACT_USER_ID = 'exact-user';
const MOCK_OTHER_USER_ID = 'other-user';

const taggedUser = (): TUser & AdapterUser => ({
  ...storedUser(),
  id: MOCK_OTHER_USER_ID,
  ...queries.users.userPersonalColumns({
    email: MOCK_TAGGED_EMAIL.trim().toLowerCase(),
    name: MOCK_NAME,
  }),
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

  it('looks a user up by email index, never through the plain column', async () => {
    getUsersByEmailIndexMock.mockResolvedValue([storedUser()]);

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(getUsersByEmailIndexMock).toHaveBeenCalledWith(MOCK_EMAIL);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
    expect(user).toMatchObject(decrypted);
  });

  it.each([
    ['another casing of the address', MOCK_EMAIL.toUpperCase(), MOCK_EMAIL],
    ['a +tag variant of the stored address', MOCK_TAGGED_EMAIL, null],
  ])('resolves %s by email', async (_label, requested, expected) => {
    getUsersByEmailIndexMock.mockResolvedValue([storedUser()]);

    const user = await encryptedAdapter.getUserByEmail?.(requested);

    expect(user?.email ?? null).toBe(expected);
  });

  it('picks the candidate whose email is exactly the requested address', async () => {
    const exact = { ...storedUser(), id: MOCK_EXACT_USER_ID };
    getUsersByEmailIndexMock.mockResolvedValue([
      taggedUser(),
      exact,
      { ...storedUser(), id: MOCK_OTHER_USER_ID },
    ]);

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(user?.id).toBe(MOCK_EXACT_USER_ID);
  });

  it('finds no user when every candidate is a +tag variant', async () => {
    getUsersByEmailIndexMock.mockResolvedValue([taggedUser(), taggedUser()]);

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(user).toBeNull();
  });

  it('skips a candidate with no encrypted email instead of throwing', async () => {
    const unreadable = { ...storedUser(), emailEncrypted: null };
    getUsersByEmailIndexMock.mockResolvedValue([unreadable]);

    await expect(
      encryptedAdapter.getUserByEmail?.(MOCK_EMAIL),
    ).resolves.toBeNull();
  });

  it('still finds the exact candidate behind one with no encrypted email', async () => {
    const unreadable = { ...storedUser(), emailEncrypted: null };
    getUsersByEmailIndexMock.mockResolvedValue([unreadable, storedUser()]);

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(user).toMatchObject(decrypted);
  });

  it('finds no user when no index matches', async () => {
    getUsersByEmailIndexMock.mockResolvedValue([]);

    const user = await encryptedAdapter.getUserByEmail?.(MOCK_EMAIL);

    expect(user).toBeNull();
  });

  it('refuses a user the adapter returns without its encrypted columns', async () => {
    const adapter = { getUser: vi.fn(async () => signedUpUser()) };

    await expect(
      withEncryptedUsers(adapter).getUser?.(MOCK_USER_ID),
    ).rejects.toThrow();
  });
});
