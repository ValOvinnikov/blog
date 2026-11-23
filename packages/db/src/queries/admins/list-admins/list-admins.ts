import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TAdminRole, TGrantedVia } from '@shinefold/db/constants';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { asc, eq } from 'drizzle-orm';

export type TAdminListEntry = {
  adminId: string;
  userId: string;
  name: TMaybeNull<string>;
  email: TMaybeNull<string>;
  role: TAdminRole;
  grantedVia: TGrantedVia;
  grantedAt: Date;
};

export async function listAdmins(): Promise<TAdminListEntry[]> {
  const rows = await getDb()
    .select({
      adminId: admins.id,
      userId: admins.userId,
      nameEncrypted: users.nameEncrypted,
      emailEncrypted: users.emailEncrypted,
      role: admins.role,
      grantedVia: admins.grantedVia,
      grantedAt: admins.grantedAt,
    })
    .from(admins)
    .innerJoin(users, eq(admins.userId, users.id))
    .orderBy(asc(admins.grantedAt), asc(admins.id));

  return rows.map(({ nameEncrypted, emailEncrypted, ...admin }) => ({
    ...admin,
    name: decryptOptionalPersonalValue(nameEncrypted),
    email: decryptOptionalPersonalValue(emailEncrypted),
  }));
}
