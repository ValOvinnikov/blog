import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import {
  GET_STARTED_STEP,
  type TGetStartedStep,
} from '@platform/constants/get-started';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TGetStarted = {
  tenantId: string;
  siteAddress: string;
  siteUrl: string;
  doneSteps: Record<TGetStartedStep, boolean>;
  studioAccess: TOwnerStudioAccess;
};

const isFirstRunViewer = (
  { provisioningStatus, isArchived }: TPlatformTenant,
  { isOwner }: TPlatformViewer,
) =>
  provisioningStatus === TENANT_PROVISIONING_STATUS.READY &&
  !isArchived &&
  isOwner;

export const getStartedFor = async (
  tenant: TPlatformTenant,
  viewer: TPlatformViewer,
): Promise<TMaybeUndefined<TGetStarted>> => {
  if (!isFirstRunViewer(tenant, viewer)) {
    return undefined;
  }

  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);
  const studioAccess = ownerStudioAccessFor(tenant, viewer);
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
    siteUrl: tenant.siteUrl,
    doneSteps,
    studioAccess: studioAccess ?? OWNER_STUDIO_ACCESS.READY,
  };
};
