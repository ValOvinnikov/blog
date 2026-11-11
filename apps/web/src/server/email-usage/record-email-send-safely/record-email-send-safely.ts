import type { TEmailType } from '@blog/config/constants';
import { queries } from '@blog/db';
import { EMAIL_USAGE_LOG } from '@web/constants/email-usage';
import { logger } from '@web/utils/logger/logger';

export const recordEmailSendSafely = async (
  siteId: string,
  emailType: TEmailType,
): Promise<void> => {
  try {
    await queries.emailUsage.recordEmailSend(siteId, emailType);
  } catch (error) {
    logger.warn(EMAIL_USAGE_LOG.SEND_COUNT_FAILED, {
      siteId,
      emailType,
      error,
    });
  }
};
