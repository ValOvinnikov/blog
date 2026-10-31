import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TDb } from '@blog/db/client';
import { sql } from 'drizzle-orm';

const migrationsDir = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

export function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

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
