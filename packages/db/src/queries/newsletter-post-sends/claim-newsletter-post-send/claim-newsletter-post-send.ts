import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';

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
