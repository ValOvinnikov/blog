import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  TENANT_PROVISIONING_STATUS,
  WRITABLE_TENANT_STATUSES,
} from '@shinefold/db/constants';
import { memberStudioAccessColumns } from '@shinefold/db/queries/memberships/member-studio-access';
import {
  memberStudioIdentityColumns,
  toMemberStudioIdentity,
  type TMemberStudioIdentity,
} from '@shinefold/db/queries/memberships/member-studio-identity';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, asc, eq, inArray, isNotNull, or } from 'drizzle-orm';

export type TLockedMemberWithStudioAccess = TMemberStudioIdentity & {
  tenantId: string;
  membershipId: string;
  sanityInviteId: TMaybeUndefined<string>;
};

export async function listLockedMembersWithStudioAccess(): Promise<
  TLockedMemberWithStudioAccess[]
> {
  const rows = await getDb()
    .select({
      tenantId: memberships.tenantId,
      membershipId: memberships.id,
      sanityInviteId: memberStudioAccessColumns.sanityInviteId,
      ...memberStudioIdentityColumns,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(
      and(
        isNotNull(memberships.lockedAt),
        or(...Object.values(memberStudioAccessColumns).map(isNotNull)),
        inArray(tenants.status, WRITABLE_TENANT_STATUSES),
        eq(tenants.provisioningStatus, TENANT_PROVISIONING_STATUS.READY),
      ),
    )
    .orderBy(asc(memberships.lockedAt), asc(memberships.id));

  return rows.map(
    ({ tenantId, membershipId, sanityInviteId, ...identity }) => ({
      tenantId,
      membershipId,
      sanityInviteId: sanityInviteId ?? undefined,
      ...toMemberStudioIdentity(identity),
    }),
  );
}
