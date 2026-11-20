import { getDb } from '@shinefold/db/client';
import { isOpenClaim } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';
import { sql } from 'drizzle-orm';

export async function addNewsletterPostSendProgress(
  tenantId: string,
  postId: string,
  claimedAt: Date,
  sent: number,
): Promise<boolean> {
  const added = await getDb()
    .update(newsletterPostSends)
    .set({ sentCount: sql`${newsletterPostSends.sentCount} + ${sent}` })
    .where(isOpenClaim(tenantId, postId, claimedAt))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(added);
}
