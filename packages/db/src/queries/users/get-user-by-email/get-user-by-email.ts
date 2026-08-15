import { getDb } from '@blog/db/client';
import { users, type TUser } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

// Case-insensitive: an operator typing an owner email by hand shouldn't need
// to match the sign-in provider's exact stored casing.
export async function getUserByEmail(
  email: string,
): Promise<TUser | undefined> {
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  return user;
}
