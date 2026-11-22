import {
  EMAIL_ACCOUNT,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import { NEWSLETTER_LIMIT_NOTICE_KIND } from '@shinefold/db/constants';
import { getNewsletterPausedAt } from '@shinefold/db/queries/email-config';
import {
  getNewsletterLimits,
  type TNewsletterLimits,
} from '@shinefold/db/queries/email-usage';
import {
  markNewsletterPostSkipped,
  recordNewsletterPostSendStart,
  type TNewsletterPostSkipDetails,
} from '@shinefold/db/queries/newsletter-post-sends';
import { isEmailAccountConfigured } from '@shinefold/email';
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
  allowanceLeft,
  nearLimitNotices,
  newsletterSkipReason,
} from '@worker/utils/newsletter-send/newsletter-limits';
import { sendOwnerNewsletterNotice } from '@worker/utils/newsletter-send/owner-newsletter-notice';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';
import { readReputationPace } from '@worker/utils/newsletter-send/reputation-pace';

export type TNewsletterSendGateResult =
  | { gate: typeof NEWSLETTER_SEND_GATE.SEND; pace: TNewsletterSendPace }
  | { gate: typeof NEWSLETTER_SEND_GATE.SKIPPED }
  | { gate: typeof NEWSLETTER_SEND_GATE.NOT_CONFIGURED };

export type TNewsletterSendGateInput = {
  tenantId: string;
  postId: string;
  claimedAt: string;
  post: TNewsletterPost;
};

async function skip(
  { tenantId, postId, post }: TNewsletterSendGateInput,
  reason: TNewsletterSkipReason,
  limits?: TNewsletterLimits,
): Promise<TNewsletterSendGateResult> {
  const details: TNewsletterPostSkipDetails = {
    postTitle: post.title,
    postPublishedAt: new Date(post.publishedAt),
    ...(limits && {
      emailsNeeded: limits.activeCount,
      allowanceLeft: allowanceLeft(limits),
    }),
  };
  await markNewsletterPostSkipped(tenantId, postId, reason, details);
  return { gate: NEWSLETTER_SEND_GATE.SKIPPED };
}

export async function gateNewsletterSend(
  input: TNewsletterSendGateInput,
): Promise<TNewsletterSendGateResult> {
  'use step';

  const { tenantId, postId, claimedAt, post } = input;
  if (!isEmailAccountConfigured(EMAIL_ACCOUNT.TENANT)) {
    logger.error(NEWSLETTER_SEND_LOG.NO_TENANT_MAIL_KEY, { tenantId, postId });
    return { gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED };
  }
  if (!env.NEWSLETTER_UNSUBSCRIBE_KEY) {
    logger.error(NEWSLETTER_SEND_LOG.NO_UNSUBSCRIBE_KEY, { tenantId, postId });
    return { gate: NEWSLETTER_SEND_GATE.NOT_CONFIGURED };
  }

  const tenant = await loadTenant(tenantId);
  if (await getNewsletterPausedAt(tenantId)) {
    return skip(input, NEWSLETTER_SKIP_REASON.SITE_PAUSED);
  }

  const pace = await readReputationPace(tenant, { isOperatorAlerted: true });
  if (pace === NEWSLETTER_SEND_PACE.STOPPED) {
    return skip(input, NEWSLETTER_SKIP_REASON.REPUTATION_STOP);
  }

  const limits = await getNewsletterLimits(tenant);
  const skipReason = newsletterSkipReason(limits);
  if (skipReason) {
    await sendOwnerNewsletterNotice(
      tenant,
      NEWSLETTER_LIMIT_NOTICE_KIND.SENDING_PAUSED,
      limits,
      { skipReason, postTitle: post.title },
    );
    return skip(input, skipReason, limits);
  }

  await recordNewsletterPostSendStart(tenantId, postId, new Date(claimedAt), {
    postTitle: post.title,
    postPublishedAt: new Date(post.publishedAt),
    recipientCount: limits.activeCount,
  });
  for (const kind of nearLimitNotices(limits)) {
    await sendOwnerNewsletterNotice(tenant, kind, limits);
  }
  return { gate: NEWSLETTER_SEND_GATE.SEND, pace };
}

gateNewsletterSend.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
