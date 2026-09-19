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

      for (const file of laterMigrations) {
        await applyMigrationFile(db, file);
      }

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
