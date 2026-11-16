import type {
  TAuditAction,
  TAuditTargetType,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import {
  auditEvents,
  type TAuditEvent,
} from '@shinefold/db/schema/audit-events';

export type TInsertAuditEventInput = {
  actorId: string;
  action: TAuditAction;
  targetType: TAuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
};

// A plain insert has no unique constraint to violate and no existing row to
// miss, so a thrown error here is a genuine driver/connectivity failure
// rather than a business outcome to branch on.
export async function insertAuditEvent(
  input: TInsertAuditEventInput,
): Promise<TAuditEvent> {
  const db = getDb();

  const [inserted] = await db.insert(auditEvents).values(input).returning();

  if (!inserted) {
    throw new Error(
      `insertAuditEvent: insert for action "${input.action}" on ${input.targetType} "${input.targetId}" returned no row.`,
    );
  }

  return inserted;
}
