import { readFile } from 'node:fs/promises';

import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { inject } from 'vitest';

const WORKER_TEST_DB = Symbol.for('@blog/db/worker-test-db');

type TWorkerGlobal = typeof globalThis & {
  [WORKER_TEST_DB]?: Promise<TTestDb>;
};

async function restoreSnapshot(snapshotPath: string): Promise<TTestDb> {
  const snapshot = await readFile(snapshotPath);
  const client = await PGlite.create({ loadDataDir: new Blob([snapshot]) });

  return drizzle(client, { schema });
}

// Held on `globalThis` because the per-file `vi.resetModules()` drops module state but not globals, so every file a worker runs reuses one restore.
export function getWorkerTestDb(): Promise<TTestDb> {
  const workerGlobal = globalThis as TWorkerGlobal;
  workerGlobal[WORKER_TEST_DB] ??= restoreSnapshot(
    inject('pgliteMigratedSnapshotPath'),
  );

  return workerGlobal[WORKER_TEST_DB];
}

export async function truncateAllTables(db: TTestDb): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE tables text;
    BEGIN
      SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
        INTO tables
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
      IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
      END IF;
    END $$;
  `);
}
