import { getDb } from '@blog/db/client';
import { ADMIN_ROLE } from '@blog/db/constants';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import { decryptOptionalPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { isNull } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

export async function listSuperadminEmails(): Promise<string[]> {
  const db = getDb();

  const rows = await db
    .select({ emailEncrypted: users.emailEncrypted })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .where(eq(admins.role, ADMIN_ROLE.SUPERADMIN));

  return rows.flatMap(({ emailEncrypted }) => {
    const address = decryptOptionalPersonalValue(emailEncrypted);
    return isNull(address) ? [] : [address];
  });
}
