import { getDb } from '@blog/db/client';
import { admins, type TAdmin } from '@blog/db/schema/admins';
import { eq } from 'drizzle-orm';

export async function getAdminByUserId(
  userId: string,
): Promise<TAdmin | undefined> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, userId));

  return existing;
}
