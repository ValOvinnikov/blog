import { getDb } from '@blog/db/client';
import { subscribers } from '@blog/db/schema/subscribers';
import { sha256Hex } from '@blog/utils/hash';
import { and, eq } from 'drizzle-orm';

// Call only once the email is sent: replacing the hash retires the confirm link in every earlier email.
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
