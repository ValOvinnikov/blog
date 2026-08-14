import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// The `/account` 6b section's "resend confirmation" action
// (#1155/#1157/#1158). This never sends email itself — `apps/web` owns that
// (the shared `sendEmail` helper, per the newsletter/auth "shared infra"
// convention) — its job is validating a `pending` row still exists for the
// user's account email and handing back its **existing** `confirmationToken`
// unchanged, so the caller can rebuild the same confirmation URL and resend
// it. The token is deliberately never rotated here — the same reasoning as
// `createPendingSubscriber`'s "already-pending" branch: rotating it would
// silently break any confirmation link already in flight.
export type TResendConfirmationResult =
  | { outcome: 'pending'; confirmationToken: string }
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
        eq(subscribers.email, user.email.trim().toLowerCase()),
      ),
    );

  if (!subscriber || subscriber.status !== 'pending') {
    return { outcome: 'not-pending' };
  }

  return {
    outcome: 'pending',
    confirmationToken: subscriber.confirmationToken,
  };
}
