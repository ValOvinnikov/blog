import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { hasEndedUnpaidTrial } from '@blog/db/queries/tenants/ended-trial';
import { planChangeFields } from '@blog/db/queries/tenants/plan-change-fields';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

// Returns the tenant only to the one caller that ended its trial.
export async function endTenantTrial(
  tenantId: string,
  now: Date,
): Promise<TMaybeNull<TTenant>> {
  const [ended] = await getDb()
    .update(tenants)
    .set({
      ...planChangeFields(TENANT_PLAN.FREE, TENANT_STATUS.ACTIVE, now),
      status: TENANT_STATUS.ACTIVE,
    })
    .where(and(eq(tenants.id, tenantId), hasEndedUnpaidTrial(now)))
    .returning();

  return ended ?? null;
}
