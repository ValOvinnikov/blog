import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  tenantBillingColumns,
  toTenantBilling,
  type TTenantBilling,
} from '@blog/db/queries/tenants/tenant-billing';
import { tenants } from '@blog/db/schema/tenants';
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
