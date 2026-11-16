import { FINDING_STATUS } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { RESOLVED_FINDING_RETENTION_DAYS } from '@shinefold/db/constants';
import { isInBatch } from '@shinefold/db/queries/retention/retention-batch';
import { findings } from '@shinefold/db/schema/findings';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';
import { and, eq, lt } from 'drizzle-orm';

export async function deleteResolvedFindingsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select({ id: findings.id })
    .from(findings)
    .where(
      and(
        eq(findings.status, FINDING_STATUS.RESOLVED),
        lt(
          findings.resolvedAt,
          daysBefore(now, RESOLVED_FINDING_RETENTION_DAYS),
        ),
      ),
    )
    .limit(limit);

  const deleted = await db
    .delete(findings)
    .where(isInBatch(findings.id, batch))
    .returning({ id: findings.id });

  return deleted.length;
}
