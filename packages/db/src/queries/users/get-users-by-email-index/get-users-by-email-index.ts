import { getDb } from '@blog/db/client';
import { users, type TUser } from '@blog/db/schema/auth';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { accountEmailIndex } from '@blog/utils/encryption';
import { eq } from 'drizzle-orm';

export async function getUsersByEmailIndex(email: string): Promise<TUser[]> {
  return getDb()
    .select()
    .from(users)
    .where(eq(users.emailIndex, requireEmailIndex(email, accountEmailIndex)));
}
