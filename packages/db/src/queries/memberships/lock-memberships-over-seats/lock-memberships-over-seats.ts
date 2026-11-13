import { getDb } from '@blog/db/client';
import { PLAN_ENTITLEMENTS, type TTenantPlan } from '@blog/db/constants';
import { unlockedMembershipsOverSeats } from '@blog/db/queries/memberships/memberships-over-seats';
import { isTenantOnPlan } from '@blog/db/queries/tenants/tenant-on-plan';
import { memberships } from '@blog/db/schema/memberships';
import { and, inArray } from 'drizzle-orm';

// Locks nothing once the tenant has moved off `plan`, so a payment landing mid-sweep is never undone.
export async function lockMembershipsOverSeats(
  tenantId: string,
  plan: TTenantPlan,
  now: Date,
): Promise<number> {
  const locked = await getDb()
    .update(memberships)
    .set({ lockedAt: now })
    .where(
      and(
        isTenantOnPlan(tenantId, plan),
        inArray(
          memberships.id,
          unlockedMembershipsOverSeats(tenantId, PLAN_ENTITLEMENTS[plan].seats),
        ),
      ),
    )
    .returning({ id: memberships.id });

  return locked.length;
}
