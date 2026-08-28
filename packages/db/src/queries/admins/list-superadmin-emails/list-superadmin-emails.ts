import { getDb } from '@blog/db/client';
import { ADMIN_ROLE } from '@blog/db/constants';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import { eq } from 'drizzle-orm';

// Superadmins with no email on file are silently dropped rather than
// notified via `undefined` — there is no useful destination for them.
export async function listSuperadminEmails(): Promise<string[]> {
  const db = getDb();

  const rows = await db
    .select({ email: users.email })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .where(eq(admins.role, ADMIN_ROLE.SUPERADMIN));

  return rows
    .map((row) => row.email)
    .filter((email): email is string => email !== null);
}
