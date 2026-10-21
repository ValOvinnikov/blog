import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { hashToken } from '@blog/utils/hash-token';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TUnsubscribeByTokenResult =
  { outcome: 'unsubscribed'; subscriber: TSubscriber } | TOutcome<'not-found'>;

export async function unsubscribeByToken(
  tenantId: string,
  token: string,
): Promise<TUnsubscribeByTokenResult> {
  const db = getDb();
  const tokenHash = hashToken(token);

  const [deleted] = await db
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.unsubscribeTokenHash, tokenHash),
      ),
    )
    .returning();

  if (!deleted) {
    return toOutcome('not-found');
  }

  return { outcome: 'unsubscribed', subscriber: deleted };
}
