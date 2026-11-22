import { getDb } from '@shinefold/db/client';
import { isOpenClaim } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';

export async function setNewsletterPostSendProgress(
  tenantId: string,
  postId: string,
  claimedAt: Date,
  sentCount: number,
): Promise<boolean> {
  const set = await getDb()
    .update(newsletterPostSends)
    .set({ sentCount })
    .where(isOpenClaim(tenantId, postId, claimedAt))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(set);
}
