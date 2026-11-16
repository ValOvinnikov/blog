import { getDb } from '@shinefold/db/client';
import type { TNewsletterLimitNoticeKind } from '@shinefold/db/constants';
import { newsletterLimitNotices } from '@shinefold/db/schema/newsletter-post-sends';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { hasLength } from '@shinefold/utils/primitives';

export async function markNewsletterLimitNoticeSent(
  tenantId: string,
  kind: TNewsletterLimitNoticeKind,
): Promise<boolean> {
  const sentAt = new Date();
  const marked = await getDb()
    .insert(newsletterLimitNotices)
    .values({ tenantId, kind, month: utcMonthStartDay(sentAt), sentAt })
    .onConflictDoNothing()
    .returning({ sentAt: newsletterLimitNotices.sentAt });

  return hasLength(marked);
}
