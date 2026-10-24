import 'server-only';

import { queries } from '@blog/db';
import { buildSelfServeLimitAlertEmail, sendEmail } from '@blog/email';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { CREATE_SITE_GATE_LOG } from '@platform/constants/create-site-gate';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { logger } from '@platform/utils/logger/logger';

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

    const { subject, html } = buildSelfServeLimitAlertEmail({
      day,
      dailyLimit,
    });
    const from = resolveOperatorAlertFromAddress();
    await Promise.all(
      recipients.map((to) =>
        sendEmail({ to, from, subject, html }).catch((error: unknown) => {
          logger.error(CREATE_SITE_GATE_LOG.ALERT_SEND_FAILED, { day, error });
        }),
      ),
    );
  } catch (error) {
    logger.error(CREATE_SITE_GATE_LOG.ALERT_FAILED, { day, error });
  }
};
