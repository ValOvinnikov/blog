import 'server-only';

import type { TTenant } from '@blog/db/schema/tenants';

export type TClientTenant = Pick<
  TTenant,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'locale'
  | 'plan'
  | 'status'
  | 'sanityProjectId'
  | 'sanityDataset'
  | 'webhookCreatedAt'
  | 'deprovisionedAt'
  | 'provisioningStatus'
  | 'provisioningSteps'
  | 'deprovisioningSteps'
> & {
  hasSanityReadToken: boolean;
};

export const toClientTenant = (tenant: TTenant): TClientTenant => {
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
    deprovisionedAt,
    provisioningStatus,
    provisioningSteps,
    deprovisioningSteps,
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
    deprovisionedAt,
    provisioningStatus,
    provisioningSteps,
    deprovisioningSteps,
  };
};
