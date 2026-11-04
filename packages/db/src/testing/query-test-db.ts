import { getDb } from '@blog/db/client';

import type { TTestDb } from './fixtures';
import { getWorkerTestDb, truncateAllTables } from './worker-test-db';

export function useQueryTestDb(): () => TTestDb {
  let db: TTestDb;

  beforeAll(async () => {
    db = await getWorkerTestDb();
    await truncateAllTables(db);
  }, 30_000);

  beforeEach(() => {
    vi.mocked(getDb).mockReturnValue(db);
  });

  return () => db;
}
