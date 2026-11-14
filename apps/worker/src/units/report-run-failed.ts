import { sanitizeLogMessage } from '@blog/insight';
import { logger } from '@worker/utils/logger/logger';

export async function reportRunFailed(
  event: string,
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
