import {
  NEWSLETTER_HAND_SENDABLE_SKIP_REASONS,
  type TNewsletterSkipReason,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { and, eq, inArray, sql } from 'drizzle-orm';

export type TNewsletterPostHandStart = {
  claimedAt: Date;
  clearedSkipReason: TMaybeUndefined<TNewsletterSkipReason>;
};

export async function startNewsletterPostSendByHand(
  tenantId: string,
  postId: string,
): Promise<TMaybeUndefined<TNewsletterPostHandStart>> {
  const db = getDb();
  const startedAt = new Date();
  const prior = db.$with('prior').as(
    db
      .select({ skipReason: newsletterPostSends.skipReason })
      .from(newsletterPostSends)
      .where(
        and(
          eq(newsletterPostSends.tenantId, tenantId),
          eq(newsletterPostSends.postId, postId),
        ),
      ),
  );

  const [started] = await db
    .with(prior)
    .insert(newsletterPostSends)
    .values({
      tenantId,
      postId,
      claimedAt: startedAt,
      handStartedAt: startedAt,
    })
    .onConflictDoUpdate({
      target: [newsletterPostSends.tenantId, newsletterPostSends.postId],
      set: {
        claimedAt: startedAt,
        handStartedAt: startedAt,
        outcome: null,
        skipReason: null,
        emailsNeeded: null,
        allowanceLeft: null,
        scheduledFor: null,
        recipientCount: null,
        sentCount: 0,
        settledAt: null,
      },
      setWhere: and(
        eq(newsletterPostSends.outcome, NEWSLETTER_POST_SEND_OUTCOME.SKIPPED),
        inArray(
          newsletterPostSends.skipReason,
          NEWSLETTER_HAND_SENDABLE_SKIP_REASONS,
        ),
      ),
    })
    .returning({
      claimedAt: newsletterPostSends.claimedAt,
      clearedSkipReason: sql<
        TMaybeNull<TNewsletterSkipReason>
      >`(select ${prior.skipReason} from ${prior})`,
    });

  if (!started) return undefined;

  return {
    claimedAt: started.claimedAt,
    clearedSkipReason: started.clearedSkipReason ?? undefined,
  };
}
