import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { eq } from 'drizzle-orm';

// Performs no authorization check: pass the signed-in session's own user id, never a client-supplied one.
export async function updateDisplayName(
  userId: string,
  name: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(users)
    .set({ name, nameEncrypted: encryptPersonalValue(name) })
    .where(eq(users.id, userId));
}
