import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TUnsubscribeByTokenResult =
  { outcome: 'unsubscribed'; subscriber: TSubscriber } | TOutcome<'not-found'>;

export async function unsubscribeByToken(
  tenantId: string,
  token: string,
): Promise<TUnsubscribeByTokenResult> {
  const db = getDb();

  const [deleted] = await db
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.unsubscribeToken, token),
      ),
    )
    .returning();

  if (!deleted) {
    return toOutcome('not-found');
  }

  return { outcome: 'unsubscribed', subscriber: deleted };
}
