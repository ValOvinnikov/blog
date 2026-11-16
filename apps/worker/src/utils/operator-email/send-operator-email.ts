import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { listSuperadminEmails } from '@shinefold/db/queries/admins';
import { sendEmail, type TSendEmailInput } from '@shinefold/email';
import { sanitizeLogMessage } from '@shinefold/insight';
import { hasLength } from '@shinefold/utils/primitives';
import { DEFAULT_OPERATOR_ALERT_FROM_ADDRESS } from '@worker/constants/operator-alert';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';

type TOperatorEmailEvents = {
  noRecipientsEvent: string;
  sendFailedEvent: string;
};

export async function sendOperatorEmail(
  tenantId: string,
  message: Omit<TSendEmailInput, 'account' | 'to' | 'from'>,
  { noRecipientsEvent, sendFailedEvent }: TOperatorEmailEvents,
): Promise<void> {
  const recipients = await listSuperadminEmails();
  if (!hasLength(recipients)) {
    logger.warn(noRecipientsEvent, { tenantId });
    return;
  }

  const from =
    env.OPERATOR_ALERT_FROM_ADDRESS ?? DEFAULT_OPERATOR_ALERT_FROM_ADDRESS;
  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendEmail({ account: EMAIL_ACCOUNT.PLATFORM, to, from, ...message }),
    ),
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error(sendFailedEvent, {
        tenantId,
        error: sanitizeLogMessage(result.reason),
      });
    }
  }
}
