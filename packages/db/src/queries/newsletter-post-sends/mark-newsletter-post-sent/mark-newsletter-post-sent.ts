import { getDb } from '@shinefold/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { isUnsettledClaimOf } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';
import { sql } from 'drizzle-orm';

export async function markNewsletterPostSent(
  tenantId: string,
  postId: string,
): Promise<boolean> {
  const marked = await getDb()
    .update(newsletterPostSends)
    .set({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
      recipientCount: sql`${newsletterPostSends.sentCount}`,
      settledAt: new Date(),
    })
    .where(isUnsettledClaimOf(tenantId, postId))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(marked);
}
