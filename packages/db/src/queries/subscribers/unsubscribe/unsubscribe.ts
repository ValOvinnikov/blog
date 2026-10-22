import { getDb } from '@blog/db/client';
import { findUserSubscriber } from '@blog/db/queries/subscribers/user-subscriber';
import { subscribers } from '@blog/db/schema/subscribers';
import { eq } from 'drizzle-orm';

// `subscribers.status` has no `unsubscribed` value, so unsubscribing deletes
// the row. A no-op when the user, their email or a matching row is missing.
export async function unsubscribe(
  tenantId: string,
  userId: string,
): Promise<void> {
  const subscriber = await findUserSubscriber(tenantId, userId);
  if (!subscriber) return;

  await getDb().delete(subscribers).where(eq(subscribers.id, subscriber.id));
}
