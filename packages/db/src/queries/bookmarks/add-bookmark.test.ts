import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addBookmark } from './add-bookmark';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so a unique/foreign-key violation surfaces
// here the same way it would against Neon.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
}

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
  await db.delete(schema.users);
});

describe(addBookmark, () => {
  it('inserts a new bookmark row for the given user and post', async () => {
    await insertUser('user-1');

    const bookmark = await addBookmark('user-1', 'post-1');

    expect(bookmark).toMatchObject({ userId: 'user-1', postId: 'post-1' });
  });

  it('is idempotent when the pair is already bookmarked', async () => {
    await insertUser('user-1');
    const first = await addBookmark('user-1', 'post-1');

    const second = await addBookmark('user-1', 'post-1');

    expect(second).toEqual(first);
    const rows = await db.select().from(schema.bookmarks);
    expect(rows).toHaveLength(1);
  });

  it('rejects a bookmark for a user that does not exist', async () => {
    await expect(addBookmark('missing-user', 'post-1')).rejects.toThrow();
  });
});

describe('foreign-key cascade', () => {
  it('removes a bookmark when its owning user is deleted', async () => {
    await insertUser('user-1');
    await addBookmark('user-1', 'post-1');

    await db.delete(schema.users).where(eq(schema.users.id, 'user-1'));

    const rows = await db.select().from(schema.bookmarks);
    expect(rows).toHaveLength(0);
  });
});
