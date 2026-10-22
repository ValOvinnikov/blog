import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { sha256Hex } from '@blog/utils/hash';
import { and, eq } from 'drizzle-orm';

// Replaces the stored hash, so the confirm link in any earlier email stops working.
export async function commitConfirmationToken(
  subscriberId: string,
  confirmationToken: string,
): Promise<void> {
  await getDb()
    .update(subscribers)
    .set({ confirmationTokenHash: sha256Hex(confirmationToken) })
    .where(
      and(eq(subscribers.id, subscriberId), eq(subscribers.status, 'pending')),
    );
}
