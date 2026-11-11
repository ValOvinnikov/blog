import type { TEmailType } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { emailSendCounts } from '@blog/db/schema/email-usage';
import { utcDay } from '@blog/utils/date';
import { sql } from 'drizzle-orm';

export async function recordEmailSend(
  tenantId: string,
  emailType: TEmailType,
): Promise<void> {
  await getDb()
    .insert(emailSendCounts)
    .values({ tenantId, day: utcDay(new Date()), emailType, count: 1 })
    .onConflictDoUpdate({
      target: [
        emailSendCounts.tenantId,
        emailSendCounts.day,
        emailSendCounts.emailType,
      ],
      set: { count: sql`${emailSendCounts.count} + 1` },
    });
}
