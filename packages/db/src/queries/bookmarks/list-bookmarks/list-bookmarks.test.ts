import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addBookmark } from '../add-bookmark';

import { listBookmarks } from './list-bookmarks';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so a unique/foreign-key violation surfaces
// here the same way it would against Neon.
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
  await db.delete(schema.bookmarks);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(listBookmarks, () => {
  it("returns only the given tenant and user's bookmarks", async () => {
    await insertTestUser(db, { id: 'user-1' });
    await insertTestUser(db, { id: 'user-2' });
    const { id: tenantOneId } = await insertTestTenant(db, { slug: 'acme' });
    const { id: tenantTwoId } = await insertTestTenant(db, { slug: 'other' });
    await addBookmark(tenantOneId, 'user-1', 'post-1');
    await addBookmark(tenantOneId, 'user-1', 'post-2');
    await addBookmark(tenantOneId, 'user-2', 'post-3');
    await addBookmark(tenantTwoId, 'user-1', 'post-4');

    const result = await listBookmarks(tenantOneId, 'user-1');

    expect(result.map((bookmark) => bookmark.postId).sort()).toEqual([
      'post-1',
      'post-2',
    ]);
  });

  it('orders results by most recently bookmarked first', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    // Insert directly with explicit timestamps rather than relying on two
    // calls to addBookmark() landing in different clock ticks (defaultNow()
    // could otherwise collide within the same statement/transaction).
    await db.insert(schema.bookmarks).values([
      {
        tenantId,
        userId: 'user-1',
        postId: 'post-older',
        createdAt: new Date(2026, 0, 1),
      },
      {
        tenantId,
        userId: 'user-1',
        postId: 'post-newer',
        createdAt: new Date(2026, 0, 2),
      },
    ]);

    const result = await listBookmarks(tenantId, 'user-1');

    expect(result.map((bookmark) => bookmark.postId)).toEqual([
      'post-newer',
      'post-older',
    ]);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    expect(await listBookmarks(tenantId, 'user-1')).toEqual([]);
  });
});
