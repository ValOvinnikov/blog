import {
  deleteAuditEventsPastRetention,
  deleteExpiredSessions,
  deleteExpiredVerificationTokens,
  deleteLeadsPastRetention,
  deletePendingSubscribersPastRetention,
  deleteResolvedFindingsPastRetention,
} from '@blog/db/queries/retention';
import { sanitizeLogMessage } from '@blog/insight';
import {
  RETENTION_DELETE_BATCH_SIZE,
  RETENTION_KIND,
  RETENTION_LOG,
  type TRetentionKind,
} from '@worker/constants/retention';
import { logger } from '@worker/utils/logger/logger';

type TDeleteBatch = (now: Date, limit: number) => Promise<number>;

export type TRetentionCleanupResult = Partial<Record<TRetentionKind, number>>;

const DELETE_BATCH: Record<TRetentionKind, TDeleteBatch> = {
  [RETENTION_KIND.PENDING_SUBSCRIBERS]: deletePendingSubscribersPastRetention,
  [RETENTION_KIND.LEADS]: deleteLeadsPastRetention,
  [RETENTION_KIND.SESSIONS]: deleteExpiredSessions,
  [RETENTION_KIND.VERIFICATION_TOKENS]: deleteExpiredVerificationTokens,
  [RETENTION_KIND.AUDIT_EVENTS]: deleteAuditEventsPastRetention,
  [RETENTION_KIND.RESOLVED_FINDINGS]: deleteResolvedFindingsPastRetention,
};

async function deleteInBatches(
  deleteBatch: TDeleteBatch,
  now: Date,
): Promise<number> {
  let total = 0;
  let deleted: number;
  do {
    deleted = await deleteBatch(now, RETENTION_DELETE_BATCH_SIZE);
    total += deleted;
  } while (deleted === RETENTION_DELETE_BATCH_SIZE);
  return total;
}

export async function runRetentionCleanups(
  now: Date,
): Promise<TRetentionCleanupResult> {
  const deleted: TRetentionCleanupResult = {};
  for (const kind of Object.values(RETENTION_KIND)) {
    try {
      deleted[kind] = await deleteInBatches(DELETE_BATCH[kind], now);
    } catch (error) {
      logger.error(RETENTION_LOG.CLEANUP_FAILED, {
        kind,
        error: sanitizeLogMessage(error),
      });
    }
  }
  logger.info(RETENTION_LOG.DELETED, { deleted });
  return deleted;
}
