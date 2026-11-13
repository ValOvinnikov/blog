import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { hasLength } from '@blog/utils/primitives';
import { and, eq, isNull } from 'drizzle-orm';

type TRestoredGrace = {
  graceStartedAt: Date;
  downgradedFromPlan: TMaybeNull<TTenantPlan>;
};

export async function restoreDowngradeGrace(
  tenantId: string,
  { graceStartedAt, downgradedFromPlan }: TRestoredGrace,
): Promise<boolean> {
  const restored = await getDb()
    .update(tenants)
    .set({ downgradeGraceStartedAt: graceStartedAt, downgradedFromPlan })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.plan, TENANT_PLAN.FREE),
        isNull(tenants.downgradeGraceStartedAt),
      ),
    )
    .returning({ id: tenants.id });

  return hasLength(restored);
}
