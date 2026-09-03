import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { deleteAccount } from './delete-account';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so the FK `onDelete: 'cascade'` behavior
// under test is the real Postgres constraint, not a mocked stand-in.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;
let tenantId: string;

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.
beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(async () => {
  getDbMock.mockReturnValue(db);
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  if (!tenant) throw new Error('failed to seed a tenant row');
  tenantId = tenant.id;
});

afterEach(async () => {
  await db.delete(schema.bookmarks);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
});

// Seeds a full "signed-in user" fixture — a users row plus one row in every
// table with a cascading FK to it — so the cascade assertions below prove
// the real FK behavior, not just that `deleteAccount` issues a DELETE.
async function seedUserWithRelatedRows(userId: string): Promise<void> {
  await db.insert(schema.users).values({ id: userId });
  await db.insert(schema.accounts).values({
    userId,
    type: 'oauth',
    provider: 'github',
    providerAccountId: `${userId}-github`,
  });
  await db.insert(schema.sessions).values({
    sessionToken: `${userId}-session`,
    userId,
    expires: new Date(2030, 0, 1),
  });
  await db
    .insert(schema.bookmarks)
    .values({ tenantId, userId, postId: 'post-1' });
}

describe(deleteAccount, () => {
  it('deletes the users row', async () => {
    await seedUserWithRelatedRows('user-1');

    await deleteAccount('user-1');

    const remainingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, 'user-1'));
    expect(remainingUsers).toEqual([]);
  });

  it('cascades to accounts, sessions, and bookmarks rows for that user', async () => {
    await seedUserWithRelatedRows('user-1');

    await deleteAccount('user-1');

    const remainingAccounts = await db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, 'user-1'));
    const remainingSessions = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, 'user-1'));
    const remainingBookmarks = await db
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, 'user-1'));

    expect(remainingAccounts).toEqual([]);
    expect(remainingSessions).toEqual([]);
    expect(remainingBookmarks).toEqual([]);
  });

  it("does not delete another user's rows", async () => {
    await seedUserWithRelatedRows('user-1');
    await seedUserWithRelatedRows('user-2');

    await deleteAccount('user-1');

    const remainingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, 'user-2'));
    const remainingBookmarks = await db
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.userId, 'user-2'));

    expect(remainingUsers).toHaveLength(1);
    expect(remainingBookmarks).toHaveLength(1);
  });

  it('is a no-op when the user does not exist', async () => {
    await expect(deleteAccount('missing-user')).resolves.toBeUndefined();
  });
});
