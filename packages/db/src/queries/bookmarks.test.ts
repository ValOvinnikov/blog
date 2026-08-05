import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  addBookmark,
  isBookmarked,
  listBookmarks,
  removeBookmark,
} from './bookmarks';

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

describe(removeBookmark, () => {
  it('deletes an existing bookmark', async () => {
    await insertUser('user-1');
    await addBookmark('user-1', 'post-1');

    await removeBookmark('user-1', 'post-1');

    expect(await isBookmarked('user-1', 'post-1')).toBe(false);
  });

  it('is a no-op when the bookmark does not exist', async () => {
    await insertUser('user-1');

    await expect(removeBookmark('user-1', 'post-1')).resolves.toBeUndefined();
  });

  it("does not remove another user's bookmark for the same post", async () => {
    await insertUser('user-1');
    await insertUser('user-2');
    await addBookmark('user-1', 'post-1');
    await addBookmark('user-2', 'post-1');

    await removeBookmark('user-1', 'post-1');

    expect(await isBookmarked('user-2', 'post-1')).toBe(true);
  });
});

describe(listBookmarks, () => {
  it("returns only the given user's bookmarks", async () => {
    await insertUser('user-1');
    await insertUser('user-2');
    await addBookmark('user-1', 'post-1');
    await addBookmark('user-1', 'post-2');
    await addBookmark('user-2', 'post-3');

    const result = await listBookmarks('user-1');

    expect(result.map((bookmark) => bookmark.postId).sort()).toEqual([
      'post-1',
      'post-2',
    ]);
  });

  it('orders results by most recently bookmarked first', async () => {
    await insertUser('user-1');
    // Insert directly with explicit timestamps rather than relying on two
    // calls to addBookmark() landing in different clock ticks (defaultNow()
    // could otherwise collide within the same statement/transaction).
    await db.insert(schema.bookmarks).values([
      {
        userId: 'user-1',
        postId: 'post-older',
        createdAt: new Date(2026, 0, 1),
      },
      {
        userId: 'user-1',
        postId: 'post-newer',
        createdAt: new Date(2026, 0, 2),
      },
    ]);

    const result = await listBookmarks('user-1');

    expect(result.map((bookmark) => bookmark.postId)).toEqual([
      'post-newer',
      'post-older',
    ]);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    await insertUser('user-1');

    expect(await listBookmarks('user-1')).toEqual([]);
  });
});

describe(isBookmarked, () => {
  it('returns true when the pair exists', async () => {
    await insertUser('user-1');
    await addBookmark('user-1', 'post-1');

    expect(await isBookmarked('user-1', 'post-1')).toBe(true);
  });

  it('returns false when the pair does not exist', async () => {
    await insertUser('user-1');

    expect(await isBookmarked('user-1', 'post-1')).toBe(false);
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
