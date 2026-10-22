import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import {
  decryptPersonalValue,
  requirePersonalEmailIndex,
} from '@blog/db/utils/personal-data/personal-data';
import { eq } from 'drizzle-orm';

// `subscribers` has no `userId` column, so a reader's subscription is found
// through the index of their account email.
export async function findUserSubscriberEmailIndex(
  userId: string,
): Promise<TMaybeUndefined<string>> {
  const [user] = await getDb()
    .select({ emailEncrypted: users.emailEncrypted })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.emailEncrypted) return undefined;

  return requirePersonalEmailIndex(decryptPersonalValue(user.emailEncrypted));
}
