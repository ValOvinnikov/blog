import { type TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, isNull } from 'drizzle-orm';

type TRestoredGrace = {
  plan: TTenantPlan;
  graceStartedAt: Date;
  downgradedFromPlan: TMaybeNull<TTenantPlan>;
};

export async function restoreDowngradeGrace(
  tenantId: string,
  { plan, graceStartedAt, downgradedFromPlan }: TRestoredGrace,
): Promise<boolean> {
  const restored = await getDb()
    .update(tenants)
    .set({ downgradeGraceStartedAt: graceStartedAt, downgradedFromPlan })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.plan, plan),
        isNull(tenants.downgradeGraceStartedAt),
      ),
    )
    .returning({ id: tenants.id });

  return hasLength(restored);
}
