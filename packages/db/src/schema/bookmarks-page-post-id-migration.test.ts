import type * as schema from '@blog/db/schema';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsExcept,
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { users } from './auth';
import { bookmarks } from './bookmarks';

faker.seed(6023);

const REWRITE_MIGRATION = '0030_rewrite_bookmark_post_ids_to_page_post.sql';
const PAGE_POST_PREFIX = 'page_post-';
const MOCK_BARE_POST_ID = faker.lorem.slug();
const PREFIXED_POST_ID = `${PAGE_POST_PREFIX}${MOCK_BARE_POST_ID}`;

async function setUpDbWithBookmark(postId: string) {
  const db: PgliteDatabase<typeof schema> = await createEmptyTestDb();
  await applyMigrationsExcept(db, REWRITE_MIGRATION);
  const tenant = await insertReplayTenant(db);
  const [user] = await db
    .insert(users)
    .values({ email: faker.internet.email() })
    .returning();
  if (!user) throw new Error('failed to seed a user row');
  await db
    .insert(bookmarks)
    .values({ tenantId: tenant.id, userId: user.id, postId });

  return db;
}

async function readBookmarkPostIds(db: PgliteDatabase<typeof schema>) {
  const rows = await db.select().from(bookmarks);
  return rows.map((row) => row.postId);
}

describe(`${REWRITE_MIGRATION} (bookmarks.post_id page_post prefix rewrite)`, () => {
  it(
    'leaves an already-prefixed post id untouched',
    async () => {
      const db = await setUpDbWithBookmark(PREFIXED_POST_ID);

      await applyMigrationFile(db, REWRITE_MIGRATION);

      expect(await readBookmarkPostIds(db)).toEqual([PREFIXED_POST_ID]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  describe('with a bare post id bookmark', () => {
    let db: PgliteDatabase<typeof schema>;

    beforeEach(async () => {
      db = await setUpDbWithBookmark(MOCK_BARE_POST_ID);
    }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

    it(
      'prefixes a bare post id with page_post-',
      async () => {
        await applyMigrationFile(db, REWRITE_MIGRATION);

        expect(await readBookmarkPostIds(db)).toEqual([PREFIXED_POST_ID]);
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );

    it(
      'changes nothing when applied a second time',
      async () => {
        await applyMigrationFile(db, REWRITE_MIGRATION);

        await applyMigrationFile(db, REWRITE_MIGRATION);

        expect(await readBookmarkPostIds(db)).toEqual([PREFIXED_POST_ID]);
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );
  });
});
