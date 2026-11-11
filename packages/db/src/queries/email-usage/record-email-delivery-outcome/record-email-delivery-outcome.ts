import { getDb } from '@blog/db/client';
import type { TEmailDeliveryOutcome } from '@blog/db/constants';
import { emailDeliveryOutcomeCounts } from '@blog/db/schema/email-usage';
import { utcDay } from '@blog/utils/date';
import { sql } from 'drizzle-orm';

export async function recordEmailDeliveryOutcome(
  tenantId: string,
  outcome: TEmailDeliveryOutcome,
): Promise<void> {
  await getDb()
    .insert(emailDeliveryOutcomeCounts)
    .values({ tenantId, day: utcDay(new Date()), outcome, count: 1 })
    .onConflictDoUpdate({
      target: [
        emailDeliveryOutcomeCounts.tenantId,
        emailDeliveryOutcomeCounts.day,
        emailDeliveryOutcomeCounts.outcome,
      ],
      set: { count: sql`${emailDeliveryOutcomeCounts.count} + 1` },
    });
}
