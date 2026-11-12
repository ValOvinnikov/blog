import { getDb } from '@blog/db/client';
import type { TNewsletterLimitNoticeKind } from '@blog/db/constants';
import { newsletterLimitNotices } from '@blog/db/schema/newsletter-post-sends';
import { utcMonthStartDay } from '@blog/utils/date';
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
