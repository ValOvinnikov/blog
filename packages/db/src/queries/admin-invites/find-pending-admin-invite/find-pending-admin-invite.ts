import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TAdminRole } from '@shinefold/db/constants';
import { inviteEmailColumns } from '@shinefold/db/queries/membership-invites/invite-email-columns';
import { adminInvites } from '@shinefold/db/schema/admin-invites';
import { users } from '@shinefold/db/schema/auth';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, eq, gt } from 'drizzle-orm';

export type TPendingAdminInviteWithInviter = {
  role: TAdminRole;
  inviterName: TMaybeNull<string>;
  inviterEmail: TMaybeNull<string>;
};

export async function findPendingAdminInvite(
  email: string,
): Promise<TMaybeUndefined<TPendingAdminInviteWithInviter>> {
  const { emailExactIndex } = inviteEmailColumns(email);

  const [row] = await getDb()
    .select({
      role: adminInvites.role,
      inviterNameEncrypted: users.nameEncrypted,
      inviterEmailEncrypted: users.emailEncrypted,
    })
    .from(adminInvites)
    .leftJoin(users, eq(adminInvites.invitedBy, users.id))
    .where(
      and(
        eq(adminInvites.emailExactIndex, emailExactIndex),
        gt(adminInvites.expiresAt, new Date()),
      ),
    );
  if (!row) return undefined;

  const { role, inviterNameEncrypted, inviterEmailEncrypted } = row;

  return {
    role,
    inviterName: decryptOptionalPersonalValue(inviterNameEncrypted),
    inviterEmail: decryptOptionalPersonalValue(inviterEmailEncrypted),
  };
}
