import 'server-only';

import { queries } from '@blog/db';
import { buildSelfServeLimitAlertEmail, sendEmail } from '@blog/email';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { logger } from '@platform/utils/logger/logger';

export const alertSelfServeLimit = async (
  day: string,
  dailyLimit: number,
): Promise<void> => {
  try {
    const recipients = await queries.admins.listSuperadminEmails();
    if (recipients.length === 0) {
      logger.warn('create_site_gate.alert_no_recipients', { day });
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
          logger.error('create_site_gate.alert_send_failed', { day, error });
        }),
      ),
    );
  } catch (error) {
    logger.error('create_site_gate.alert_failed', { day, error });
  }
};
