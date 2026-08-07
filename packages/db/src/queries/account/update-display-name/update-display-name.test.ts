import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { updateDisplayName } from './update-display-name';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts).
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.
beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  const [inserted] = await db
    .insert(schema.users)
    .values(overrides)
    .returning();

  if (!inserted) throw new Error('failed to seed a user row');

  return inserted;
}

describe(updateDisplayName, () => {
  it('persists the new name', async () => {
    const user = await insertUser({ name: 'Old Name' });

    await updateDisplayName(user.id, 'New Name');

    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id));
    expect(updated?.name).toBe('New Name');
  });

  it("does not change another user's name", async () => {
    const user = await insertUser({ name: 'User One' });
    const otherUser = await insertUser({ name: 'User Two' });

    await updateDisplayName(user.id, 'Renamed');

    const [untouched] = await db
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
