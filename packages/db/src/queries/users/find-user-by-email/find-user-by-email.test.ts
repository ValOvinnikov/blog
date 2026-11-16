import * as schema from '@shinefold/db/schema';
import {
  MOCK_USER_EMAIL,
  insertTestReader,
} from '@shinefold/db/testing/fixtures';
import { taggedMixedCaseAddress } from '@shinefold/db/testing/personal-data-rows';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { findUserByEmail } from './find-user-by-email';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(findUserByEmail, () => {
  it('finds a user by any casing of the address', async () => {
    const user = await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(
      findUserByEmail(MOCK_USER_EMAIL.toUpperCase()),
    ).resolves.toEqual(user);
  });

  it('picks the user whose own address matches over a +tag sibling', async () => {
    await insertTestReader(db(), MOCK_TAGGED_USER_EMAIL);
    const user = await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toEqual(user);
  });

  it('never finds the account of an address for a +tag variant of it', async () => {
    await insertTestReader(db(), MOCK_USER_EMAIL);

    await expect(
      findUserByEmail(MOCK_TAGGED_USER_EMAIL),
    ).resolves.toBeUndefined();
  });

  it('finds no user when no address matches', async () => {
    await expect(findUserByEmail(MOCK_USER_EMAIL)).resolves.toBeUndefined();
  });
});
