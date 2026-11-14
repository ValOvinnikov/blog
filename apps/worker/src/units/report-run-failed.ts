import { sanitizeLogMessage } from '@blog/insight';
import type { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import type { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { logger } from '@worker/utils/logger/logger';

type TRunFailedEvent =
  | typeof NEWSLETTER_SEND_LOG.RUN_FAILED
  | typeof SCHEDULED_POST_PURGE_LOG.RUN_FAILED;

export async function reportRunFailed(
  event: TRunFailedEvent,
  tenantId: string,
  postId: string,
  error: string,
): Promise<void> {
  'use step';

  logger.error(event, {
    tenantId,
    postId,
    error: sanitizeLogMessage(error),
  });
}
