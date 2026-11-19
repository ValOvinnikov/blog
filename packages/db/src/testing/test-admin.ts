import * as schema from '@shinefold/db/schema';

import { insertTestAdmin, type TTestDb } from './fixtures';

export function useTestAdmin(db: () => TTestDb): () => string {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  afterEach(async () => {
    await db().delete(schema.admins);
    await db().delete(schema.users);
  });

  return () => adminId;
}
