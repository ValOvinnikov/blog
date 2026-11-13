import type { TMaybeUndefined } from '@blog/config';
import { PLAN_ENTITLEMENTS, type TPlanEntitlements } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  planPageAccess,
  type TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { tenantSiteUrl } from '@platform/utils/routes/routes';
import { type TTrial, trialFor } from '@platform/utils/trial-for/trial-for';

export type TPlatformTenant = TTenant & {
  trial: TMaybeUndefined<TTrial>;
  isArchived: boolean;
  archivedAt: TMaybeUndefined<Date>;
  entitlements: TPlanEntitlements;
  pageAccess: TPlanPageAccess;
  siteUrl: string;
};

export const toPlatformTenant = (
  tenant: TTenant,
  now: Date = new Date(),
): TPlatformTenant => {
  const { plan, deprovisionedAt, primaryDomain } = tenant;

  return {
    ...tenant,
    trial: trialFor(tenant, now),
    isArchived: Boolean(deprovisionedAt),
    archivedAt: deprovisionedAt ?? undefined,
    entitlements: PLAN_ENTITLEMENTS[plan],
    pageAccess: planPageAccess(plan),
    siteUrl: tenantSiteUrl(primaryDomain),
  };
};
