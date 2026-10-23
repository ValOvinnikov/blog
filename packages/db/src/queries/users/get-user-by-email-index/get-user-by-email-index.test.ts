import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getUserByEmailIndex } from './get-user-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmailIndex, () => {
  it('finds the user whose index matches any spelling of the address', async () => {
    const user = await insertTestUser(db(), {
      emailIndex: testPersonalEmailIndex(MOCK_USER_EMAIL),
    });

    await expect(
      getUserByEmailIndex(MOCK_USER_EMAIL.toUpperCase()),
    ).resolves.toEqual(user);
  });

  it('returns undefined when no user has that index', async () => {
    await insertTestUser(db(), { email: MOCK_USER_EMAIL });

    await expect(getUserByEmailIndex(MOCK_USER_EMAIL)).resolves.toBeUndefined();
  });
});
