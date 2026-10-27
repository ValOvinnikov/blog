import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { updateDisplayName } from './update-display-name';

vi.mock('@blog/db/client');

faker.seed(602204);

const MOCK_OLD_NAME = faker.person.fullName();
const MOCK_NEW_NAME = faker.person.fullName();
const MOCK_OTHER_USER_NAME = faker.person.fullName();
const MOCK_UNKNOWN_USER_ID = faker.string.uuid();

const db = useQueryTestDb();
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.users);
});

describe(updateDisplayName, () => {
  it('persists the new name', async () => {
    const user = await insertTestUser(db(), { name: MOCK_OLD_NAME });

    await updateDisplayName(user.id, MOCK_NEW_NAME);

    const [updated] = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id));
    expect(updated?.name).toBe(MOCK_NEW_NAME);
    expect(decryptTestPersonalValue(updated?.nameEncrypted ?? null)).toBe(
      MOCK_NEW_NAME,
    );
  });

  it("does not change another user's name", async () => {
    const user = await insertTestUser(db(), { name: MOCK_OLD_NAME });
    const otherUser = await insertTestUser(db(), {
      name: MOCK_OTHER_USER_NAME,
    });

    await updateDisplayName(user.id, MOCK_NEW_NAME);

    const [untouched] = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, otherUser.id));
    expect(untouched?.name).toBe(MOCK_OTHER_USER_NAME);
  });

  it('is a no-op for an unrecognized userId', async () => {
    await expect(
      updateDisplayName(MOCK_UNKNOWN_USER_ID, MOCK_NEW_NAME),
    ).resolves.toBeUndefined();
  });
});
