import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { users, type TUser } from '@blog/db/schema/auth';
import { requireAccountEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { eq } from 'drizzle-orm';

export async function getUserByEmailIndex(
  email: string,
): Promise<TMaybeUndefined<TUser>> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.emailIndex, requireAccountEmailIndex(email)));

  return user;
}
