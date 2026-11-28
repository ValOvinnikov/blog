import { getDb } from '@shinefold/db/client';
import type { TNewsletterLimitNoticeKind } from '@shinefold/db/constants';
import { newsletterLimitNotices } from '@shinefold/db/schema/newsletter-post-sends';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { hasLength } from '@shinefold/utils/primitives';
import { lt } from 'drizzle-orm';

export async function markNewsletterLimitNoticeSent(
  tenantId: string,
  kind: TNewsletterLimitNoticeKind,
  { since }: { since?: Date } = {},
): Promise<boolean> {
  const sentAt = new Date();
  const insert = getDb()
    .insert(newsletterLimitNotices)
    .values({ tenantId, kind, month: utcMonthStartDay(sentAt), sentAt });
  const marked = await (
    since
      ? insert.onConflictDoUpdate({
          target: [
            newsletterLimitNotices.tenantId,
            newsletterLimitNotices.month,
            newsletterLimitNotices.kind,
          ],
          set: { sentAt },
          setWhere: lt(newsletterLimitNotices.sentAt, since),
        })
      : insert.onConflictDoNothing()
  ).returning({ sentAt: newsletterLimitNotices.sentAt });

  return hasLength(marked);
}
