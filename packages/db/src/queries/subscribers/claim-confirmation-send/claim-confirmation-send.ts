import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { mintConfirmationToken } from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

export interface IConfirmationSendClaim {
  claimedAt: Date;
  confirmationToken: string;
}

export async function claimConfirmationSend(
  subscriberId: string,
  cooldownMs: number,
): Promise<TMaybeNull<IConfirmationSendClaim>> {
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

  if (!claimed?.confirmationSentAt) return null;

  const { confirmationToken } = mintConfirmationToken();
  return { claimedAt: claimed.confirmationSentAt, confirmationToken };
}
