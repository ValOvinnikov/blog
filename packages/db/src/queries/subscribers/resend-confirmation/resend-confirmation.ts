import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { and, eq } from 'drizzle-orm';

// This never sends email itself — `apps/web` owns that (the shared
// `sendEmail` helper) — its job is validating a `pending` row still exists
// for the user's account email and handing back its **existing**
// `confirmationToken`/`unsubscribeToken` unchanged, so the caller can rebuild
// the same confirmation and unsubscribe URLs and resend them. Neither token
// is rotated here — the same reasoning as `createPendingSubscriber`'s
// "already-pending" branch: rotating either would silently break a link
// already in flight.
export type TResendConfirmationResult =
  | { outcome: 'pending'; confirmationToken: string; unsubscribeToken: string }
  | { outcome: 'not-pending' };

// Returns `not-pending` for every case that isn't "a pending subscriber row
// exists for this user's email" — no matching `users` row, no email on file,
// no `subscribers` row, or a `subscribers` row that's already `active` — the
// caller (web) has nothing to resend in any of those cases.
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
    return { outcome: 'not-pending' };
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
    return { outcome: 'not-pending' };
  }

  return {
    outcome: 'pending',
    confirmationToken: subscriber.confirmationToken,
    unsubscribeToken: subscriber.unsubscribeToken,
  };
}
