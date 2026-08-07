import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { and, eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { unlinkProvider } from './unlink-provider';

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
  await db.delete(schema.accounts);
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

async function insertAccount(userId: string, provider: string): Promise<void> {
  await db.insert(schema.accounts).values({
    userId,
    type: 'oauth',
    provider,
    providerAccountId: `${userId}-${provider}`,
  });
}

async function findAccount(userId: string, provider: string) {
  return db
    .select()
    .from(schema.accounts)
    .where(
      and(
        eq(schema.accounts.userId, userId),
        eq(schema.accounts.provider, provider),
      ),
    );
}

describe(unlinkProvider, () => {
  it('deletes the accounts row when a second method remains linked', async () => {
    const user = await insertUser();
    await insertAccount(user.id, 'github');
    await insertAccount(user.id, 'google');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'github')).toEqual([]);
  });

  it('deletes github when email-link is also linked', async () => {
    const user = await insertUser({ emailVerified: new Date(2026, 0, 1) });
    await insertAccount(user.id, 'github');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'github')).toEqual([]);
  });

  it('rejects removing the last remaining linked method', async () => {
    const user = await insertUser();
    await insertAccount(user.id, 'github');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'last-method' });
    expect(await findAccount(user.id, 'github')).toHaveLength(1);
  });

  it('is a no-op (not a rejection) when the target provider is not linked', async () => {
    const user = await insertUser();
    await insertAccount(user.id, 'google');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'google')).toHaveLength(1);
  });

  it("does not remove another user's accounts row", async () => {
    const user = await insertUser();
    const otherUser = await insertUser();
    await insertAccount(user.id, 'github');
    await insertAccount(user.id, 'google');
    await insertAccount(otherUser.id, 'github');

    await unlinkProvider(user.id, 'github');

    expect(await findAccount(otherUser.id, 'github')).toHaveLength(1);
  });
});
