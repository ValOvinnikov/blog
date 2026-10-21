import type { TMaybeUndefined } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  SANITY_PROJECT_ROLE,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';

type TOwnerAccessTenant = Pick<
  TTenant,
  | 'ownerInviteSentAt'
  | 'ownerInviteAcceptedAt'
  | 'ownerSanityUserId'
  | 'ownerSanityRole'
  | 'provisioningSteps'
>;

const accessStateOf = ({
  ownerInviteAcceptedAt,
  ownerSanityUserId,
  ownerSanityRole,
  provisioningSteps,
}: TOwnerAccessTenant): TOwnerStudioAccess => {
  if (
    ownerInviteAcceptedAt &&
    ownerSanityRole === SANITY_PROJECT_ROLE.ADMINISTRATOR
  ) {
    return OWNER_STUDIO_ACCESS.READY;
  }
  if (ownerInviteAcceptedAt || ownerSanityUserId) {
    return OWNER_STUDIO_ACCESS.ACTIVATING;
  }
  const ownerCheck =
    provisioningSteps?.[TENANT_PROVISIONING_STEP.OWNER_ELEVATION]?.detail;

  return ownerCheck === ELEVATE_TENANT_OWNER_OUTCOME.STALLED
    ? OWNER_STUDIO_ACCESS.STALLED
    : OWNER_STUDIO_ACCESS.INVITE_SENT;
};

/** Undefined when the viewer is not the tenant's own OWNER, or the worker never invited them — those get the Studio unconditionally. */
export const ownerStudioAccessFor = (
  tenant: TOwnerAccessTenant,
  membership: TMembership,
): TMaybeUndefined<TOwnerStudioAccess> => {
  const isRealOwner =
    isTenantOwner(membership) && !isVirtualAdminMembership(membership);

  return isRealOwner && tenant.ownerInviteSentAt
    ? accessStateOf(tenant)
    : undefined;
};
