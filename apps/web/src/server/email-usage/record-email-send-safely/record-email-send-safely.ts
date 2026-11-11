import type { TEmailType } from '@blog/config/constants';
import { queries } from '@blog/db';
import { logEmailSendCountFailure } from '@web/server/email-usage/log-email-send-count-failure/log-email-send-count-failure';

export const recordEmailSendSafely = async (
  siteId: string,
  emailType: TEmailType,
): Promise<void> => {
  try {
    await queries.emailUsage.recordEmailSend(siteId, emailType);
  } catch (error) {
    logEmailSendCountFailure({ siteId, emailType, error });
  }
};
