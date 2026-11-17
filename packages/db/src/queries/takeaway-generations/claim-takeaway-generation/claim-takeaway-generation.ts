import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { takeawayGenerationCounts } from '@shinefold/db/schema/takeaway-generation-counts';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { lt, sql } from 'drizzle-orm';

export type TTakeawayGenerationClaim = { tenantId: string; month: string };

export async function claimTakeawayGeneration(
  tenantId: string,
  plan: TTenantPlan,
): Promise<TMaybeNull<TTakeawayGenerationClaim>> {
  const { takeawaysPerMonth } = PLAN_ENTITLEMENTS[plan];
  const month = utcMonthStartDay(new Date());
  const [claimed] = await getDb()
    .insert(takeawayGenerationCounts)
    .values({ tenantId, month, count: 1 })
    .onConflictDoUpdate({
      target: [
        takeawayGenerationCounts.tenantId,
        takeawayGenerationCounts.month,
      ],
      set: { count: sql`${takeawayGenerationCounts.count} + 1` },
      setWhere: lt(takeawayGenerationCounts.count, takeawaysPerMonth),
    })
    .returning({ month: takeawayGenerationCounts.month });

  return claimed ? { tenantId, month: claimed.month } : null;
}
