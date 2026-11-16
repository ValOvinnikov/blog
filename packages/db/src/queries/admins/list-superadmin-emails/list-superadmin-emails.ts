import { getDb } from '@shinefold/db/client';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { isNull } from '@shinefold/utils/primitives';
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
