import type { TNewsletterSkipReason } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TNewsletterPostSendOutcome } from '@shinefold/db/constants';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { and, eq } from 'drizzle-orm';

export interface INewsletterPostSend {
  claimedAt: Date;
  outcome: TMaybeUndefined<TNewsletterPostSendOutcome>;
  skipReason: TMaybeUndefined<TNewsletterSkipReason>;
  postTitle: TMaybeUndefined<string>;
  postPublishedAt: TMaybeUndefined<Date>;
  recipientCount: TMaybeUndefined<number>;
  sentCount: number;
  emailsNeeded: TMaybeUndefined<number>;
  allowanceLeft: TMaybeUndefined<number>;
  scheduledFor: TMaybeUndefined<Date>;
  settledAt: TMaybeUndefined<Date>;
  handStartedAt: TMaybeUndefined<Date>;
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
      postTitle: newsletterPostSends.postTitle,
      postPublishedAt: newsletterPostSends.postPublishedAt,
      recipientCount: newsletterPostSends.recipientCount,
      sentCount: newsletterPostSends.sentCount,
      emailsNeeded: newsletterPostSends.emailsNeeded,
      allowanceLeft: newsletterPostSends.allowanceLeft,
      scheduledFor: newsletterPostSends.scheduledFor,
      settledAt: newsletterPostSends.settledAt,
      handStartedAt: newsletterPostSends.handStartedAt,
    })
    .from(newsletterPostSends)
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.postId, postId),
      ),
    );

  if (!row) return undefined;

  const { claimedAt, sentCount } = row;
  return {
    claimedAt,
    outcome: row.outcome ?? undefined,
    skipReason: row.skipReason ?? undefined,
    postTitle: row.postTitle ?? undefined,
    postPublishedAt: row.postPublishedAt ?? undefined,
    recipientCount: row.recipientCount ?? undefined,
    sentCount,
    emailsNeeded: row.emailsNeeded ?? undefined,
    allowanceLeft: row.allowanceLeft ?? undefined,
    scheduledFor: row.scheduledFor ?? undefined,
    settledAt: row.settledAt ?? undefined,
    handStartedAt: row.handStartedAt ?? undefined,
  };
}
