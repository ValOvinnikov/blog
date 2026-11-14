import { sanitizeLogMessage } from '@blog/insight';
import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { logger } from '@worker/utils/logger/logger';

export async function reportScheduledPostPurgeFailed(
  tenantId: string,
  postId: string,
  error: string,
): Promise<void> {
  'use step';

  logger.error(SCHEDULED_POST_PURGE_LOG.RUN_FAILED, {
    tenantId,
    postId,
    error: sanitizeLogMessage(error),
  });
}
