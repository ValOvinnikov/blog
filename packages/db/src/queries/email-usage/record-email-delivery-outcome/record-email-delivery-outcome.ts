import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import type { TEmailDeliveryOutcome } from '@blog/db/constants';
import {
  emailDeliveryEvents,
  emailDeliveryOutcomeCounts,
} from '@blog/db/schema/email-usage';
import { foreignKeyViolationConstraint } from '@blog/db/utils/constraint-violation/constraint-violation';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { utcDay } from '@blog/utils/date';
import { hasLength, isUndefined } from '@blog/utils/primitives';
import { sql } from 'drizzle-orm';

// One statement, because `neon-http` has no transactions: the event id and the count are stored together or not at all.
export async function recordEmailDeliveryOutcome(
  eventId: string,
  tenantId: string,
  outcome: TEmailDeliveryOutcome,
): Promise<TResult<boolean, TErrorCode>> {
  const db = getDb();
  const now = new Date();

  const newEvent = db
    .$with('new_event')
    .as(
      db
        .insert(emailDeliveryEvents)
        .values({ eventId, tenantId, receivedAt: now })
        .onConflictDoNothing()
        .returning({ tenantId: emailDeliveryEvents.tenantId }),
    );

  try {
    const recorded = await db
      .with(newEvent)
      .insert(emailDeliveryOutcomeCounts)
      .select(
        db
          .select({
            tenantId: sql<string>`${newEvent.tenantId}`.as('tenant_id'),
            day: sql<string>`${utcDay(now)}::date`.as('day'),
            outcome: sql<TEmailDeliveryOutcome>`${outcome}`.as('outcome'),
            count: sql<number>`1`.as('count'),
          })
          .from(newEvent),
      )
      .onConflictDoUpdate({
        target: [
          emailDeliveryOutcomeCounts.tenantId,
          emailDeliveryOutcomeCounts.day,
          emailDeliveryOutcomeCounts.outcome,
        ],
        set: { count: sql`${emailDeliveryOutcomeCounts.count} + 1` },
      })
      .returning({ tenantId: emailDeliveryOutcomeCounts.tenantId });

    return okResult(hasLength(recorded));
  } catch (error) {
    if (isUndefined(foreignKeyViolationConstraint(error))) throw error;
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }
}
