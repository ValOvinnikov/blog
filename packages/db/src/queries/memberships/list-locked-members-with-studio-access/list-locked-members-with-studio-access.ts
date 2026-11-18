import { getDb } from '@shinefold/db/client';
import { memberStudioAccessColumns } from '@shinefold/db/queries/memberships/member-studio-access';
import {
  memberStudioIdentityColumns,
  toMemberStudioIdentity,
  type TMemberStudioIdentity,
} from '@shinefold/db/queries/memberships/member-studio-identity';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { and, asc, eq, isNotNull, or } from 'drizzle-orm';

export type TLockedMemberWithStudioAccess = TMemberStudioIdentity & {
  tenantId: string;
  membershipId: string;
};

export async function listLockedMembersWithStudioAccess(): Promise<
  TLockedMemberWithStudioAccess[]
> {
  const rows = await getDb()
    .select({
      tenantId: memberships.tenantId,
      membershipId: memberships.id,
      ...memberStudioIdentityColumns,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        isNotNull(memberships.lockedAt),
        or(...Object.values(memberStudioAccessColumns).map(isNotNull)),
      ),
    )
    .orderBy(asc(memberships.lockedAt), asc(memberships.id));

  return rows.map(({ tenantId, membershipId, ...identity }) => ({
    tenantId,
    membershipId,
    ...toMemberStudioIdentity(identity),
  }));
}
