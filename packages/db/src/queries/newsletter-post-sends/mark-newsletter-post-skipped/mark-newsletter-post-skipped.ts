import type { TNewsletterSkipReason } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { isUnsettledClaimOf } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';

export type TNewsletterPostSkipDetails = {
  emailsNeeded?: number;
  allowanceLeft?: number;
  postTitle?: string;
  postPublishedAt?: Date;
};

export async function markNewsletterPostSkipped(
  tenantId: string,
  postId: string,
  skipReason: TNewsletterSkipReason,
  details: TNewsletterPostSkipDetails = {},
): Promise<boolean> {
  const { emailsNeeded, allowanceLeft, postTitle, postPublishedAt } = details;
  const marked = await getDb()
    .update(newsletterPostSends)
    .set({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
      skipReason,
      emailsNeeded,
      allowanceLeft,
      postTitle,
      postPublishedAt,
      settledAt: new Date(),
    })
    .where(isUnsettledClaimOf(tenantId, postId))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(marked);
}
