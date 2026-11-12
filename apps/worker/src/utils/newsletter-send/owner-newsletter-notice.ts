import type { TMaybeUndefined } from '@blog/config/types';
import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterLimitNoticeKind,
  type TNewsletterSkipReason,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import {
  markNewsletterLimitNoticeSent,
  releaseNewsletterLimitNotice,
} from '@blog/db/queries/newsletter-post-sends';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  buildOwnerNewsletterLimitNearEmail,
  buildOwnerNewsletterPausedEmail,
  EMAIL_ACCOUNT,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@blog/email';
import { sanitizeLogMessage } from '@blog/insight';
import {
  NEWSLETTER_LIMIT_NEAR_RATIO,
  NEWSLETTER_SEND_LOG,
} from '@worker/constants/newsletter-send';
import { OWNER_DASHBOARD_PATH } from '@worker/constants/owner-email';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  sentAfterThisPost,
  type TNewsletterLimits,
} from '@worker/utils/newsletter-send/newsletter-limits';
import { OWNER_DASHBOARD_ACTION_LABEL } from '@worker/utils/owner-email/owner-dashboard-action-label';
import { ownerEmailFromAddress } from '@worker/utils/owner-email/owner-email-context';
import { OWNER_NEWSLETTER_LIMIT_COPY } from '@worker/utils/owner-email/owner-newsletter-limit-copy';
import { OWNER_NEWSLETTER_PAUSED_COPY } from '@worker/utils/owner-email/owner-newsletter-paused-copy';

function buildNoticeMessage(
  { name: siteName, locale }: TTenant,
  kind: TNewsletterLimitNoticeKind,
  limits: TNewsletterLimits,
  skipReason: TMaybeUndefined<TNewsletterSkipReason>,
  dashboardUrl: string,
) {
  const intlLocale = locale.toLowerCase();
  const { format } = new Intl.NumberFormat(intlLocale);
  const { activeCount, bandCeiling, allowance } = limits;
  const text = {
    ...OWNER_NEWSLETTER_LIMIT_COPY[locale],
    ...OWNER_NEWSLETTER_PAUSED_COPY[locale],
  }[kind]({
    siteName,
    activeCount: format(activeCount),
    bandCeiling: format(bandCeiling),
    allowance: format(allowance),
    sentAfterThisPost: format(sentAfterThisPost(limits)),
    nearPercent: new Intl.NumberFormat(intlLocale, { style: 'percent' }).format(
      NEWSLETTER_LIMIT_NEAR_RATIO,
    ),
    isOverBand: skipReason === NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
  });
  const input = {
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    ...text,
    action: { label: OWNER_DASHBOARD_ACTION_LABEL[locale], url: dashboardUrl },
  };

  return kind === NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED
    ? buildOwnerNewsletterPausedEmail(input)
    : buildOwnerNewsletterLimitNearEmail(input);
}

export async function sendOwnerNewsletterNotice(
  tenant: TTenant,
  kind: TNewsletterLimitNoticeKind,
  limits: TNewsletterLimits,
  skipReason?: TNewsletterSkipReason,
): Promise<void> {
  const { id: tenantId } = tenant;
  const platformUrl = env.PLATFORM_APP_BASE_URL;
  if (!platformUrl) {
    logger.error(NEWSLETTER_SEND_LOG.NO_PLATFORM_URL, { tenantId, kind });
    return;
  }
  const ownerEmail = await getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.warn(NEWSLETTER_SEND_LOG.OWNER_EMAIL_MISSING, { tenantId, kind });
    return;
  }

  if (!(await markNewsletterLimitNoticeSent(tenantId, kind))) return;

  try {
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: ownerEmail,
      from: ownerEmailFromAddress(),
      ...buildNoticeMessage(
        tenant,
        kind,
        limits,
        skipReason,
        new URL(OWNER_DASHBOARD_PATH, platformUrl).toString(),
      ),
    });
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED, {
      tenantId,
      kind,
      error: sanitizeLogMessage(error),
    });
    await releaseNewsletterLimitNotice(tenantId, kind);
  }
}
