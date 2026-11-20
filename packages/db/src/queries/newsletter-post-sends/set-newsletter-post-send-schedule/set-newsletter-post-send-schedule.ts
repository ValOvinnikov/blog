import { getDb } from '@shinefold/db/client';
import { isOpenClaim } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';

export async function setNewsletterPostSendSchedule(
  tenantId: string,
  postId: string,
  claimedAt: Date,
  scheduledFor: Date,
): Promise<boolean> {
  const scheduled = await getDb()
    .update(newsletterPostSends)
    .set({ scheduledFor })
    .where(isOpenClaim(tenantId, postId, claimedAt))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(scheduled);
}
