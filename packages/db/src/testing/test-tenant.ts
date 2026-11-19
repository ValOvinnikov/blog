import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

import { firstRowOrThrow } from './first-row-or-throw';
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
  patch: Partial<
    Pick<
      TTenant,
      'plan' | 'status' | 'selfServeOwnerEmailIndex' | 'suspensionReason'
    >
  >,
): Promise<void> {
  await db
    .update(schema.tenants)
    .set(patch)
    .where(eq(schema.tenants.id, tenantId));
}

export async function readTestTenant(
  db: TTestDb,
  tenantId: string,
): Promise<TTenant> {
  return firstRowOrThrow(
    await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId)),
    `readTestTenant("${tenantId}")`,
  );
}
