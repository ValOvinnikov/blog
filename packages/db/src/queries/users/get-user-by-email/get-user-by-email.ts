import { getDb } from '@blog/db/client';
import { users, type TUser } from '@blog/db/schema/auth';
import { sql } from 'drizzle-orm';

// Case-insensitive on both sides: Auth.js doesn't guarantee provider-side
// email normalization on write, so a stored row can be mixed-case — lower()
// the column too, not just the input.
export async function getUserByEmail(
  email: string,
): Promise<TUser | undefined> {
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`);

  return user;
}
