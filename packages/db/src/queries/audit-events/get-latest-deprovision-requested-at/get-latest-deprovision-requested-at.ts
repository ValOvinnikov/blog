import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { auditEvents } from '@blog/db/schema/audit-events';
import { and, desc, eq } from 'drizzle-orm';

// The most recent time a tenant's deprovisioning was requested, if ever.
export async function getLatestDeprovisionRequestedAt(
  tenantId: string,
): Promise<Date | undefined> {
  const db = getDb();

  const [event] = await db
    .select({ createdAt: auditEvents.createdAt })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.targetType, AUDIT_TARGET_TYPE.TENANT),
        eq(auditEvents.targetId, tenantId),
        eq(auditEvents.action, AUDIT_ACTION.DEPROVISION_REQUESTED),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);

  return event?.createdAt;
}
