import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  testAccountEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getUserByEmailIndex } from './get-user-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const EMAIL = faker.internet.email().toLowerCase();
const TAGGED_EMAIL = taggedMixedCaseAddress(EMAIL);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmailIndex, () => {
  it('finds the user whose index matches any casing of the address', async () => {
    const user = await insertTestUser(db(), {
      emailIndex: testAccountEmailIndex(EMAIL),
    });

    await expect(getUserByEmailIndex(EMAIL.toUpperCase())).resolves.toEqual(
      user,
    );
  });

  it('never finds the account of an address for a +tag variant of it', async () => {
    await insertTestUser(db(), { emailIndex: testAccountEmailIndex(EMAIL) });

    await expect(getUserByEmailIndex(TAGGED_EMAIL)).resolves.toBeUndefined();
  });
});
