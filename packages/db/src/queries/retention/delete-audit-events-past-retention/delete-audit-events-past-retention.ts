import { AUDIT_EVENT_RETENTION_MONTHS } from '@shinefold/db/constants';
import { deleteRetentionBatch } from '@shinefold/db/queries/retention/retention-batch';
import { monthsBefore } from '@shinefold/db/queries/retention/retention-cutoff';
import { auditEvents } from '@shinefold/db/schema/audit-events';
import { lt } from 'drizzle-orm';

export async function deleteAuditEventsPastRetention(
  now: Date,
  limit: number,
): Promise<number> {
  return deleteRetentionBatch(
    auditEvents,
    [auditEvents.id],
    lt(auditEvents.createdAt, monthsBefore(now, AUDIT_EVENT_RETENTION_MONTHS)),
    limit,
  );
}
