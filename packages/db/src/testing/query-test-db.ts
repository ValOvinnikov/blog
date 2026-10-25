import { getDb } from '@blog/db/client';

import { createTestDb } from './create-test-db';
import type { TTestDb } from './fixtures';

// Points the shared `@blog/db/client` mock at a private PGlite instance for the current test file.
export function useQueryTestDb(): () => TTestDb {
  let db: TTestDb;

  beforeAll(async () => {
    db = await createTestDb();
  }, 30_000);

  beforeEach(() => {
    vi.mocked(getDb).mockReturnValue(db);
  });

  afterAll(async () => {
    await db.$client.close();
  });

  return () => db;
}
