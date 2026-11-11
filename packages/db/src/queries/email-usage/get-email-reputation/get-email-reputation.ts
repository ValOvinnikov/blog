import { getDb } from '@blog/db/client';
import {
  EMAIL_DELIVERY_OUTCOME,
  EMAIL_REPUTATION_WINDOW_DAYS,
  type TEmailDeliveryOutcome,
} from '@blog/db/constants';
import { emailDeliveryOutcomeCounts } from '@blog/db/schema/email-usage';
import { utcDayDaysBefore } from '@blog/utils/date';
import { and, eq, gte, sql } from 'drizzle-orm';

export interface IEmailReputation {
  resolvedCount: number;
  bounceRate: number;
  complaintRate: number;
}

interface IOutcomeTotal {
  outcome: TEmailDeliveryOutcome;
  total: number;
}

function totalOf(
  rows: IOutcomeTotal[],
  outcome: TEmailDeliveryOutcome,
): number {
  return rows.find((row) => row.outcome === outcome)?.total ?? 0;
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

export async function getEmailReputation(
  tenantId: string,
): Promise<IEmailReputation> {
  const rows = await getDb()
    .select({
      outcome: emailDeliveryOutcomeCounts.outcome,
      total: sql<number>`sum(${emailDeliveryOutcomeCounts.count})::int`,
    })
    .from(emailDeliveryOutcomeCounts)
    .where(
      and(
        eq(emailDeliveryOutcomeCounts.tenantId, tenantId),
        gte(
          emailDeliveryOutcomeCounts.day,
          utcDayDaysBefore(new Date(), EMAIL_REPUTATION_WINDOW_DAYS - 1),
        ),
      ),
    )
    .groupBy(emailDeliveryOutcomeCounts.outcome);

  const bounced = totalOf(rows, EMAIL_DELIVERY_OUTCOME.BOUNCED);
  const resolvedCount =
    totalOf(rows, EMAIL_DELIVERY_OUTCOME.DELIVERED) + bounced;

  return {
    resolvedCount,
    bounceRate: rate(bounced, resolvedCount),
    complaintRate: rate(
      totalOf(rows, EMAIL_DELIVERY_OUTCOME.COMPLAINED),
      resolvedCount,
    ),
  };
}
