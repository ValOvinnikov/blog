import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import {
  type ISubscriberTokens,
  mintSubscriberTokens,
} from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { and, eq, isNull, lt, or } from 'drizzle-orm';

export interface IConfirmationSendClaim {
  claimedAt: Date;
  tokens: ISubscriberTokens;
}

// A claim replaces both stored hashes, so links in any earlier confirmation email stop working.
export async function claimConfirmationSend(
  subscriberId: string,
  cooldownMs: number,
): Promise<TMaybeNull<IConfirmationSendClaim>> {
  const claimedAt = new Date();
  const cooldownStart = new Date(claimedAt.getTime() - cooldownMs);
  const { tokens, hashes } = mintSubscriberTokens();

  const [claimed] = await getDb()
    .update(subscribers)
    .set({ confirmationSentAt: claimedAt, ...hashes })
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

  return { claimedAt: claimed.confirmationSentAt, tokens };
}
