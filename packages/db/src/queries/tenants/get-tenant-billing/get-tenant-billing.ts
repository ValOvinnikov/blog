import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  tenantBillingColumns,
  toTenantBilling,
  type TTenantBilling,
} from '@shinefold/db/queries/tenants/tenant-billing';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function getTenantBilling(
  tenantId: string,
): Promise<TMaybeUndefined<TTenantBilling>> {
  const [row] = await getDb()
    .select(tenantBillingColumns)
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row ? toTenantBilling(row) : undefined;
}
