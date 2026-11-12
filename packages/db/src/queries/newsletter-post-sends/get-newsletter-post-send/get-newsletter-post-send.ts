import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type {
  TNewsletterPostSendOutcome,
  TNewsletterSkipReason,
} from '@blog/db/constants';
import { newsletterPostSends } from '@blog/db/schema/newsletter-post-sends';
import { and, eq } from 'drizzle-orm';

export interface INewsletterPostSend {
  claimedAt: Date;
  outcome: TMaybeUndefined<TNewsletterPostSendOutcome>;
  skipReason: TMaybeUndefined<TNewsletterSkipReason>;
}

export async function getNewsletterPostSend(
  tenantId: string,
  postId: string,
): Promise<TMaybeUndefined<INewsletterPostSend>> {
  const [row] = await getDb()
    .select({
      claimedAt: newsletterPostSends.claimedAt,
      outcome: newsletterPostSends.outcome,
      skipReason: newsletterPostSends.skipReason,
    })
    .from(newsletterPostSends)
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
      ),
    );

  if (!row) return undefined;

  return {
    claimedAt: row.claimedAt,
    outcome: row.outcome ?? undefined,
    skipReason: row.skipReason ?? undefined,
  };
}
