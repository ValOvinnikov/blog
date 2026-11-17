import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TStudioAccess } from '@shinefold/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
} from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  hasStudioInviteStalled,
  studioAccessOf,
} from '@shinefold/db/utils/studio-access/studio-access';

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
  return hasStudioInviteStalled(ownerInviteSentAt, now);
};

/** Undefined when the viewer is not the tenant's own OWNER, or the worker never invited them — those get the Studio unconditionally. */
export const ownerStudioAccessFor = (
  tenant: TOwnerAccessTenant,
  { isOwner }: TPlatformViewer,
  now: Date = new Date(),
): TMaybeUndefined<TStudioAccess> => {
  const { ownerInviteSentAt, ownerInviteAcceptedAt, ownerSanityUserId } =
    tenant;

  return isOwner && ownerInviteSentAt
    ? studioAccessOf(
        {
          inviteAcceptedAt: ownerInviteAcceptedAt,
          sanityUserId: ownerSanityUserId,
        },
        isStalled(tenant, now),
      )
    : undefined;
};
