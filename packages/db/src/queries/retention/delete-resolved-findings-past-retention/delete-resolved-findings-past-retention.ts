import { FINDING_STATUS } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { RESOLVED_FINDING_RETENTION_DAYS } from '@blog/db/constants';
import { daysBefore } from '@blog/db/queries/retention/retention-cutoff';
import { findings } from '@blog/db/schema/findings';
import { and, eq, lt } from 'drizzle-orm';

export async function deleteResolvedFindingsPastRetention(
  now: Date,
): Promise<number> {
  const deleted = await getDb()
    .delete(findings)
    .where(
      and(
        eq(findings.status, FINDING_STATUS.RESOLVED),
        lt(
          findings.resolvedAt,
          daysBefore(now, RESOLVED_FINDING_RETENTION_DAYS),
        ),
      ),
    )
    .returning({ id: findings.id });

  return deleted.length;
}
