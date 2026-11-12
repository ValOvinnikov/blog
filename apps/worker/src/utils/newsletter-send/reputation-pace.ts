import {
  EMAIL_REPUTATION_LEVEL,
  EMAIL_REPUTATION_WINDOW_DAYS,
} from '@blog/db/constants';
import { pauseNewsletter } from '@blog/db/queries/email-config';
import {
  getEmailReputation,
  type IEmailReputation,
} from '@blog/db/queries/email-usage';
import type { TTenant } from '@blog/db/schema/tenants';
import { emailReputationLevel } from '@blog/db/utils/email-reputation-level/email-reputation-level';
import { buildNewsletterReputationAlertEmail } from '@blog/email';
import {
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
  type TNewsletterSendPace,
} from '@worker/constants/newsletter-send';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { sendOperatorEmail } from '@worker/utils/operator-email/send-operator-email';

async function alertReputation(
  { id: tenantId, name: tenantName }: TTenant,
  reputation: IEmailReputation,
  isSendingPaused: boolean,
): Promise<void> {
  const adminUrl = env.PLATFORM_APP_BASE_URL;
  if (!adminUrl) {
    logger.error(NEWSLETTER_SEND_LOG.NOT_CONFIGURED, { tenantId });
    return;
  }

  await sendOperatorEmail(
    tenantId,
    buildNewsletterReputationAlertEmail({
      tenantName,
      tenantId,
      ...reputation,
      windowDays: EMAIL_REPUTATION_WINDOW_DAYS,
      isSendingPaused,
      adminUrl,
    }),
    {
      noRecipientsEvent: NEWSLETTER_SEND_LOG.ALERT_NO_RECIPIENTS,
      sendFailedEvent: NEWSLETTER_SEND_LOG.ALERT_FAILED,
    },
  );
}

export async function readReputationPace(
  tenant: TTenant,
  { isWarningAlerted }: { isWarningAlerted: boolean },
): Promise<TNewsletterSendPace> {
  const reputation = await getEmailReputation(tenant.id);

  switch (emailReputationLevel(reputation)) {
    case EMAIL_REPUTATION_LEVEL.STOP:
      await pauseNewsletter(tenant.id);
      await alertReputation(tenant, reputation, true);
      return NEWSLETTER_SEND_PACE.STOPPED;
    case EMAIL_REPUTATION_LEVEL.SLOW:
      return NEWSLETTER_SEND_PACE.SLOW;
    case EMAIL_REPUTATION_LEVEL.WARN:
      if (isWarningAlerted) await alertReputation(tenant, reputation, false);
      return NEWSLETTER_SEND_PACE.NORMAL;
    case EMAIL_REPUTATION_LEVEL.OK:
      return NEWSLETTER_SEND_PACE.NORMAL;
  }
}
