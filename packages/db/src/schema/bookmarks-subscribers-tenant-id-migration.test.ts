import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import { bookmarks } from './bookmarks';
import { subscribers } from './subscribers';

const BACKFILL_MIGRATION = '0008_silly_xorn.sql';

// Regression coverage for the bug 0007_wide_silver_samurai.sql originally
// shipped with (see admins-granted-via-migration.test.ts): adding a NOT
// NULL column with no default against a table that can already have rows
// fails outright. `bookmarks` and `subscribers` both predate the tenant
// registry and already hold live rows, so this proves the nullable-add ->
// backfill -> SET NOT NULL sequence resolves every pre-existing row to the
// sole tenant that exists at migration time, without hardcoding its id.
describe('0008_silly_xorn (bookmarks/subscribers tenant_id backfill)', () => {
  it(
    'backfills pre-existing bookmark and subscriber rows to the sole existing tenant',
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

      // The `bookmarks`/`subscribers` shape before this migration: no
      // `tenant_id` column yet, matching rows created before this migration
      // ever ran. Raw SQL rather than `db.insert(schema.tenants)` — the
      // current schema's `name` column postdates this migration too (see
      // tenants-name-migration.test.ts), so a typed insert against a table
      // that only has migrations up to this one applied would reference a
      // column that doesn't exist yet.
      await db.execute(sql.raw(`insert into "users" ("id") values ('user-1')`));
      const insertedTenant = await db.execute<{ id: string }>(
        sql.raw(
          `insert into "tenants" ("slug", "primary_domain", "sanity_project_id", "sanity_dataset", "locale", "plan", "status") values ('acme', 'acme.example.com', 'abc123', 'production', 'en', 'FREE', 'ACTIVE') returning "id"`,
        ),
      );
      const tenant = insertedTenant.rows[0];
      if (!tenant) throw new Error('failed to seed a tenant row');

      await db.execute(
        sql.raw(
          `insert into "bookmarks" ("user_id", "post_id") values ('user-1', 'post-1')`,
        ),
      );
      await db.execute(
        sql.raw(
          `insert into "subscribers" ("id", "email", "confirmation_token") values ('sub-1', 'reader@example.com', 'token-1')`,
        ),
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const [bookmark] = await db.select().from(bookmarks);
      const [subscriber] = await db.select().from(subscribers);

      expect(bookmark?.tenantId).toBe(tenant.id);
      expect(subscriber?.tenantId).toBe(tenant.id);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against empty bookmarks and subscribers tables',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const bookmarkRows = await db.select().from(bookmarks);
      const subscriberRows = await db.select().from(subscribers);

      expect(bookmarkRows).toHaveLength(0);
      expect(subscriberRows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
