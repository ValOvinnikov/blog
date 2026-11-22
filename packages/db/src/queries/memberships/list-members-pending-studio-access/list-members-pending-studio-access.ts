import { getDb } from '@shinefold/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
  WRITABLE_TENANT_STATUSES,
} from '@shinefold/db/constants';
import { memberships } from '@shinefold/db/schema/memberships';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';

export type TMemberPendingStudioAccess = {
  tenantId: string;
  membershipId: string;
};

export async function listMembersPendingStudioAccess(): Promise<
  TMemberPendingStudioAccess[]
> {
  return getDb()
    .select({ tenantId: memberships.tenantId, membershipId: memberships.id })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(
      and(
        eq(memberships.role, MEMBERSHIP_ROLE.EDITOR),
        isNull(memberships.lockedAt),
        or(
          isNull(memberships.sanityInviteAcceptedAt),
          isNull(memberships.sanityUserId),
        ),
        inArray(tenants.status, WRITABLE_TENANT_STATUSES),
        eq(tenants.provisioningStatus, TENANT_PROVISIONING_STATUS.READY),
      ),
    )
    .orderBy(asc(memberships.createdAt), asc(memberships.id));
}
