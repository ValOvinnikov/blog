import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';

export interface INewsletterPostSendClaim {
  claimedAt: Date;
}

export async function claimNewsletterPostSend(
  tenantId: string,
  postId: string,
): Promise<TMaybeNull<INewsletterPostSendClaim>> {
  const [claimed] = await getDb()
    .insert(newsletterPostSends)
    .values({ tenantId, postId, claimedAt: new Date() })
    .onConflictDoNothing()
    .returning({ claimedAt: newsletterPostSends.claimedAt });

  return claimed ?? null;
}
