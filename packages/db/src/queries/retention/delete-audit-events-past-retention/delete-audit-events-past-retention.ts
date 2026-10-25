import { getDb } from '@blog/db/client';
import { AUDIT_EVENT_RETENTION_MONTHS } from '@blog/db/constants';
import { isInBatch } from '@blog/db/queries/retention/retention-batch';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import { auditEvents } from '@blog/db/schema/audit-events';
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
