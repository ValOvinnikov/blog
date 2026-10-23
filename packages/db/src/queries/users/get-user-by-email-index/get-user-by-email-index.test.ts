import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import {
  testAccountEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getUserByEmailIndex } from './get-user-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmailIndex, () => {
  it('finds the user whose index matches any casing of the address', async () => {
    const user = await insertTestUser(db(), {
      emailIndex: testAccountEmailIndex(MOCK_USER_EMAIL),
    });

    await expect(
      getUserByEmailIndex(MOCK_USER_EMAIL.toUpperCase()),
    ).resolves.toEqual(user);
  });

  it('returns undefined when no user has that index', async () => {
    await insertTestUser(db(), { email: MOCK_USER_EMAIL });

    await expect(getUserByEmailIndex(MOCK_USER_EMAIL)).resolves.toBeUndefined();
  });

  it('never finds the account of an address for a +tag variant of it', async () => {
    await insertTestUser(db(), {
      emailIndex: testAccountEmailIndex(MOCK_USER_EMAIL),
    });

    await expect(
      getUserByEmailIndex(TAGGED_USER_EMAIL),
    ).resolves.toBeUndefined();
  });
});
