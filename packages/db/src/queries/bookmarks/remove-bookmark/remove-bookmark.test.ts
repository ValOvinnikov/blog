import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addBookmark } from '../add-bookmark';
import { isBookmarked } from '../is-bookmarked';

import { removeBookmark } from './remove-bookmark';

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
