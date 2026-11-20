import type {
  TNewsletterSendingOffCause,
  TNewsletterSkipReason,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { newsletterPostSends } from '@shinefold/db/schema/newsletter-post-sends';
import { and, desc, eq, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export type TNewsletterPauseSkipReason = Exclude<
  TNewsletterSkipReason,
  TNewsletterSendingOffCause
>;

export type TSkippedNewsletterPost = {
  postId: string;
  postTitle: TMaybeUndefined<string>;
  postPublishedAt: TMaybeUndefined<Date>;
  emailsNeeded: TMaybeUndefined<number>;
  allowanceLeft: TMaybeUndefined<number>;
  skippedAt: Date;
};

export async function getLatestSkippedNewsletterPost(
  tenantId: string,
  reason: TNewsletterPauseSkipReason,
): Promise<TMaybeUndefined<TSkippedNewsletterPost>> {
  const db = getDb();
  const sent = alias(newsletterPostSends, 'sent');
  const lastSentAt = db
    .select({ settledAt: max(sent.settledAt) })
    .from(sent)
    .where(
      and(
        eq(sent.tenantId, tenantId),
        eq(sent.outcome, NEWSLETTER_POST_SEND_OUTCOME.SENT),
      ),
    );

  const [row] = await db
    .select({
      postId: newsletterPostSends.postId,
      postTitle: newsletterPostSends.postTitle,
      postPublishedAt: newsletterPostSends.postPublishedAt,
      emailsNeeded: newsletterPostSends.emailsNeeded,
      allowanceLeft: newsletterPostSends.allowanceLeft,
      settledAt: newsletterPostSends.settledAt,
    })
    .from(newsletterPostSends)
    .where(
      and(
        eq(newsletterPostSends.tenantId, tenantId),
        eq(newsletterPostSends.outcome, NEWSLETTER_POST_SEND_OUTCOME.SKIPPED),
        eq(newsletterPostSends.skipReason, reason),
        sql`${newsletterPostSends.settledAt} > coalesce((${lastSentAt}), '-infinity'::timestamp)`,
      ),
    )
    .orderBy(desc(newsletterPostSends.settledAt))
    .limit(1);

  if (!row?.settledAt) return undefined;

  const { postId, settledAt } = row;
  return {
    postId,
    postTitle: row.postTitle ?? undefined,
    postPublishedAt: row.postPublishedAt ?? undefined,
    emailsNeeded: row.emailsNeeded ?? undefined,
    allowanceLeft: row.allowanceLeft ?? undefined,
    skippedAt: settledAt,
  };
}
