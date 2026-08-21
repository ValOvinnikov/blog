import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// `subscribers` has no `userId` column (it's a standalone email
// subscription, not scoped to a signed-in user — see schema/subscribers.ts)
// so this joins through `users.email` to find the matching row, rather than
// the caller passing an email it may not even have settled yet.
export type TSubscriptionStatusResult =
  | { outcome: 'active'; subscriber: TSubscriber }
  | { outcome: 'pending'; subscriber: TSubscriber }
  | { outcome: 'not-subscribed' };

// Resolves `userId`'s newsletter subscription status for `tenantId` via
// their account email — `active`/`pending` mirror `subscribers.status`
// directly; `not-subscribed` covers "no `users` row", "the user has no
// email on file yet" (e.g. a fresh OAuth sign-in before a provider returns
// one), and "no `subscribers` row for that (tenantId, email) pair" — these
// collapse into one terminal state since the caller (the `/account` page)
// renders nothing for any of them. `tenantId` is required because the same
// account email can hold a subscription on more than one tenant.
//
// `users.email` is compared case-insensitively/trimmed against
// `subscribers.email` (normalized at write time in create-pending-subscriber)
// rather than relying on Postgres's case-sensitive `text` equality to happen
// to line up with whatever casing a sign-in provider returned.
export async function getSubscriptionStatus(
  tenantId: string,
  userId: string,
): Promise<TSubscriptionStatusResult> {
  const db = getDb();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.email) {
    return { outcome: 'not-subscribed' };
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

  if (!subscriber) {
    return { outcome: 'not-subscribed' };
  }

  if (subscriber.status === 'active') {
    return { outcome: 'active', subscriber };
  }

  return { outcome: 'pending', subscriber };
}
