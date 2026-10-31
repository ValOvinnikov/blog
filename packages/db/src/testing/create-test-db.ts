import { readFile } from 'node:fs/promises';

import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { inject } from 'vitest';

async function restoreSnapshot(snapshotPath: string): Promise<TTestDb> {
  const snapshot = await readFile(snapshotPath);
  const client = await PGlite.create({ loadDataDir: new Blob([snapshot]) });

  return drizzle(client, { schema });
}

// A private in-memory database with every committed migration applied.
export function createTestDb(): Promise<TTestDb> {
  return restoreSnapshot(inject('pgliteMigratedSnapshotPath'));
}
