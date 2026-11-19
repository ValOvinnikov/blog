import { FINDING_STATUS } from '@shinefold/config/constants';
import { RESOLVED_FINDING_RETENTION_DAYS } from '@shinefold/db/constants';
import { deleteRetentionBatch } from '@shinefold/db/queries/retention/retention-batch';
import { findings } from '@shinefold/db/schema/findings';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';
import { and, eq, lt } from 'drizzle-orm';

export async function deleteResolvedFindingsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  return deleteRetentionBatch(
    findings,
    [findings.id],
    and(
      eq(findings.status, FINDING_STATUS.RESOLVED),
      lt(findings.resolvedAt, daysBefore(now, RESOLVED_FINDING_RETENTION_DAYS)),
    ),
    limit,
  );
}
