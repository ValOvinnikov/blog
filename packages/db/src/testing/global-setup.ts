import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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
    pgliteEmptySnapshotPath: string;
    pgliteMigratedSnapshotPath: string;
  }
}

async function writeSnapshot(client: PGlite, path: string): Promise<void> {
  const tarball = await client.dumpDataDir();
  await writeFile(path, Buffer.from(await tarball.arrayBuffer()));
}

// Global setup runs outside the test workers, so the snapshots reach them as files, not in-memory instances.
export async function setup(
  project: TestProject,
): Promise<() => Promise<void>> {
  const snapshotDir = await mkdtemp(join(tmpdir(), 'blog-db-pglite-'));
  const emptySnapshotPath = join(snapshotDir, 'empty.tar.gz');
  const migratedSnapshotPath = join(snapshotDir, 'migrated.tar.gz');

  // `new PGlite()` would not be ready yet: dumping it before initdb finishes ends the process silently.
  const client = await PGlite.create();
  const db = drizzle(client, { schema });

  await writeSnapshot(client, emptySnapshotPath);

  for (const file of listMigrationFiles()) {
    await applyMigrationFile(db, file);
  }

  await writeSnapshot(client, migratedSnapshotPath);
  await client.close();

  project.provide('pgliteEmptySnapshotPath', emptySnapshotPath);
  project.provide('pgliteMigratedSnapshotPath', migratedSnapshotPath);

  return async function teardown() {
    await rm(snapshotDir, { recursive: true, force: true });
  };
}
