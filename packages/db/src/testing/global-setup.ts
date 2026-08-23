import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as schema from '@blog/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { TestProject } from 'vitest/node';

import { applyMigrationFile, listMigrationFiles } from './migration-files';

declare module 'vitest' {
  // Augmenting vitest's own interface — the name must match theirs exactly.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export interface ProvidedContext {
    pgliteMigratedSnapshotPath: string;
  }
}

// Builds one fully-migrated PGlite instance for the whole vitest process and
// snapshots it to a temp file; `createTestDb()` restores each test file's
// own private instance from this snapshot instead of replaying every
// migration itself. Runs in vitest's main process, separate from the worker
// processes that run test files, so the snapshot crosses that boundary via
// the filesystem rather than an in-memory reference.
export async function setup(
  project: TestProject,
): Promise<() => Promise<void>> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  for (const file of listMigrationFiles()) {
    await applyMigrationFile(db, file);
  }

  const tarball = await client.dumpDataDir();
  await client.close();

  const snapshotPath = join(tmpdir(), `blog-db-pglite-${randomUUID()}.tar.gz`);
  await writeFile(snapshotPath, Buffer.from(await tarball.arrayBuffer()));

  project.provide('pgliteMigratedSnapshotPath', snapshotPath);

  return async function teardown() {
    await unlink(snapshotPath);
  };
}
