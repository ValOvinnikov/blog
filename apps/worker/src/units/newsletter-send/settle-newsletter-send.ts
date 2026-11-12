import {
  markNewsletterPostSent,
  releaseNewsletterPostSend,
} from '@blog/db/queries/newsletter-post-sends';
import { NEWSLETTER_UNIT_MAX_RETRIES } from '@worker/constants/newsletter-send';

export async function releaseNewsletterSendClaim(
  tenantId: string,
  postId: string,
  claimedAt: string,
): Promise<void> {
  'use step';

  await releaseNewsletterPostSend(tenantId, postId, new Date(claimedAt));
}

releaseNewsletterSendClaim.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;

export async function completeNewsletterSend(
  tenantId: string,
  postId: string,
): Promise<void> {
  'use step';

  await markNewsletterPostSent(tenantId, postId);
}

completeNewsletterSend.maxRetries = NEWSLETTER_UNIT_MAX_RETRIES;
