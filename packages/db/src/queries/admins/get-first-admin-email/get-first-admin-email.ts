import { getDb } from '@blog/db/client';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import { asc, eq } from 'drizzle-orm';

// "First" means earliest-granted, not any particular `role` value — the
// platform's original superadmin is whoever the `admins` table's oldest row
// belongs to.
export async function getFirstAdminEmail(): Promise<string | undefined> {
  const db = getDb();

  const [admin] = await db
    .select({ email: users.email })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .orderBy(asc(admins.createdAt))
    .limit(1);

  return admin?.email ?? undefined;
}
