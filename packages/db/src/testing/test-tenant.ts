import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';

import { insertTestTenant, type TTestDb } from './fixtures';

export function useTestTenant(
  db: () => TTestDb,
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
): () => TTenant {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db(), overrides);
  });

  afterEach(async () => {
    await db().delete(schema.tenants);
  });

  return () => tenant;
}
