import { getDb } from '@blog/db/client';
import { AUDIT_EVENT_RETENTION_MONTHS } from '@blog/db/constants';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import { auditEvents } from '@blog/db/schema/audit-events';
import { lt } from 'drizzle-orm';

export async function deleteAuditEventsPastRetention(
  now: Date,
): Promise<number> {
  const deleted = await getDb()
    .delete(auditEvents)
    .where(
      lt(
        auditEvents.createdAt,
        monthsBefore(now, AUDIT_EVENT_RETENTION_MONTHS),
      ),
    )
    .returning({ id: auditEvents.id });

  return deleted.length;
}
