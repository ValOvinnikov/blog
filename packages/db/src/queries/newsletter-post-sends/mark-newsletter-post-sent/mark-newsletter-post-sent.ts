import { getDb } from '@blog/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@blog/db/constants';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';
import { hasLength } from '@blog/utils/primitives';
import { and, eq, isNull } from 'drizzle-orm';

export async function markNewsletterPostSent(
  tenantId: string,
  postId: string,
): Promise<boolean> {
  const marked = await getDb()
    .update(newsletterPostSends)
    .set({ outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT })
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
        isNull(newsletterPostSends.outcome),
      ),
    )
    .returning({ postId: newsletterPostSends.postId });

  return hasLength(marked);
}
