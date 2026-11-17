import type { TStudioAccess } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import {
  hasStudioInviteStalled,
  studioAccessOf,
} from '@shinefold/db/utils/studio-access/studio-access';
import { userHasSignedIn } from '@shinefold/db/utils/user-has-signed-in/user-has-signed-in';
import { asc, desc, eq, sql } from 'drizzle-orm';

export type TTenantMember = {
  membershipId: string;
  userId: string;
  email: TMaybeUndefined<string>;
  role: TMembershipRole;
  hasSignedIn: boolean;
  joinedAt: Date;
  studioAccess: TMaybeUndefined<TStudioAccess>;
};

export async function listTenantMembers(
  tenantId: string,
  now: Date = new Date(),
): Promise<TTenantMember[]> {
  const rows = await getDb()
    .select({
      membershipId: memberships.id,
      userId: memberships.userId,
      emailEncrypted: users.emailEncrypted,
      role: memberships.role,
      hasSignedIn: userHasSignedIn(),
      joinedAt: memberships.createdAt,
      inviteSentAt: memberships.sanityInviteSentAt,
      inviteAcceptedAt: memberships.sanityInviteAcceptedAt,
      sanityUserId: memberships.sanityUserId,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.tenantId, tenantId))
    .orderBy(
      desc(sql`${memberships.role} = ${MEMBERSHIP_ROLE.OWNER}`),
      asc(memberships.createdAt),
      asc(memberships.id),
    );

  return rows.map(
    ({
      emailEncrypted,
      inviteSentAt,
      inviteAcceptedAt,
      sanityUserId,
      ...member
    }) => ({
      ...member,
      email: decryptOptionalPersonalValue(emailEncrypted) ?? undefined,
      studioAccess: inviteSentAt
        ? studioAccessOf(
            { inviteAcceptedAt, sanityUserId },
            hasStudioInviteStalled(inviteSentAt, now),
          )
        : undefined,
    }),
  );
}
