import type { TNewsletterSkipReason } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { hasLength } from '@shinefold/utils/primitives';
import { and, eq, isNull } from 'drizzle-orm';

export async function markNewsletterPostSkipped(
  tenantId: string,
  postId: string,
  skipReason: TNewsletterSkipReason,
): Promise<boolean> {
  const marked = await getDb()
    .update(newsletterPostSends)
    .set({ outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED, skipReason })
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
