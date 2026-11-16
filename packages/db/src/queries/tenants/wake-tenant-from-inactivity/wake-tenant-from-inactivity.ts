import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { SUSPENSION_REASON, TENANT_STATUS } from '@shinefold/db/constants';
import { resumedTenantFields } from '@shinefold/db/queries/tenants/resumed-tenant-fields';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { and, eq, isNull, sql } from 'drizzle-orm';

const hasNoDeprovisioningRecorded = sql`coalesce(${tenants.deprovisioningSteps}, '{}'::jsonb) = '{}'::jsonb`;

// Returns the tenant only to the one caller that woke it.
export async function wakeTenantFromInactivity(
  tenantId: string,
): Promise<TMaybeNull<TTenant>> {
  const [woken] = await getDb()
    .update(tenants)
    .set({
      ...resumedTenantFields({ isResuming: sql`true` }),
      suspendedAt: null,
      suspensionReason: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.status, TENANT_STATUS.SUSPENDED),
        eq(tenants.suspensionReason, SUSPENSION_REASON.INACTIVITY),
        isNull(tenants.deprovisionedAt),
        hasNoDeprovisioningRecorded,
      ),
    )
    .returning();

  return woken ?? null;
}
