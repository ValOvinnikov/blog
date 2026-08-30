import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestAccount, insertTestUser } from '@blog/db/testing/fixtures';
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
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');
    await insertTestAccount(db, user.id, 'google');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'github')).toEqual([]);
  });

  it('deletes github when email-link is also linked', async () => {
    const user = await insertTestUser(db, {
      emailVerified: new Date(2026, 0, 1),
    });
    await insertTestAccount(db, user.id, 'github');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'github')).toEqual([]);
  });

  it('rejects removing the last remaining linked method', async () => {
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'last-method' });
    expect(await findAccount(user.id, 'github')).toHaveLength(1);
  });

  it('is a no-op (not a rejection) when the target provider is not linked', async () => {
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'google');

    const result = await unlinkProvider(user.id, 'github');

    expect(result).toEqual({ outcome: 'unlinked' });
    expect(await findAccount(user.id, 'google')).toHaveLength(1);
  });

  it("does not remove another user's accounts row", async () => {
    const user = await insertTestUser(db);
    const otherUser = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');
    await insertTestAccount(db, user.id, 'google');
    await insertTestAccount(db, otherUser.id, 'github');

    await unlinkProvider(user.id, 'github');

    expect(await findAccount(otherUser.id, 'github')).toHaveLength(1);
  });

  // Regression test for the atomic-guard fix: two concurrent calls for the
  // same user, targeting *different* providers, must never both succeed —
  // exactly one of them has to win and leave the user with at least one
  // linked method. A naive JS-level "read count, then delete" would let
  // both calls read "2 methods linked" before either delete lands and both
  // proceed, leaving zero. (pglite is a single-connection embedded engine,
  // so this doesn't exercise genuine cross-connection lock contention the
  // way two real Postgres connections would — but it still asserts the
  // invariant this guard exists to protect holds regardless of call order,
  // and that the `FOR UPDATE` CTE-based SQL executes correctly back-to-back.)
  it('never lets two concurrent calls both remove the last two linked methods', async () => {
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');
    await insertTestAccount(db, user.id, 'google');

    const [githubResult, googleResult] = await Promise.all([
      unlinkProvider(user.id, 'github'),
      unlinkProvider(user.id, 'google'),
    ]);

    const outcomes = [githubResult.outcome, googleResult.outcome].sort();
    expect(outcomes).toEqual(['last-method', 'unlinked']);

    const remainingAccounts = await db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, user.id));
    expect(remainingAccounts).toHaveLength(1);
  });
});
