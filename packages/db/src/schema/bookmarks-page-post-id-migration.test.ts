import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import { users } from './auth';
import { bookmarks } from './bookmarks';
import { tenants } from './tenants';

const REWRITE_MIGRATION = '0030_rewrite_bookmark_post_ids_to_page_post.sql';

async function setUpDbWithBookmark(postId: string) {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const otherMigrations = listMigrationFiles().filter(
    (file) => file !== REWRITE_MIGRATION,
  );

  for (const file of otherMigrations) {
    await applyMigrationFile(db, file);
  }

  const [user] = await db
    .insert(users)
    .values({ email: 'reader@example.com' })
    .returning();
  if (!user) throw new Error('failed to seed a user row');

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  if (!tenant) throw new Error('failed to seed a tenant row');

  await db.insert(bookmarks).values({
    tenantId: tenant.id,
    userId: user.id,
    postId,
  });

  return { db, tenantId: tenant.id, userId: user.id };
}

async function applyRewriteMigration(
  db: Awaited<ReturnType<typeof setUpDbWithBookmark>>['db'],
) {
  await applyMigrationFile(db, REWRITE_MIGRATION);
}

async function readBookmarkPostIds(
  db: Awaited<ReturnType<typeof setUpDbWithBookmark>>['db'],
) {
  const rows = await db.select().from(bookmarks);
  return rows.map((row) => row.postId);
}

describe(`${REWRITE_MIGRATION} (bookmarks.post_id page_post prefix rewrite)`, () => {
  it(
    'prefixes a bare post id with page_post-',
    async () => {
      const { db } = await setUpDbWithBookmark('welcome');

      await applyRewriteMigration(db);

      expect(await readBookmarkPostIds(db)).toEqual(['page_post-welcome']);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves an already-prefixed post id untouched',
    async () => {
      const { db } = await setUpDbWithBookmark('page_post-welcome');

      await applyRewriteMigration(db);

      expect(await readBookmarkPostIds(db)).toEqual(['page_post-welcome']);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'is idempotent: applying it a second time changes nothing',
    async () => {
      const { db } = await setUpDbWithBookmark('welcome');

      await applyRewriteMigration(db);
      const afterFirstRun = await readBookmarkPostIds(db);

      await applyMigrationFile(db, REWRITE_MIGRATION);
      const afterSecondRun = await readBookmarkPostIds(db);

      expect(afterSecondRun).toEqual(afterFirstRun);
      expect(afterSecondRun).toEqual(['page_post-welcome']);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty bookmarks table',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(bookmarks);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
