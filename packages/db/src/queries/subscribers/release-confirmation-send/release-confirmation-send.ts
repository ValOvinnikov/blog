import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

// Gives back a claim whose email never went out, so the reader can retry without waiting out the cooldown.
export async function releaseConfirmationSend(
  subscriberId: string,
  claimedAt: Date,
): Promise<void> {
  await getDb()
    .update(subscribers)
    .set({ confirmationSentAt: null })
    .where(
      and(
        eq(subscribers.id, subscriberId),
        eq(subscribers.confirmationSentAt, claimedAt),
      ),
    );
}
