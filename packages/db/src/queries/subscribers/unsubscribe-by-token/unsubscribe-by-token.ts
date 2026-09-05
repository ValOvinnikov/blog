import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

export type TUnsubscribeByTokenResult =
  | { outcome: 'unsubscribed'; subscriber: TSubscriber }
  | { outcome: 'not-found' };

// Deletes the subscriber row matching `unsubscribeToken` with no session at
// all — the whole point of a per-recipient unsubscribe link that has to work
// from an inbox.
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
    return { outcome: 'not-found' };
  }

  return { outcome: 'unsubscribed', subscriber: deleted };
}
