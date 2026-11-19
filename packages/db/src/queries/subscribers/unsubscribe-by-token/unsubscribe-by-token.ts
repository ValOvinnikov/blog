import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import type { TUnsubscribeByLinkResult } from '@shinefold/db/queries/subscribers/unsubscribe-types';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { sha256Hex } from '@shinefold/utils/hash';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

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
