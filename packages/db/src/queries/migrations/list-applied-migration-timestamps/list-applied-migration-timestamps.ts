import { getDb } from '@blog/db/client';
import { CREATED_AT_COLUMN } from '@blog/db/schema/columns';
import { bigint, pgSchema, serial, text } from 'drizzle-orm/pg-core';

// drizzle-kit migrate's own journal table; kept out of src/schema so db:generate never manages it.
const appliedMigrations = pgSchema('drizzle').table('__drizzle_migrations', {
  id: serial('id').primaryKey(),
  hash: text('hash').notNull(),
  createdAt: bigint(CREATED_AT_COLUMN, { mode: 'number' }),
});

export async function listAppliedMigrationTimestamps(): Promise<number[]> {
  const db = getDb();

  const rows = await db
    .select({ createdAt: appliedMigrations.createdAt })
    .from(appliedMigrations);

  return rows.flatMap(({ createdAt }) =>
    createdAt === null ? [] : [createdAt],
  );
}
