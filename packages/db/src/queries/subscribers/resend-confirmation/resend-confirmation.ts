import { SUBSCRIBER_OUTCOME, type TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { findUserSubscriberEmailIndex } from '@blog/db/queries/subscribers/user-email-index';
import { subscribers } from '@blog/db/schema/subscribers';
import { mintConfirmationToken } from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TResendConfirmationResult =
  | (TOutcome<typeof SUBSCRIBER_OUTCOME.PENDING> & {
      subscriberId: string;
      confirmationToken: string;
    })
  | TOutcome<typeof SUBSCRIBER_OUTCOME.NOT_PENDING>;

export async function resendConfirmation(
  tenantId: string,
  userId: string,
): Promise<TResendConfirmationResult> {
  const emailIndex = await findUserSubscriberEmailIndex(userId);

  const [pending] = emailIndex
    ? await getDb()
        .select({ id: subscribers.id })
        .from(subscribers)
        .where(
          and(
            eq(subscribers.tenantId, tenantId),
            eq(subscribers.emailIndex, emailIndex),
            eq(subscribers.status, 'pending'),
          ),
        )
    : [];

  if (!pending) {
    return toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING);
  }

  const { confirmationToken } = mintConfirmationToken();
  return {
    ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
    subscriberId: pending.id,
    confirmationToken,
  };
}
