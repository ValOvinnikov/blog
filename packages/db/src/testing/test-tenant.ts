import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

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

export async function patchTestTenant(
  db: TTestDb,
  tenantId: string,
  patch: Partial<Pick<TTenant, 'plan' | 'status'>>,
): Promise<void> {
  await db
    .update(schema.tenants)
    .set(patch)
    .where(eq(schema.tenants.id, tenantId));
}
