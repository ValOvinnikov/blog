import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { hashToken } from '@blog/utils/hash-token';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TConfirmSubscriberResult =
  | { outcome: 'confirmed'; subscriber: TSubscriber }
  | { outcome: 'already-confirmed'; subscriber: TSubscriber }
  | TOutcome<'not-found'>;

// The `UPDATE` is gated on `status = 'pending'` rather than read-then-write,
// so of two concurrent hits on one link exactly one gets `confirmed`.
export async function confirmSubscriber(
  tenantId: string,
  token: string,
): Promise<TConfirmSubscriberResult> {
  const db = getDb();
  const tokenHash = hashToken(token);

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
    .returning();

  if (updated) {
    return { outcome: 'confirmed', subscriber: updated };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.confirmationTokenHash, tokenHash),
      ),
    );

  if (!existing) {
    return toOutcome('not-found');
  }

  return { outcome: 'already-confirmed', subscriber: existing };
}
