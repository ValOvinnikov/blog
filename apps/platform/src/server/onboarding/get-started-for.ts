import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isUndefined } from '@blog/utils/primitives';
import {
  GET_STARTED_STEP,
  type TGetStartedStep,
} from '@platform/constants/get-started';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import { isRealTenantOwner } from '@platform/server/auth/is-real-tenant-owner';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';

export type TGetStarted = {
  tenantId: string;
  siteAddress: string;
  doneSteps: Record<TGetStartedStep, boolean>;
  studioAccess: TOwnerStudioAccess;
};

const isFirstRunViewer = (tenant: TTenant, membership: TMembership) =>
  tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY &&
  !tenant.deprovisionedAt &&
  isRealTenantOwner(membership);

export const getStartedFor = async (
  tenant: TTenant,
  membership: TMembership,
): Promise<TMaybeUndefined<TGetStarted>> => {
  if (!isFirstRunViewer(tenant, membership)) {
    return undefined;
  }

  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);
  const studioAccess = ownerStudioAccessFor(tenant, membership);
  const isEditorUninvited = isUndefined(studioAccess);
  const doneSteps = {
    [GET_STARTED_STEP.LOOK]: !!siteConfig?.lookSavedAt,
    [GET_STARTED_STEP.VOICE]: !!siteConfig?.voiceSavedAt,
    [GET_STARTED_STEP.EDITOR_INVITE]:
      isEditorUninvited || !!tenant.ownerInviteAcceptedAt,
    [GET_STARTED_STEP.FIRST_POST]: !!tenant.firstPostPublishedAt,
  };

  if (Object.values(doneSteps).every(Boolean)) {
    return undefined;
  }

  return {
    tenantId: tenant.id,
    siteAddress: tenant.primaryDomain,
    doneSteps,
    studioAccess: studioAccess ?? OWNER_STUDIO_ACCESS.READY,
  };
};
