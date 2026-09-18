import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { updateDisplayName } from './update-display-name';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.users);
});

describe(updateDisplayName, () => {
  it('persists the new name', async () => {
    const user = await insertTestUser(db(), { name: 'Old Name' });

    await updateDisplayName(user.id, 'New Name');

    const [updated] = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id));
    expect(updated?.name).toBe('New Name');
  });

  it("does not change another user's name", async () => {
    const user = await insertTestUser(db(), { name: 'User One' });
    const otherUser = await insertTestUser(db(), { name: 'User Two' });

    await updateDisplayName(user.id, 'Renamed');

    const [untouched] = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, otherUser.id));
    expect(untouched?.name).toBe('User Two');
  });

  it('is a no-op for an unrecognized userId', async () => {
    await expect(
      updateDisplayName('does-not-exist', 'New Name'),
    ).resolves.toBeUndefined();
  });
});
