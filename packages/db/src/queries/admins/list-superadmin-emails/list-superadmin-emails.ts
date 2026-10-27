import { getDb } from '@blog/db/client';
import { ADMIN_ROLE, PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import { readReportedPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { isNull } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

export async function listSuperadminEmails(): Promise<string[]> {
  const db = getDb();

  const rows = await db
    .select({ email: users.email, emailEncrypted: users.emailEncrypted })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .where(eq(admins.role, ADMIN_ROLE.SUPERADMIN));

  return rows.flatMap(({ email, emailEncrypted }) => {
    const address = readReportedPersonalValue(
      PERSONAL_DATA_OWNER.USER,
      emailEncrypted,
      email,
    );
    return isNull(address) ? [] : [address];
  });
}
