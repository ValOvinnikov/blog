import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

// One conditional UPDATE, so concurrent submissions on any server instance claim a window at most once.
export async function claimConfirmationSend(
  subscriberId: string,
  cooldownMs: number,
): Promise<TMaybeNull<Date>> {
  const claimedAt = new Date();
  const cooldownStart = new Date(claimedAt.getTime() - cooldownMs);

  const [claimed] = await getDb()
    .update(subscribers)
    .set({ confirmationSentAt: claimedAt })
    .where(
      and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.status, 'pending'),
        or(
          isNull(subscribers.confirmationSentAt),
          lt(subscribers.confirmationSentAt, cooldownStart),
        ),
      ),
    )
    .returning({ confirmationSentAt: subscribers.confirmationSentAt });

  return claimed?.confirmationSentAt ?? null;
}
