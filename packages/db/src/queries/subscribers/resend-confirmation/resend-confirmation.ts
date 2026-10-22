import { SUBSCRIBER_OUTCOME, type TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
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
  const db = getDb();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  const [pending] = user?.email
    ? await db
        .select({ id: subscribers.id })
        .from(subscribers)
        .where(
          and(
            eq(subscribers.tenantId, tenantId),
            eq(subscribers.email, normalizeEmail(user.email)),
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
