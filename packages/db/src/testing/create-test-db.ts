import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as schema from '@blog/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

const migrationsDir = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

// pglite (Postgres compiled to WASM) doesn't ship the `pgvector` extension,
// so the bootstrap migration that turns it on for a future embeddings
// column (#984) can't run here. No feature table depends on it yet, so it's
// safe to skip — every real migration after it still applies in full,
// against a genuine Postgres engine.
const SKIPPED_MIGRATIONS = new Set(['0000_enable_pgvector_extension.sql']);

// Builds a fresh, isolated, in-memory Postgres database with every
// committed migration applied — the real generated SQL, not a hand-rolled
// stand-in, so a query/mutation test exercises the actual constraints
// (unique/foreign-key) drizzle-kit generated. Call once per test (or
// `beforeEach`) for full isolation between tests; each call gets its own
// in-memory instance.
export async function createTestDb(): Promise<PgliteDatabase<typeof schema>> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql') && !SKIPPED_MIGRATIONS.has(file))
    .sort();

  for (const file of migrationFiles) {
    const migrationSql = readFileSync(join(migrationsDir, file), 'utf-8');
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
  }

  return db;
}
