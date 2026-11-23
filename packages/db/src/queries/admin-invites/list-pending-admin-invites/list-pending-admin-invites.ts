import { getDb } from '@shinefold/db/client';
import type { TAdminRole } from '@shinefold/db/constants';
import { adminInvites } from '@shinefold/db/schema/admin-invites';
import { decryptPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { asc, gt } from 'drizzle-orm';

export type TPendingAdminInvite = {
  inviteId: string;
  email: string;
  role: TAdminRole;
  invitedAt: Date;
  expiresAt: Date;
};

export async function listPendingAdminInvites(): Promise<
  TPendingAdminInvite[]
> {
  const rows = await getDb()
    .select({
      inviteId: adminInvites.id,
      emailEncrypted: adminInvites.emailEncrypted,
      role: adminInvites.role,
      invitedAt: adminInvites.createdAt,
      expiresAt: adminInvites.expiresAt,
    })
    .from(adminInvites)
    .where(gt(adminInvites.expiresAt, new Date()))
    .orderBy(asc(adminInvites.createdAt), asc(adminInvites.id));

  return rows.map(({ emailEncrypted, ...invite }) => ({
    ...invite,
    email: decryptPersonalValue(emailEncrypted),
  }));
}
