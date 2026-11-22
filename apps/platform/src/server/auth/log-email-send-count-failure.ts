import { EMAIL_USAGE_LOG } from '@platform/constants/email-usage';
import { logger } from '@platform/utils/logger/logger';
import type { IEmailSendCountFailure } from '@shinefold/config/types';

export const logEmailSendCountFailure = ({
  emailType,
  error,
}: IEmailSendCountFailure): void => {
  logger.warn(EMAIL_USAGE_LOG.SEND_COUNT_FAILED, { emailType, error });
};
