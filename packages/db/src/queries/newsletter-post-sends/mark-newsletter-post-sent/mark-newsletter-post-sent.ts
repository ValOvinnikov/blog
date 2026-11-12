import { getDb } from '@blog/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@blog/db/constants';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';
import { and, eq } from 'drizzle-orm';

export async function markNewsletterPostSent(
  tenantId: string,
  postId: string,
): Promise<void> {
  await getDb()
    .update(newsletterPostSends)
    .set({ outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT, skipReason: null })
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
      ),
    );
}
