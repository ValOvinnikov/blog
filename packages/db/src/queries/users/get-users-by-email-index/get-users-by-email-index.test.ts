import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import { mockAccountEmailIndex } from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getUsersByEmailIndex } from './get-users-by-email-index';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUsersByEmailIndex, () => {
  it('finds the user whose index matches any casing of the address', async () => {
    const user = await insertTestUser(db(), {
      emailIndex: mockAccountEmailIndex(MOCK_USER_EMAIL),
    });

    await expect(
      getUsersByEmailIndex(MOCK_USER_EMAIL.toUpperCase()),
    ).resolves.toEqual([user]);
  });

  it.each([
    {
      title: 'finds the account of a +tag address by that exact address',
      indexedEmail: MOCK_TAGGED_USER_EMAIL,
      requestedEmail: MOCK_TAGGED_USER_EMAIL,
      found: true,
    },
    {
      title: 'never finds the account of an address for a +tag variant of it',
      indexedEmail: MOCK_USER_EMAIL,
      requestedEmail: MOCK_TAGGED_USER_EMAIL,
      found: false,
    },
  ])('$title', async ({ indexedEmail, requestedEmail, found }) => {
    const user = await insertTestUser(db(), {
      emailIndex: mockAccountEmailIndex(indexedEmail),
    });

    await expect(getUsersByEmailIndex(requestedEmail)).resolves.toEqual(
      found ? [user] : [],
    );
  });

  it('returns nothing when no user has that index', async () => {
    await insertTestUser(db());

    await expect(getUsersByEmailIndex(MOCK_USER_EMAIL)).resolves.toEqual([]);
  });

  it('never holds two users under one address', async () => {
    const emailIndex = mockAccountEmailIndex(MOCK_USER_EMAIL);
    await insertTestUser(db(), { emailIndex });

    await expect(insertTestUser(db(), { emailIndex })).rejects.toThrow();
  });
});
