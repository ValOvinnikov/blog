import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TMembershipRole } from '@shinefold/db/constants';
import {
  memberStudioAccessColumns,
  toMemberStudioAccess,
  type TMemberStudioAccess,
} from '@shinefold/db/queries/memberships/member-studio-access';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, eq, isNull } from 'drizzle-orm';

export type TMemberStudioAccessTarget = {
  membershipId: string;
  role: TMembershipRole;
  email: TMaybeUndefined<string>;
  access: TMemberStudioAccess;
};

export async function getMemberStudioAccess(
  tenantId: string,
  membershipId: string,
): Promise<TMaybeUndefined<TMemberStudioAccessTarget>> {
  if (!isUuid(membershipId)) return undefined;

  const [row] = await getDb()
    .select({
      role: memberships.role,
      emailEncrypted: users.emailEncrypted,
      ...memberStudioAccessColumns,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.tenantId, tenantId),
        isNull(memberships.lockedAt),
      ),
    );
  if (!row) return undefined;

  const { role, emailEncrypted, ...access } = row;
  return {
    membershipId,
    role,
    email: decryptOptionalPersonalValue(emailEncrypted) ?? undefined,
    access: toMemberStudioAccess(access),
  };
}
