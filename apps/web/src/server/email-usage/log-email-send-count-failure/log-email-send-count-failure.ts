import type { IEmailSendCountFailure } from '@blog/config/types';
import { EMAIL_USAGE_LOG } from '@web/constants/email-usage';
import { logger } from '@web/utils/logger/logger';

export const logEmailSendCountFailure = ({
  siteId,
  emailType,
  error,
}: IEmailSendCountFailure): void => {
  logger.warn(EMAIL_USAGE_LOG.SEND_COUNT_FAILED, { siteId, emailType, error });
};
