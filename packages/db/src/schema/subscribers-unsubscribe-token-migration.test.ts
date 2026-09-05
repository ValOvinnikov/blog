import * as schema from '@blog/db/schema';
import { subscribers } from '@blog/db/schema/subscribers';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

const BACKFILL_MIGRATION = '0024_faithful_kree.sql';

// Regression coverage for the same bug class as
// admins-granted-via-migration.test.ts/tenants-name-migration.test.ts/
// bookmarks-subscribers-tenant-id-migration.test.ts: adding a NOT NULL
// UNIQUE column with no default against a table that can already have rows.
// A single shared default would satisfy NOT NULL but immediately violate
// UNIQUE, so this proves the nullable-add -> per-row backfill -> SET NOT
// NULL -> UNIQUE sequence actually gives every pre-existing row its own
// distinct value rather than a constant.
describe('0024_faithful_kree (subscribers unsubscribe_token backfill)', () => {
  it(
    'backfills every pre-existing subscriber row with a distinct, non-null unsubscribe_token',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      const migrationFiles = listMigrationFiles();
      const priorMigrations = migrationFiles.filter(
        (file) => file < BACKFILL_MIGRATION,
      );

      for (const file of priorMigrations) {
        await applyMigrationFile(db, file);
      }

      const tenant = await insertTestTenant(db);

      // The `subscribers` shape before this migration: no
      // `unsubscribe_token` column yet, matching rows created before this
      // migration ever ran.
      await db.execute(
        sql.raw(`
        insert into "subscribers"
          ("id", "tenant_id", "email", "confirmation_token")
        values
          ('sub-1', '${tenant.id}', 'reader-one@example.com', 'token-1'),
          ('sub-2', '${tenant.id}', 'reader-two@example.com', 'token-2'),
          ('sub-3', '${tenant.id}', 'reader-three@example.com', 'token-3')
      `),
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const result = await db.execute<{ unsubscribe_token: string | null }>(
        sql.raw(`select "unsubscribe_token" from "subscribers" order by "id"`),
      );
      const tokens = result.rows.map((row) => row.unsubscribe_token);

      expect(tokens).toHaveLength(3);
      expect(
        tokens.every((token) => typeof token === 'string' && token.length > 0),
      ).toBe(true);
      expect(new Set(tokens).size).toBe(tokens.length);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'enforces NOT NULL and UNIQUE on unsubscribe_token once fully migrated',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const tenant = await insertTestTenant(db);
      const [subscriber] = await db
        .insert(subscribers)
        .values({ tenantId: tenant.id, email: 'reader@example.com' })
        .returning();
      if (!subscriber) throw new Error('failed to seed a subscriber row');

      await expect(
        db.execute(
          sql.raw(
            `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ('sub-null', '${tenant.id}', 'other@example.com', 'token-other', NULL)`,
          ),
        ),
      ).rejects.toThrow();

      await expect(
        db.execute(
          sql.raw(
            `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ('sub-dup', '${tenant.id}', 'dup@example.com', 'token-dup', '${subscriber.unsubscribeToken}')`,
          ),
        ),
      ).rejects.toThrow();
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty subscribers table',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(subscribers);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
