import type { Mock } from 'vitest';

import { createTestDb } from './create-test-db';
import type { TTestDb } from './fixtures';

// Wires a query test file's isolated PGlite instance to its mocked getDb().
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
