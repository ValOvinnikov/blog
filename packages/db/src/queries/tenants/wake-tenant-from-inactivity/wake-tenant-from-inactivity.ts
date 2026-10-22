import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { SUSPENSION_REASON, TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

// Returns the tenant only to the one caller that woke it; a tenant not
// suspended for inactivity returns null.
export async function wakeTenantFromInactivity(
  tenantId: string,
): Promise<TMaybeNull<TTenant>> {
  const [woken] = await getDb()
    .update(tenants)
    .set({
      status: TENANT_STATUS.ACTIVE,
      suspendedAt: null,
      suspensionReason: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.status, TENANT_STATUS.SUSPENDED),
        eq(tenants.suspensionReason, SUSPENSION_REASON.INACTIVITY),
        isNull(tenants.deprovisionedAt),
      ),
    )
    .returning();

  return woken ?? null;
}
