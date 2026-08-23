import { GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import { admins } from './admins';

const BACKFILL_MIGRATION = '0007_wide_silver_samurai.sql';

// Regression coverage for the bug this migration originally shipped with:
// adding a NOT NULL column with no default against a table that can already
// have rows (every pre-existing row comes from `scripts/seed-admin.ts`, the
// only grant path that existed before this migration introduced `PROMOTION`
// as an alternative to it).
describe('0007_wide_silver_samurai (granted_via backfill)', () => {
  it(
    'backfills a pre-existing admin row to BREAK_GLASS instead of failing NOT NULL',
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

      // The `admins` shape before this migration: no
      // `granted_by`/`granted_via`/`granted_at` columns yet, matching a row
      // `seed-admin.ts` created before this migration ever ran.
      await db.execute(sql.raw(`insert into "users" ("id") values ('user-1')`));
      await db.execute(
        sql.raw(
          `insert into "admins" ("user_id", "role") values ('user-1', 'SUPERADMIN')`,
        ),
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const [row] = await db.select().from(admins);

      expect(row?.grantedVia).toBe(GRANTED_VIA.BREAK_GLASS);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty admins table',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(admins);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
