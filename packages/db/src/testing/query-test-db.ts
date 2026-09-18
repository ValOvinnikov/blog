import type { Mock } from 'vitest';

import { createTestDb } from './create-test-db';
import type { TTestDb } from './fixtures';

// Wires a query/mutation test file's isolated PGlite instance to its mocked
// `getDb()` — call once at module scope, right after
// `vi.mock('@blog/db/client', () => ({ getDb: getDbMock }))`, and use the
// returned accessor everywhere the test needs the database (`db().insert(…)`,
// `insertTestTenant(db())`, …). Only `getDb`'s return value is swapped for an
// in-memory Postgres; every query still runs as real SQL against the real
// migrated schema (see `create-test-db.ts`).
export function useQueryTestDb(getDbMock: Mock): () => TTestDb {
  let db: TTestDb;

  beforeAll(async () => {
    db = await createTestDb();
  }, 30_000);

  beforeEach(() => {
    getDbMock.mockReturnValue(db);
  });

  return () => db;
}
