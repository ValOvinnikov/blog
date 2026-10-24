import { type TOutcome, SUBSCRIBER_OUTCOME } from '@blog/config';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { sha256Hex } from '@blog/utils/hash';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TUnsubscribeByLinkResult = TOutcome<
  typeof SUBSCRIBER_OUTCOME.UNSUBSCRIBED | typeof SUBSCRIBER_OUTCOME.NOT_FOUND
>;

export async function unsubscribeByToken(
  tenantId: string,
  token: string,
): Promise<TUnsubscribeByLinkResult> {
  const db = getDb();
  const tokenHash = sha256Hex(token);

  const [deleted] = await db
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.unsubscribeTokenHash, tokenHash),
      ),
    )
    .returning({ id: subscribers.id });

  return toOutcome(
    deleted ? SUBSCRIBER_OUTCOME.UNSUBSCRIBED : SUBSCRIBER_OUTCOME.NOT_FOUND,
  );
}
