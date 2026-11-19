import { getDb } from '@shinefold/db/client';
import { takeawayGenerationCounts } from '@shinefold/db/schema/takeaway-generation-counts';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { and, eq } from 'drizzle-orm';

export async function countTakeawayGenerationsThisMonth(
  tenantId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ count: takeawayGenerationCounts.count })
    .from(takeawayGenerationCounts)
    .where(
      and(
        eq(takeawayGenerationCounts.tenantId, tenantId),
        eq(takeawayGenerationCounts.month, utcMonthStartDay(new Date())),
      ),
    );

  return row?.count ?? 0;
}
