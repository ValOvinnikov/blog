import { getDb } from '@shinefold/db/client';
import { AUDIT_EVENT_RETENTION_MONTHS } from '@shinefold/db/constants';
import { isInBatch } from '@shinefold/db/queries/retention/retention-batch';
import { monthsBefore } from '@shinefold/db/queries/retention/retention-cutoff';
import { auditEvents } from '@shinefold/db/schema/audit-events';
import { lt } from 'drizzle-orm';

export async function deleteAuditEventsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select({ id: auditEvents.id })
    .from(auditEvents)
    .where(
      lt(
        auditEvents.createdAt,
        monthsBefore(now, AUDIT_EVENT_RETENTION_MONTHS),
      ),
    )
    .limit(limit);

  const deleted = await db
    .delete(auditEvents)
    .where(isInBatch(auditEvents.id, batch))
    .returning({ id: auditEvents.id });

  return deleted.length;
}
