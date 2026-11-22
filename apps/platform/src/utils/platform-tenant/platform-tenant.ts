import {
  grantedEntitlements,
  type TGrantedEntitlements,
} from '@platform/utils/granted-entitlements/granted-entitlements';
import {
  entitlementPageAccess,
  type TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';
import { tenantSiteUrl } from '@platform/utils/routes/routes';
import { type TTrial, trialFor } from '@platform/utils/trial-for/trial-for';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TPlatformTenantSummary = TTenant & {
  trial: TMaybeUndefined<TTrial>;
  isArchived: boolean;
  archivedAt: TMaybeUndefined<Date>;
  siteUrl: string;
};

export type TPlatformTenant = TPlatformTenantSummary & {
  entitlements: TTenantEntitlements;
  grantedEntitlements: TGrantedEntitlements;
  pageAccess: TPlanPageAccess;
};

/** For a list of tenants, which needs no grants read; a page acting on one tenant takes `toPlatformTenant`. */
export const toPlatformTenantSummary = (
  tenant: TTenant,
  now: Date = new Date(),
): TPlatformTenantSummary => {
  const { deprovisionedAt, primaryDomain } = tenant;

  return {
    ...tenant,
    trial: trialFor(tenant, now),
    isArchived: Boolean(deprovisionedAt),
    archivedAt: deprovisionedAt ?? undefined,
    siteUrl: tenantSiteUrl(primaryDomain),
  };
};

export const toPlatformTenant = (
  tenant: TTenant,
  grants: readonly TResolvableGrant[],
  now: Date = new Date(),
): TPlatformTenant => {
  const entitlements = resolveTenantEntitlements(tenant.plan, grants, now);

  return {
    ...toPlatformTenantSummary(tenant, now),
    entitlements,
    grantedEntitlements: grantedEntitlements(tenant.plan, grants, now),
    pageAccess: entitlementPageAccess(entitlements),
  };
};
