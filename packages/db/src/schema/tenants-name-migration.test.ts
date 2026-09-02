import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import { tenants } from './tenants';

const BACKFILL_MIGRATION = '0009_quick_jazinda.sql';

// Regression coverage for the same bug 0007_wide_silver_samurai.sql and
// 0008_silly_xorn.sql originally shipped with (see
// admins-granted-via-migration.test.ts): adding a NOT NULL column with no
// default against a table that can already have rows fails outright.
// `tenants` predates this column and already holds live rows (the sole
// tenant seeded via `scripts/seed-tenant.ts`), so this proves the
// nullable-add -> backfill -> SET NOT NULL sequence derives every
// pre-existing row's name from its slug via SQL, not a hardcoded value.
describe('0009_quick_jazinda (tenants name backfill)', () => {
  it(
    'backfills pre-existing tenant rows to a title-cased version of their slug',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      const migrationFiles = listMigrationFiles();
      const priorMigrations = migrationFiles.filter(
        (file) => file < BACKFILL_MIGRATION,
      );
      const laterMigrations = migrationFiles.filter(
        (file) => file > BACKFILL_MIGRATION,
      );

      for (const file of priorMigrations) {
        await applyMigrationFile(db, file);
      }

      // The `tenants` shape before this migration: no `name` column yet,
      // matching rows created before this migration ever ran.
      await db.execute(
        sql.raw(`
        insert into "tenants"
          ("slug", "primary_domain", "sanity_project_id", "sanity_dataset", "locale", "plan", "status")
        values
          ('acme', 'acme.example.com', 'p1', 'production', 'en', 'FREE', 'ACTIVE'),
          ('acme-corp', 'acme-corp.example.com', 'p2', 'production', 'en', 'FREE', 'ACTIVE'),
          ('foo_bar', 'foo-bar.example.com', 'p3', 'production', 'en', 'FREE', 'ACTIVE')
      `),
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      // Every migration after the one under test still needs applying too —
      // the typed `tenants` table below reflects the current schema code, not
      // just the state as of BACKFILL_MIGRATION, so a later additive column
      // (e.g. the encrypted Sanity token) must exist in this test db as well
      // for the select to succeed.
      for (const file of laterMigrations) {
        await applyMigrationFile(db, file);
      }

      // Keyed by `primaryDomain`: this select must not depend on `slug`.
      const rows = await db
        .select()
        .from(tenants)
        .orderBy(tenants.primaryDomain);
      const namesByDomain = Object.fromEntries(
        rows.map((row) => [row.primaryDomain, row.name]),
      );

      expect(namesByDomain).toEqual({
        'acme.example.com': 'Acme',
        'acme-corp.example.com': 'Acme Corp',
        'foo-bar.example.com': 'Foo Bar',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty tenants table',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(tenants);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
