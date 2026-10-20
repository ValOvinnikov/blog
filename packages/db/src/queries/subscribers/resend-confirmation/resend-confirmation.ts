import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

// The tokens are returned unrotated: rotating either would break a link
// already in flight.
export type TResendConfirmationResult =
  | { outcome: 'pending'; confirmationToken: string; unsubscribeToken: string }
  | TOutcome<'not-pending'>;

export async function resendConfirmation(
  tenantId: string,
  userId: string,
): Promise<TResendConfirmationResult> {
  const db = getDb();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.email) {
    return toOutcome('not-pending');
  }

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, normalizeEmail(user.email)),
      ),
    );

  if (!subscriber || subscriber.status !== 'pending') {
    return toOutcome('not-pending');
  }

  return {
    outcome: 'pending',
    confirmationToken: subscriber.confirmationToken,
    unsubscribeToken: subscriber.unsubscribeToken,
  };
}
