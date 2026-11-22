import 'server-only';

import {
  GET_STARTED_STEP,
  type TGetStartedStep,
} from '@platform/constants/get-started';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { STUDIO_ACCESS, type TStudioAccess } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import { isUndefined } from '@shinefold/utils/primitives';

export type TGetStarted = {
  tenantId: string;
  siteAddress: string;
  siteUrl: string;
  doneSteps: Record<TGetStartedStep, boolean>;
  studioAccess: TStudioAccess;
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
    studioAccess: studioAccess ?? STUDIO_ACCESS.READY,
  };
};
