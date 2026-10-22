import { getDb } from '@blog/db/client';
import { findUserSubscriberEmailIndex } from '@blog/db/queries/subscribers/user-email-index';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// `subscribers.status` has no `unsubscribed` value, so unsubscribing deletes
// the row. A no-op when the user, their email or a matching row is missing.
export async function unsubscribe(
  tenantId: string,
  userId: string,
): Promise<void> {
  const emailIndex = await findUserSubscriberEmailIndex(userId);
  if (!emailIndex) return;

  await getDb()
    .delete(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.emailIndex, emailIndex),
      ),
    );
}
