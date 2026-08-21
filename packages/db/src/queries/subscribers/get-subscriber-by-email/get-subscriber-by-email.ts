import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// Reads a subscriber's current row (and therefore `status`) by tenant and
// email, without attempting a write — a lightweight pre-check for an inline
// "already subscribed" validation (e.g. on blur) ahead of a real submit,
// separate from `createPendingSubscriber`'s own built-in duplicate handling
// on the submit path itself.
//
// `email` is normalized (trimmed, lower-cased) the same way
// `createPendingSubscriber` does, so a lookup for `Foo@Example.com` finds
// the row stored for `foo@example.com`.
export async function getSubscriberByEmail(
  tenantId: string,
  email: string,
): Promise<TSubscriber | undefined> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, normalizedEmail),
      ),
    );

  return existing;
}
