import type { TMaybeUndefined } from '@blog/config';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  OWNER_ACCESS_STALL_AFTER_MS,
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
  | 'provisioningSteps'
>;

const isKnownOwnerCheck = (detail: unknown) =>
  Object.values(ELEVATE_TENANT_OWNER_OUTCOME).some(
    (outcome) => outcome === detail,
  );

const isStalled = (
  { ownerInviteSentAt, provisioningSteps }: TOwnerAccessTenant,
  now: Date,
) => {
  const ownerCheck =
    provisioningSteps?.[TENANT_PROVISIONING_STEP.OWNER_ELEVATION]?.detail;

  if (isKnownOwnerCheck(ownerCheck)) {
    return ownerCheck === ELEVATE_TENANT_OWNER_OUTCOME.STALLED;
  }
  return (
    !!ownerInviteSentAt &&
    now.getTime() - ownerInviteSentAt.getTime() >= OWNER_ACCESS_STALL_AFTER_MS
  );
};

// The worker records acceptance with the Sanity user only after granting administrator; READY must not reopen when that role later changes.
const accessStateOf = (
  tenant: TOwnerAccessTenant,
  now: Date,
): TOwnerStudioAccess => {
  const { ownerInviteAcceptedAt, ownerSanityUserId } = tenant;

  if (ownerInviteAcceptedAt && ownerSanityUserId) {
    return OWNER_STUDIO_ACCESS.READY;
  }
  if (ownerInviteAcceptedAt || ownerSanityUserId) {
    return OWNER_STUDIO_ACCESS.ACTIVATING;
  }
  return isStalled(tenant, now)
    ? OWNER_STUDIO_ACCESS.STALLED
    : OWNER_STUDIO_ACCESS.INVITE_SENT;
};

/** Undefined when the viewer is not the tenant's own OWNER, or the worker never invited them — those get the Studio unconditionally. */
export const ownerStudioAccessFor = (
  tenant: TOwnerAccessTenant,
  membership: TMembership,
  now: Date = new Date(),
): TMaybeUndefined<TOwnerStudioAccess> => {
  const isRealOwner =
    isTenantOwner(membership) && !isVirtualAdminMembership(membership);

  return isRealOwner && tenant.ownerInviteSentAt
    ? accessStateOf(tenant, now)
    : undefined;
};
