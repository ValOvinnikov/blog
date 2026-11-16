import { getDb } from '@shinefold/db/client';
import { users } from '@shinefold/db/schema/auth';
import { encryptPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { eq } from 'drizzle-orm';

// Performs no authorization check: pass the signed-in session's own user id, never a client-supplied one.
export async function updateDisplayName(
  userId: string,
  name: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(users)
    .set({ nameEncrypted: encryptPersonalValue(name) })
    .where(eq(users.id, userId));
}
