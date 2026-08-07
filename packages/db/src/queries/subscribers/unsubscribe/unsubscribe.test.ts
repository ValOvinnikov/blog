import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { unsubscribe } from './unsubscribe';

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
  await db.delete(schema.subscribers);
  await db.delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  const [inserted] = await db
    .insert(schema.users)
    .values({ email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a user row');

  return inserted;
}

describe(unsubscribe, () => {
  it('deletes the subscriber row matching the account email', async () => {
    const user = await insertUser();
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    await unsubscribe(user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(0);
  });

  it('is a no-op when no subscriber row matches the account email', async () => {
    const user = await insertUser();

    await expect(unsubscribe(user.id)).resolves.toBeUndefined();
  });

  it('is a no-op for an unrecognized userId', async () => {
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    await unsubscribe('does-not-exist');

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it('is a no-op when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    await unsubscribe(user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another user's subscriber row", async () => {
    const user = await insertUser({ email: 'reader@example.com' });
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });
    await db.insert(schema.subscribers).values({ email: 'other@example.com' });

    await unsubscribe(user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'other@example.com'));
    expect(rows).toHaveLength(1);
  });
});
