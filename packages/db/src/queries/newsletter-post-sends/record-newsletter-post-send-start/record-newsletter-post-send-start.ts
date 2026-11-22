import { getDb } from '@shinefold/db/client';
import { isOpenClaim } from '@shinefold/db/queries/newsletter-post-sends/open-claim-condition';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';

export type TNewsletterPostSendStart = {
  postTitle: string;
  postPublishedAt: Date;
  recipientCount: number;
};

export async function recordNewsletterPostSendStart(
  tenantId: string,
  postId: string,
  claimedAt: Date,
  start: TNewsletterPostSendStart,
): Promise<boolean> {
  const { postTitle, postPublishedAt, recipientCount } = start;
  const recorded = await getDb()
    .update(newsletterPostSends)
    .set({ postTitle, postPublishedAt, recipientCount })
    .where(isOpenClaim(tenantId, postId, claimedAt))
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(recorded);
}
