import { getDb } from '@blog/db/client';
import {
  NEWSLETTER_POST_SEND_OUTCOME,
  type TNewsletterSkipReason,
} from '@blog/db/constants';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';
import { and, eq } from 'drizzle-orm';

export async function markNewsletterPostSkipped(
  tenantId: string,
  postId: string,
  skipReason: TNewsletterSkipReason,
): Promise<void> {
  await getDb()
    .update(newsletterPostSends)
    .set({ outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED, skipReason })
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
      ),
    );
}
