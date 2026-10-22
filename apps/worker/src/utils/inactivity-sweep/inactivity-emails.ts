import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { INACTIVITY_STAGE } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  buildInactivityWarningAlertEmail,
  buildOwnerDeletionNoticeEmail,
  buildOwnerInactivityWarningEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import {
  INACTIVITY_ALERT_NO_RECIPIENTS_EVENT,
  INACTIVITY_EMAIL_SEND_FAILED_EVENT,
} from '@worker/constants/inactivity-sweep';
import { OWNER_DASHBOARD_PATH } from '@worker/constants/owner-email';
import { logger } from '@worker/utils/logger/logger';
import { sendOperatorEmail } from '@worker/utils/operator-email/send-operator-email';
import {
  ownerEmailFromAddress,
  tenantSiteUrl,
} from '@worker/utils/owner-email/owner-email-context';
import {
  OWNER_INACTIVITY_EMAIL_COPY,
  type TOwnerInactivityEmail,
} from '@worker/utils/owner-email/owner-inactivity-email-copy';

import { formatInactivityDate } from './inactivity-dates';
import type { TInactivitySweepEnv } from './inactivity-sweep-env';

export type TInactivityEmailInput = {
  tenant: TTenant;
  ownerEmail: string;
  date: Date;
  env: TInactivitySweepEnv;
};

const OWNER_INACTIVITY_EMAIL_BUILDERS = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: buildOwnerInactivityWarningEmail,
  [INACTIVITY_STAGE.DELETION_NOTICE]: buildOwnerDeletionNoticeEmail,
} satisfies Record<TOwnerInactivityEmail, unknown>;

export async function sendOwnerInactivityEmail(
  email: TOwnerInactivityEmail,
  { tenant, ownerEmail, date, env }: TInactivityEmailInput,
): Promise<void> {
  const { id: tenantId, name, locale } = tenant;
  const copy = OWNER_INACTIVITY_EMAIL_COPY[locale];
  const text = copy[email]({
    siteName: name,
    siteUrl: tenantSiteUrl(tenant),
    date: formatInactivityDate(date, locale),
  });
  const message = OWNER_INACTIVITY_EMAIL_BUILDERS[email]({
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    ...text,
    action: {
      label: copy.actionLabel,
      url: new URL(OWNER_DASHBOARD_PATH, env.adminAppBaseUrl).toString(),
    },
  });

  try {
    await sendEmail({
      to: ownerEmail,
      from: ownerEmailFromAddress(),
      ...message,
    });
  } catch (error) {
    logger.error(INACTIVITY_EMAIL_SEND_FAILED_EVENT, {
      tenantId,
      stage: email,
      error: sanitizeLogMessage(error),
    });
  }
}

export async function alertOperatorsOfSuspensionWarning({
  tenant,
  ownerEmail,
  date,
  env,
}: TInactivityEmailInput): Promise<void> {
  const { id: tenantId, name } = tenant;
  const message = buildInactivityWarningAlertEmail({
    tenantName: name,
    tenantId,
    ownerEmail,
    pauseDate: formatInactivityDate(date, LOCALE_ISO_CODES.EN),
    signInUrl: env.adminAppBaseUrl,
  });

  await sendOperatorEmail(tenantId, message, {
    noRecipientsEvent: INACTIVITY_ALERT_NO_RECIPIENTS_EVENT,
    sendFailedEvent: INACTIVITY_EMAIL_SEND_FAILED_EVENT,
  });
}
