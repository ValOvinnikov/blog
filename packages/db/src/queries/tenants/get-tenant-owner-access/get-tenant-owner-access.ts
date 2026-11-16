import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  tenantOwnerAccessColumns,
  toTenantOwnerAccess,
  type TTenantOwnerAccess,
} from '@shinefold/db/queries/tenants/tenant-owner-access';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function getTenantOwnerAccess(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantOwnerAccess>> {
  const db = getDb();

  const [row] = await db
    .select(tenantOwnerAccessColumns)
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row ? toTenantOwnerAccess(row) : undefined;
}
