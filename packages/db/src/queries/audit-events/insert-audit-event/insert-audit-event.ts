import { getDb } from '@blog/db/client';
import { auditEvents, type TAuditEvent } from '@blog/db/schema/audit-events';

export type TInsertAuditEventInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
};

// The only write path this package exports for `audit_events` — there is no
// update or delete query. A plain insert has no unique constraint to
// violate and no existing row to miss, so a thrown error here is a genuine
// driver/connectivity failure, not a business outcome a caller branches on.
// Callers should catch it explicitly around this call alone: a failed audit
// write must never roll back or block the mutation it describes.
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
