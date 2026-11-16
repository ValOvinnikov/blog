import { getDb } from '@shinefold/db/client';
import { users, type TUser } from '@shinefold/db/schema/auth';
import { requireEmailIndex } from '@shinefold/db/utils/personal-data/personal-data';
import { accountEmailIndex } from '@shinefold/utils/encryption';
import { eq } from 'drizzle-orm';

export async function getUsersByEmailIndex(email: string): Promise<TUser[]> {
  return getDb()
    .select()
    .from(users)
    .where(eq(users.emailIndex, requireEmailIndex(email, accountEmailIndex)));
}
