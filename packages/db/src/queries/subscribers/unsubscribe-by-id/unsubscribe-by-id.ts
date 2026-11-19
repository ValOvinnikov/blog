import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import type { TUnsubscribeByLinkResult } from '@shinefold/db/queries/subscribers/unsubscribe-types';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { toOutcome } from '@shinefold/utils/to-outcome';
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
    .returning({ id: subscribers.id });

  return toOutcome(
    deleted ? SUBSCRIBER_OUTCOME.UNSUBSCRIBED : SUBSCRIBER_OUTCOME.NOT_FOUND,
  );
}
