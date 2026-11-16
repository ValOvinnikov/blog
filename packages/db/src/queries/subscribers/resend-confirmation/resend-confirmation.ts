import { SUBSCRIBER_OUTCOME, type TOutcome } from '@shinefold/config';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import { findUserSubscriber } from '@shinefold/db/queries/subscribers/user-subscriber';
import { mintConfirmationToken } from '@shinefold/db/utils/subscriber-tokens/subscriber-tokens';
import { toOutcome } from '@shinefold/utils/to-outcome';

export type TResendConfirmationResult =
  | (TOutcome<typeof SUBSCRIBER_OUTCOME.PENDING> & {
      subscriberId: string;
      email: string;
      confirmationToken: string;
    })
  | TOutcome<typeof SUBSCRIBER_OUTCOME.NOT_PENDING>;

export async function resendConfirmation(
  tenantId: string,
  userId: string,
): Promise<TResendConfirmationResult> {
  const subscriber = await findUserSubscriber(tenantId, userId);

  if (subscriber?.status !== SUBSCRIBER_STATUS.PENDING) {
    return toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING);
  }

  const { confirmationToken } = mintConfirmationToken();
  return {
    ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
    subscriberId: subscriber.id,
    email: subscriber.email,
    confirmationToken,
  };
}
