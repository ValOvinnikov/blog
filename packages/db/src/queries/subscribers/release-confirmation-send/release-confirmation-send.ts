import { getDb } from '@shinefold/db/client';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { and, eq } from 'drizzle-orm';

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
