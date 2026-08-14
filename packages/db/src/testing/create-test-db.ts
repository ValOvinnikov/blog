import * as schema from '@blog/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

import { applyMigrationFile, listMigrationFiles } from './migration-files';

// Builds a fresh, isolated, in-memory Postgres database with every
// committed migration applied — the real generated SQL, not a hand-rolled
// stand-in, so a query/mutation test exercises the actual constraints
// (unique/foreign-key) drizzle-kit generated. Call once per test (or
// `beforeEach`) for full isolation between tests; each call gets its own
// in-memory instance.
export async function createTestDb(): Promise<PgliteDatabase<typeof schema>> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  for (const file of listMigrationFiles()) {
    await applyMigrationFile(db, file);
  }

  return db;
}
