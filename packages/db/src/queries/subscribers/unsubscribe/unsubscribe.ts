import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// `subscribers.status` only has `pending`/`active` — there is no
// `unsubscribed` value, and adding one would need a schema migration for a
// table with live rows. So unsubscribing **deletes** the row for the user's
// account email instead of flipping a status; a subsequent
// `getSubscriptionStatus` call then naturally reports `not-subscribed` with
// no schema change needed.
//
// A no-op (not an error) if `userId` doesn't resolve to a `users` row, the
// user has no email on file, or no `subscribers` row matches that email —
// matching this package's other delete-style mutations (see
// `removeBookmark`), and letting the caller invoke this unconditionally.
export async function unsubscribe(
  tenantId: string,
  userId: string,
): Promise<void> {
  const db = getDb();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.email) return;

  await db
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, user.email.trim().toLowerCase()),
      ),
    );
}
