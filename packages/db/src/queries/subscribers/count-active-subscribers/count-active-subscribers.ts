import { getDb } from '@blog/db/client';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { subscribers } from '@blog/db/schema/subscribers';
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
