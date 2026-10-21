import { SUBSCRIBER_OUTCOME, type TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import {
  type ISubscriberTokens,
  mintSubscriberTokens,
} from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

// The tokens are rotated: a stored hash can't be emailed again, so links in
// any earlier confirmation email stop working.
export type TResendConfirmationResult =
  | (TOutcome<typeof SUBSCRIBER_OUTCOME.PENDING> & ISubscriberTokens)
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

  const { tokens, hashes } = mintSubscriberTokens();

  const [rotated] = user?.email
    ? await db
        .update(subscribers)
        .set(hashes)
        .where(
          and(
            eq(subscribers.tenantId, tenantId),
            eq(subscribers.email, normalizeEmail(user.email)),
            eq(subscribers.status, 'pending'),
          ),
        )
        .returning({ id: subscribers.id })
    : [];

  if (!rotated) {
    return toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING);
  }

  return { ...toOutcome(SUBSCRIBER_OUTCOME.PENDING), ...tokens };
}
