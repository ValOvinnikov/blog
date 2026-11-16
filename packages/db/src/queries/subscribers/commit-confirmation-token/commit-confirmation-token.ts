import { getDb } from '@shinefold/db/client';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { sha256Hex } from '@shinefold/utils/hash';
import { and, eq, isNull } from 'drizzle-orm';

// Call only once the email is sent: replacing the hash retires the confirm link in every earlier email.
export async function commitConfirmationToken(
  subscriberId: string,
  confirmationToken: string,
): Promise<void> {
  await getDb()
    .update(subscribers)
    .set({ confirmationTokenHash: sha256Hex(confirmationToken) })
    .where(
      and(eq(subscribers.id, subscriberId), isNull(subscribers.confirmedAt)),
    );
}
