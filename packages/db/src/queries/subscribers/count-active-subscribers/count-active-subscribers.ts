import { getDb } from '@shinefold/db/client';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { and, count, eq } from 'drizzle-orm';

export async function countActiveSubscribers(
  tenantId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.status, SUBSCRIBER_STATUS.ACTIVE),
      ),
    );

  return row?.total ?? 0;
}
