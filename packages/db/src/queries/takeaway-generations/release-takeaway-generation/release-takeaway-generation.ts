import { getDb } from '@shinefold/db/client';
import type { TTakeawayGenerationClaim } from '@shinefold/db/queries/takeaway-generations/claim-takeaway-generation';
import { takeawayGenerationCounts } from '@shinefold/db/schema/takeaway-generation-counts';
import { and, eq, gt, sql } from 'drizzle-orm';

export async function releaseTakeawayGeneration({
  tenantId,
  month,
}: TTakeawayGenerationClaim): Promise<void> {
  await getDb()
    .update(takeawayGenerationCounts)
    .set({ count: sql`${takeawayGenerationCounts.count} - 1` })
    .where(
      and(
        eq(takeawayGenerationCounts.tenantId, tenantId),
        eq(takeawayGenerationCounts.month, month),
        gt(takeawayGenerationCounts.count, 0),
      ),
    );
}
