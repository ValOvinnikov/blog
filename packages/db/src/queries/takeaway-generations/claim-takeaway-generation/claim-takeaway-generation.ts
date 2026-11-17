import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { takeawayGenerationCounts } from '@shinefold/db/schema/takeaway-generation-counts';
import { tenants } from '@shinefold/db/schema/tenants';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { lt, type SQL, sql } from 'drizzle-orm';

export type TTakeawayGenerationClaim = { tenantId: string; month: string };

function tenantMonthlyAllowance(tenantId: string): SQL<number> {
  const allowanceByPlan = Object.entries(PLAN_ENTITLEMENTS).map(
    ([plan, { takeawaysPerMonth }]) =>
      sql`WHEN ${plan} THEN ${takeawaysPerMonth}::int`,
  );

  return sql<number>`(SELECT CASE ${tenants.plan}::text ${sql.join(allowanceByPlan, sql` `)} END FROM ${tenants} WHERE ${tenants.id} = ${tenantId})`;
}

export async function claimTakeawayGeneration(
  tenantId: string,
): Promise<TMaybeNull<TTakeawayGenerationClaim>> {
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
      setWhere: lt(
        takeawayGenerationCounts.count,
        tenantMonthlyAllowance(tenantId),
      ),
    })
    .returning({ month: takeawayGenerationCounts.month });

  return claimed ? { tenantId, month: claimed.month } : null;
}
