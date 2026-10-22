import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TDb } from '@blog/db/client';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type * as schema from '@blog/db/schema';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

const migrationsDir = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

// Tests that replay migrations from scratch (building their own PGlite
// instance and running real migration SQL, rather than restoring the
// pre-built snapshot) can't share that snapshot's speed — give them enough
// headroom to survive a machine under heavy concurrent load.
export const MIGRATION_REPLAY_TEST_TIMEOUT_MS = 120_000;

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

// Raw SQL rather than `insertTestTenant`: the current `tenants` schema names columns a part-migrated database lacks.
export async function insertReplayTenant(
  db: PgliteDatabase<typeof schema>,
): Promise<{ id: string }> {
  const key = `tenant-${crypto.randomUUID()}`;
  const { rows } = await db.execute<{ id: string }>(
    sql`insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values (${key}, ${`${key}.example.com`}, ${LOCALE_ISO_CODES.EN}, ${TENANT_PLAN.FREE}, ${TENANT_STATUS.ACTIVE}) returning "id"`,
  );
  const [tenant] = rows;
  if (!tenant) throw new Error('insertReplayTenant: insert returned no row.');
  return tenant;
}
