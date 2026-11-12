import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSkipReason,
} from '@blog/db/constants';
import { getNewsletterPausedAt } from '@blog/db/queries/email-config';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends';
import { EMAIL_ACCOUNT, isEmailAccountConfigured } from '@blog/email';
import {
  NEWSLETTER_SEND_GATE,
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_SEND_PACE,
  NEWSLETTER_UNIT_MAX_RETRIES,
  type TNewsletterSendPace,
} from '@worker/constants/newsletter-send';
import { loadTenant } from '@worker/units/run-reported-step';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  nearLimitNotices,
  newsletterSkipReason,
} from '@worker/utils/newsletter-send/newsletter-limits';
import { sendOwnerNewsletterNotice } from '@worker/utils/newsletter-send/owner-newsletter-notice';
import { readNewsletterLimits } from '@worker/utils/newsletter-send/read-newsletter-limits';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

export type TNewsletterSendGateResult =
  | { gate: typeof NEWSLETTER_SEND_GATE.SEND; pace: TNewsletterSendPace }
  | { gate: typeof NEWSLETTER_SEND_GATE.SKIPPED }
  | { gate: typeof NEWSLETTER_SEND_GATE.NOT_CONFIGURED };

async function skip(
  tenantId: string,
  postId: string,
  reason: TNewsletterSkipReason,
): Promise<TNewsletterSendGateResult> {
  await markNewsletterPostSkipped(tenantId, postId, reason);
  return { gate: NEWSLETTER_SEND_GATE.SKIPPED };
}

export async function gateNewsletterSend(
  tenantId: string,
  postId: string,
): Promise<TNewsletterSendGateResult> {
  'use step';

  if (
    !isEmailAccountConfigured(EMAIL_ACCOUNT.TENANT) ||
    !env.NEWSLETTER_UNSUBSCRIBE_KEY
  ) {
    logger.error(NEWSLETTER_SEND_LOG.NOT_CONFIGURED, { tenantId, postId });
    return { gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED };
  }

  const tenant = await loadTenant(tenantId);
  if (await getNewsletterPausedAt(tenantId)) {
    return skip(tenantId, postId, NEWSLETTER_SKIP_REASON.SITE_PAUSED);
  }

  const pace = await readReputationPace(tenant, { isOperatorAlerted: true });
  if (pace === NEWSLETTER_SEND_PACE.STOPPED) {
    return skip(tenantId, postId, NEWSLETTER_SKIP_REASON.REPUTATION_STOP);
  }

  const limits = await readNewsletterLimits(tenant);
  const skipReason = newsletterSkipReason(limits);
  if (skipReason) {
    await sendOwnerNewsletterNotice(
      tenant,
      NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED,
      limits,
      skipReason,
    );
    return skip(tenantId, postId, skipReason);
  }

  for (const kind of nearLimitNotices(limits)) {
    await sendOwnerNewsletterNotice(tenant, kind, limits);
  }
  return { gate: NEWSLETTER_SEND_GATE.SEND, pace };
}

gateNewsletterSend.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
