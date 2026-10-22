import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { getDb } from '@blog/db/client';
import type { TUnsubscribeByLinkResult } from '@blog/db/queries/subscribers/unsubscribe-by-token/unsubscribe-by-token';
import { subscribers } from '@blog/db/schema/subscribers';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export async function unsubscribeById(
  tenantId: string,
  subscriberId: string,
): Promise<TUnsubscribeByLinkResult> {
  const [deleted] = await getDb()
    .delete(subscribers)
    .where(
      and(eq(subscribers.tenantId, tenantId), eq(subscribers.id, subscriberId)),
    )
    .returning();

  if (!deleted) {
    return toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND);
  }

  return {
    ...toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
    subscriber: deleted,
  };
}
