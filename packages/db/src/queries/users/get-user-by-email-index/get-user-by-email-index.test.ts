import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getUserByEmailIndex } from './get-user-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const EMAIL = faker.internet.email().toLowerCase();

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmailIndex, () => {
  it('finds the user whose index matches any spelling of the address', async () => {
    const user = await insertTestUser(db(), {
      emailIndex: testPersonalEmailIndex(EMAIL),
    });

    await expect(getUserByEmailIndex(EMAIL.toUpperCase())).resolves.toEqual(
      user,
    );
  });

  it('returns undefined when no user has that index', async () => {
    await insertTestUser(db(), { email: EMAIL });

    await expect(getUserByEmailIndex(EMAIL)).resolves.toBeUndefined();
  });
});
