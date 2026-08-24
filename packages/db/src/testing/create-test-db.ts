import { readFile } from 'node:fs/promises';

import * as schema from '@blog/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { inject } from 'vitest';

// Restores a fresh, isolated, in-memory Postgres database from the snapshot
// `global-setup.ts` builds once per vitest process (every committed
// migration applied — the real generated SQL, not a hand-rolled stand-in, so
// a query/mutation test exercises the actual constraints drizzle-kit
// generated) instead of replaying every migration file itself. Call once per
// test file (or `beforeEach`) for full isolation between tests; each call
// still gets its own private in-memory instance.
export async function createTestDb(): Promise<PgliteDatabase<typeof schema>> {
  const snapshotPath = inject('pgliteMigratedSnapshotPath');
  const snapshot = await readFile(snapshotPath);
  const client = await PGlite.create({ loadDataDir: new Blob([snapshot]) });

  return drizzle(client, { schema });
}
