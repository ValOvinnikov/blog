import 'server-only';

import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export type TClientTenant = Pick<
  TPlatformTenant,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'locale'
  | 'plan'
  | 'status'
  | 'sanityProjectId'
  | 'sanityDataset'
  | 'webhookCreatedAt'
  | 'isArchived'
  | 'archivedAt'
  | 'provisioningStatus'
  | 'provisioningSteps'
  | 'deprovisioningSteps'
  | 'createdAt'
> & {
  hasSanityReadToken: boolean;
};

export const toClientTenant = (tenant: TPlatformTenant): TClientTenant => {
  const {
    id,
    name,
    primaryDomain,
    locale,
    plan,
    status,
    sanityProjectId,
    sanityDataset,
    sanityReadTokenEncrypted,
    webhookCreatedAt,
    isArchived,
    archivedAt,
    provisioningStatus,
    provisioningSteps,
    deprovisioningSteps,
    createdAt,
  } = tenant;

  return {
    id,
    name,
    primaryDomain,
    locale,
    plan,
    status,
    sanityProjectId,
    sanityDataset,
    hasSanityReadToken: Boolean(sanityReadTokenEncrypted),
    webhookCreatedAt,
    isArchived,
    archivedAt,
    provisioningStatus,
    provisioningSteps,
    deprovisioningSteps,
    createdAt,
  };
};
