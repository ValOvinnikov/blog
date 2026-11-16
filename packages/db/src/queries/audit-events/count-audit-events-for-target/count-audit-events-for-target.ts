import type { TAuditTargetType } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { auditEvents } from '@shinefold/db/schema/audit-events';
import { and, count, eq } from 'drizzle-orm';

export async function countAuditEventsForTarget(
  targetType: TAuditTargetType,
  targetId: string,
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ total: count() })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.targetType, targetType),
        eq(auditEvents.targetId, targetId),
      ),
    );

  return row?.total ?? 0;
}
