import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { mintConfirmationToken } from '@shinefold/db/utils/subscriber-tokens/subscriber-tokens';
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
        eq(subscribers.status, SUBSCRIBER_STATUS.PENDING),
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
