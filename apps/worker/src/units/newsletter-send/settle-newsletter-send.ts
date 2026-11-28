import { EMAIL_TYPE } from '@shinefold/config/constants';
import { recordEmailSend } from '@shinefold/db/queries/email-usage';
import {
  getNewsletterPostSend,
  markNewsletterPostFailed,
  markNewsletterPostSent,
  releaseNewsletterPostSend,
} from '@shinefold/db/queries/newsletter-post-sends';
import { sanitizeLogMessage } from '@shinefold/insight';
import {
  NEWSLETTER_SEND_LOG,
  NEWSLETTER_UNIT_MAX_RETRIES,
} from '@worker/constants/newsletter-send';
import { logger } from '@worker/utils/logger/logger';

export async function releaseNewsletterSendClaim(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<void> {
  'use step';

  await releaseNewsletterPostSend(tenantId, postId, new Date(claimedAt));
}

releaseNewsletterSendClaim.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;

export async function recordNewsletterSends(
  tenantId: string,
  sentCount: number,
): Promise<void> {
  'use step';

  for (let sent = 0; sent < sentCount; sent++) {
    await recordEmailSend(tenantId, EMAIL_TYPE.NEWSLETTER_ISSUE);
  }
}

recordNewsletterSends.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;

export async function completeNewsletterSend(
  tenantId: string,
  postId: string,
  unreadableCount: number,
): Promise<void> {
  'use step';

  if (unreadableCount > 0) {
    logger.error(NEWSLETTER_SEND_LOG.SUBSCRIBERS_UNREADABLE, {
      tenantId,
      postId,
      count: unreadableCount,
    });
  }
  await markNewsletterPostSent(tenantId, postId);
}

completeNewsletterSend.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;

export async function failNewsletterSend(
  tenantId: string,
  postId: string,
  error: string,
): Promise<void> {
  'use step';

  await markNewsletterPostFailed(tenantId, postId);
  const claim = await getNewsletterPostSend(tenantId, postId);
  logger.error(NEWSLETTER_SEND_LOG.RUN_FAILED, {
    tenantId,
    postId,
    reachedCount: claim?.sentCount,
    recipientCount: claim?.recipientCount,
    error: sanitizeLogMessage(error),
  });
}

failNewsletterSend.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
