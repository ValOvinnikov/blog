import { getDb } from '@blog/db/client';
import type { TNewsletterLimitNoticeKind } from '@blog/db/constants';
import { newsletterLimitNotices } from '@blog/db/schema/newsletter-post-sends';
import { utcMonthStartDay } from '@blog/utils/date';
import { hasLength } from '@blog/utils/primitives';

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
