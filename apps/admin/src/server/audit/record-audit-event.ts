import 'server-only';

import { auth } from '@admin/server/auth/auth';
import { logger } from '@admin/utils/logger/logger';
import type { TAuditAction, TAuditTargetType } from '@blog/config';
import { queries } from '@blog/db';

export type TRecordAuditEventInput = {
  /** Static, call-site-specific event name to log under if the write fails. */
  logEvent: string;
  action: TAuditAction;
  targetType: TAuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
};

/**
 * Never throws and never changes what its caller returns. Per #1709's
 * failure policy, a lost audit write is logged at `error` and swallowed
 * rather than blocking or rolling back the mutation it describes — the
 * runtime `neon-http` driver has no multi-statement transactions, so the
 * two writes can't be coupled atomically.
 */
export async function recordAuditEvent({
  logEvent,
  action,
  targetType,
  targetId,
  details,
}: TRecordAuditEventInput): Promise<void> {
  try {
    const session = await auth();
    const actorId = session?.user?.id;
    const actorEmail = session?.user?.email;

    if (!actorId || !actorEmail) {
      throw new Error(
        'recordAuditEvent: no authenticated actor id/email on session.',
      );
    }

    await queries.auditEvents.insertAuditEvent({
      actorId,
      actorEmail,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    logger.error(logEvent, { action, targetType, targetId, error });
  }
}
