import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  memberStudioIdentityColumns,
  toMemberStudioIdentity,
  type TMemberStudioIdentity,
} from '@shinefold/db/queries/memberships/member-studio-identity';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { and, eq } from 'drizzle-orm';

export async function getMemberStudioIdentity(
  tenantId: string,
  membershipId: string,
): Promise<TMaybeUndefined<TMemberStudioIdentity>> {
  if (!isUuid(membershipId)) return undefined;

  const [row] = await getDb()
    .select(memberStudioIdentityColumns)
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(eq(memberships.id, membershipId), eq(memberships.tenantId, tenantId)),
    );

  return row && toMemberStudioIdentity(row);
}
