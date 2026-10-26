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
  RETENTION_RUN_DEADLINE_MS,
  type TRetentionKind,
} from '@worker/constants/retention';
import { logger } from '@worker/utils/logger/logger';

type TDeleteBatch = (now: Date, limit: number) => Promise<number>;

interface IBatchRun {
  deleted: number;
  finished: boolean;
}

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
  deadline: number,
): Promise<IBatchRun> {
  let total = 0;
  while (Date.now() < deadline) {
    const deleted = await deleteBatch(now, RETENTION_DELETE_BATCH_SIZE);
    total += deleted;
    if (deleted < RETENTION_DELETE_BATCH_SIZE) {
      return { deleted: total, finished: true };
    }
  }
  return { deleted: total, finished: false };
}

export async function runRetentionCleanups(
  now: Date,
): Promise<TRetentionCleanupResult> {
  const deadline = now.getTime() + RETENTION_RUN_DEADLINE_MS;
  const deleted: TRetentionCleanupResult = {};
  const unfinished: TRetentionKind[] = [];
  for (const kind of Object.values(RETENTION_KIND)) {
    try {
      const run = await deleteInBatches(DELETE_BATCH[kind], now, deadline);
      deleted[kind] = run.deleted;
      if (!run.finished) unfinished.push(kind);
    } catch (error) {
      logger.error(RETENTION_LOG.CLEANUP_FAILED, {
        kind,
        error: sanitizeLogMessage(error),
      });
    }
  }
  if (unfinished.length > 0) {
    logger.warn(RETENTION_LOG.DEADLINE_REACHED, { unfinished });
  }
  logger.info(RETENTION_LOG.DELETED, { deleted });
  return deleted;
}
