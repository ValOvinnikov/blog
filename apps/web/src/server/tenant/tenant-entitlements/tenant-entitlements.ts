import {
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TMaybeJsonDates,
  type TMaybeUndefined,
} from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { TENANT_ENTITLEMENTS_LOG } from '@web/constants/tenant-entitlements';
import { ONE_HOUR_IN_SECONDS } from '@web/constants/time';
import { logger } from '@web/utils/logger/logger';
import {
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from '@web/utils/tenant-cache-tags';
import { toMaybeDate } from '@web/utils/to-maybe-date';
import { unstable_cache } from 'next/cache';

type TCachedGrant = TMaybeJsonDates<TResolvableGrant>;

type TEntitlementRows = { plan: TTenantPlan; grants: TCachedGrant[] };

const loadEntitlementRows = async (
  tenantId: string,
): Promise<TMaybeUndefined<TEntitlementRows>> => {
  const [tenant, grants] = await Promise.all([
    queries.tenants.getTenantById(tenantId, { includeArchived: true }),
    queries.tenantEntitlementGrants.listResolvableEntitlementGrants(tenantId),
  ]);

  return tenant && { plan: tenant.plan, grants };
};

const getCachedEntitlementRows = (tenantId: string) =>
  unstable_cache(loadEntitlementRows, ['tenant-entitlements', tenantId], {
    tags: [buildTenantPlanCacheTag(tenantId)],
    revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
  })(tenantId);

// The proxy's cache is its own, so a lapse is the only refresh guaranteed to reach it.
const getProxyCachedGrants = (tenantId: string): Promise<TCachedGrant[]> =>
  unstable_cache(
    queries.tenantEntitlementGrants.listResolvableEntitlementGrants,
    ['proxy-tenant-entitlement-grants', tenantId],
    {
      tags: [buildSiteConfigCacheTag(tenantId)],
      revalidate: ONE_HOUR_IN_SECONDS,
    },
  )(tenantId);

const reviveGrant = ({
  expiresAt,
  revokedAt,
  ...grant
}: TCachedGrant): TResolvableGrant => ({
  ...grant,
  expiresAt: toMaybeDate(expiresAt),
  revokedAt: toMaybeDate(revokedAt),
});

// Resolved against the clock on every call, never at cache fill, so a grant stops applying the moment it expires.
const resolveRows = (
  plan: TTenantPlan,
  grants: TMaybeUndefined<TCachedGrant[]>,
): TTenantEntitlements =>
  resolveTenantEntitlements(plan, (grants ?? []).map(reviveGrant), new Date());

// A failed grants read resolves the plan alone, so routing fails closed rather than taking the site down.
const resolvePlanWithGrants = async (
  plan: TTenantPlan,
  readGrants: () => Promise<TMaybeUndefined<TCachedGrant[]>>,
): Promise<TTenantEntitlements> => {
  try {
    return resolveRows(plan, await readGrants());
  } catch (error) {
    logger.error(TENANT_ENTITLEMENTS_LOG.GRANTS_FETCH_FAILED, { error });
    return resolveRows(plan, []);
  }
};

export const getCachedTenantEntitlements = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantEntitlements>> => {
  const rows = await getCachedEntitlementRows(tenantId);
  return rows && resolveRows(rows.plan, rows.grants);
};

/** For a caller already holding the tenant row, whose plan is fresher than the cached one. */
export const resolveTenantPlanEntitlements = (
  tenantId: string,
  plan: TTenantPlan,
): Promise<TTenantEntitlements> =>
  resolvePlanWithGrants(
    plan,
    async () => (await getCachedEntitlementRows(tenantId))?.grants,
  );

export const resolveProxyTenantPlanEntitlements = (
  tenantId: string,
  plan: TTenantPlan,
): Promise<TTenantEntitlements> =>
  resolvePlanWithGrants(plan, () => getProxyCachedGrants(tenantId));
