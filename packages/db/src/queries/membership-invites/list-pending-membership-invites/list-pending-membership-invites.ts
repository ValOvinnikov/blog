import { getDb } from '@shinefold/db/client';
import type { TMembershipRole } from '@shinefold/db/constants';
import { membershipInvites } from '@shinefold/db/schema/membership-invites';
import { decryptPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, asc, eq, isNull } from 'drizzle-orm';

export type TPendingMembershipInvite = {
  inviteId: string;
  email: string;
  role: TMembershipRole;
  invitedAt: Date;
};

export async function listPendingMembershipInvites(
  tenantId: string,
): Promise<TPendingMembershipInvite[]> {
  const rows = await getDb()
    .select({
      inviteId: membershipInvites.id,
      emailEncrypted: membershipInvites.emailEncrypted,
      role: membershipInvites.role,
      invitedAt: membershipInvites.createdAt,
    })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        isNull(membershipInvites.consumedAt),
      ),
    )
    .orderBy(asc(membershipInvites.createdAt), asc(membershipInvites.id));

  return rows.map(({ emailEncrypted, ...invite }) => ({
    ...invite,
    email: decryptPersonalValue(emailEncrypted),
  }));
}
