import { getDb } from '@shinefold/db/client';
import { isOpenClaim } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';

export async function releaseNewsletterPostSend(
  tenantId: string,
  postId: string,
  claimedAt: Date,
): Promise<void> {
  await getDb()
    .delete(newsletterPostSends)
    .where(isOpenClaim(tenantId, postId, claimedAt));
}
