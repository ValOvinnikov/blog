import { getDb } from '@shinefold/db/client';
import type { TNewsletterLimitNoticeKind } from '@shinefold/db/constants';
import { newsletterLimitNotices } from '@shinefold/db/schema/newsletter-post-sends';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { and, eq } from 'drizzle-orm';

export async function releaseNewsletterLimitNotice(
  tenantId: string,
  kind: TNewsletterLimitNoticeKind,
): Promise<void> {
  await getDb()
    .delete(newsletterLimitNotices)
    .where(
      and(
        eq(newsletterLimitNotices.tenantId, tenantId),
        eq(newsletterLimitNotices.kind, kind),
        eq(newsletterLimitNotices.month, utcMonthStartDay(new Date())),
      ),
    );
}
