import type { TEmailType } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { emailSendCounts } from '@shinefold/db/schema/email-usage';
import { utcMonthStartDay } from '@shinefold/utils/date';
import { and, eq, gte, sql } from 'drizzle-orm';

export async function countEmailSendsThisMonth(
  tenantId: string,
  emailType: TEmailType,
): Promise<number> {
  const [row] = await getDb()
    .select({
      total: sql<number>`coalesce(sum(${emailSendCounts.count}), 0)::int`,
    })
    .from(emailSendCounts)
    .where(
      and(
        eq(emailSendCounts.tenantId, tenantId),
        eq(emailSendCounts.emailType, emailType),
        gte(emailSendCounts.day, utcMonthStartDay(new Date())),
      ),
    );

  return row?.total ?? 0;
}
