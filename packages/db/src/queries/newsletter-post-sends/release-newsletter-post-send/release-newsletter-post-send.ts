import { getDb } from '@blog/db/client';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';
import { and, eq, isNull } from 'drizzle-orm';

export async function releaseNewsletterPostSend(
  tenantId: string,
  postId: string,
  claimedAt: Date,
): Promise<void> {
  await getDb()
    .delete(newsletterPostSends)
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
        eq(newsletterPostSends.claimedAt, claimedAt),
        isNull(newsletterPostSends.outcome),
      ),
    );
}
