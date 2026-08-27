import type { TAuditTargetType } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { auditEvents, type TAuditEvent } from '@blog/db/schema/audit-events';
import { and, desc, eq } from 'drizzle-orm';

export type TListAuditEventsForTargetOptions = {
  limit?: number;
};

// The query `audit_events_target_idx` exists for — every event recorded
// against one target, newest first.
export async function listAuditEventsForTarget(
  targetType: TAuditTargetType,
  targetId: string,
  options: TListAuditEventsForTargetOptions = {},
): Promise<TAuditEvent[]> {
  const db = getDb();

  return db
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.targetType, targetType),
        eq(auditEvents.targetId, targetId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(options.limit ?? 20);
}
