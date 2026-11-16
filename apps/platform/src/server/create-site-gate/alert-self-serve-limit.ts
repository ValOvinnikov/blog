import 'server-only';

import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import { sendOperatorAlertEmail } from '@platform/server/email/send-operator-alert-email';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { queries } from '@shinefold/db';
import { buildSelfServeLimitAlertEmail } from '@shinefold/email';
import { hasArrayGotItems } from '@shinefold/utils/primitives';

export const alertSelfServeLimit = async (
  day: string,
  dailyLimit: number,
): Promise<void> => {
  try {
    const recipients = await queries.admins.listSuperadminEmails();
    if (!hasArrayGotItems(recipients)) {
      logger.warn(CREATE_SITE_GATE_LOG.ALERT_NO_RECIPIENTS, { day });
      return;
    }

    const failures = await sendOperatorAlertEmail(
      recipients,
      buildSelfServeLimitAlertEmail({ day, dailyLimit }),
    );
    failures.forEach((reason) => {
      logger.error(CREATE_SITE_GATE_LOG.ALERT_SEND_FAILED, {
        day,
        ...toLoggableError(reason),
      });
    });
  } catch (error) {
    logger.error(CREATE_SITE_GATE_LOG.ALERT_FAILED, {
      day,
      ...toLoggableError(error),
    });
  }
};
