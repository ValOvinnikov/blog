import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addBookmark } from '../add-bookmark';

import { isBookmarked } from './is-bookmarked';

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

describe(isBookmarked, () => {
  it('returns true when the tuple exists', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await addBookmark(tenantId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(true);
  });

  it('returns false when the tuple does not exist', async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(false);
  });

  it("returns false for another tenant's bookmark on the same user and post", async () => {
    await insertTestUser(db, { id: 'user-1' });
    const { id: tenantOneId } = await insertTestTenant(db, { slug: 'acme' });
    const { id: tenantTwoId } = await insertTestTenant(db, { slug: 'other' });
    await addBookmark(tenantOneId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantTwoId, 'user-1', 'post-1')).toBe(false);
  });
});
