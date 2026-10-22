import { SUBSCRIBER_OUTCOME, type TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { sha256Hex } from '@blog/utils/hash';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TConfirmSubscriberResult = TOutcome<
  | typeof SUBSCRIBER_OUTCOME.CONFIRMED
  | typeof SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED
  | typeof SUBSCRIBER_OUTCOME.NOT_FOUND
>;

// The `UPDATE` is gated on `status = 'pending'` rather than read-then-write,
// so of two concurrent hits on one link exactly one gets `confirmed`.
export async function confirmSubscriber(
  tenantId: string,
  token: string,
): Promise<TConfirmSubscriberResult> {
  const db = getDb();
  const tokenHash = sha256Hex(token);

  const [updated] = await db
    .update(subscribers)
    .set({ status: 'active', confirmedAt: new Date() })
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.confirmationTokenHash, tokenHash),
        eq(subscribers.status, 'pending'),
      ),
    )
    .returning({ id: subscribers.id });

  if (updated) return toOutcome(SUBSCRIBER_OUTCOME.CONFIRMED);

  const [existing] = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.confirmationTokenHash, tokenHash),
      ),
    );

  return toOutcome(
    existing
      ? SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED
      : SUBSCRIBER_OUTCOME.NOT_FOUND,
  );
}
