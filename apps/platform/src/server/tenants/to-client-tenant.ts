import 'server-only';

import type { TPlatformTenantSummary } from '@platform/utils/platform-tenant/platform-tenant';

export type TClientTenant = Pick<
  TPlatformTenantSummary,
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

export const toClientTenant = (
  tenant: TPlatformTenantSummary,
): TClientTenant => {
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
