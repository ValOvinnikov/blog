import type { TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

export type TSubscriptionStatusResult =
  | { outcome: 'active'; subscriber: TSubscriber }
  | { outcome: 'pending'; subscriber: TSubscriber }
  | TOutcome<'not-subscribed'>;

// `subscribers` has no `userId` column, so the row is found through the
// user's normalized account email.
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
    return toOutcome('not-subscribed');
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

  if (!subscriber) {
    return toOutcome('not-subscribed');
  }

  if (subscriber.status === 'active') {
    return { outcome: 'active', subscriber };
  }

  return { outcome: 'pending', subscriber };
}
