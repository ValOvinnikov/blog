import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TDb } from '@blog/db/client';
import { sql } from 'drizzle-orm';

const migrationsDir = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

// pglite (Postgres compiled to WASM) doesn't ship the `pgvector` extension,
// so the bootstrap migration that turns it on for a future embeddings
// column can't run here. No feature table depends on it yet, so it's safe to
// skip — every real migration after it still applies in full, against a
// genuine Postgres engine.
const SKIPPED_MIGRATIONS = new Set(['0000_enable_pgvector_extension.sql']);

// Every generated migration filename, in application order, excluding ones
// pglite can't run (see `SKIPPED_MIGRATIONS`).
export function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql') && !SKIPPED_MIGRATIONS.has(file))
    .sort();
}

// Runs one generated migration file's statements against `db`, in order —
// the real generated SQL, not a hand-rolled stand-in, so a query/mutation
// test exercises the actual constraints (unique/foreign-key) drizzle-kit
// generated.
export async function applyMigrationFile(db: TDb, file: string): Promise<void> {
  const migrationSql = readFileSync(join(migrationsDir, file), 'utf-8');
  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}
