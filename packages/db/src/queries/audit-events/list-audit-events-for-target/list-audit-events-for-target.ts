import type { TAuditTargetType } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { auditEvents, type TAuditEvent } from '@blog/db/schema/audit-events';
import { and, desc, eq } from 'drizzle-orm';

export type TListAuditEventsForTargetOptions = {
  limit?: number;
  offset?: number;
};

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
    .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
    .limit(options.limit ?? 20)
    .offset(options.offset ?? 0);
}
