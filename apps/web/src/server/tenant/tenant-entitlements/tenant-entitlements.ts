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
import { ONE_HOUR_IN_SECONDS } from '@web/constants/time';
import {
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from '@web/utils/tenant-cache-tags';
import { toMaybeDate } from '@web/utils/to-maybe-date';
import { unstable_cache } from 'next/cache';

type TCachedGrant = TMaybeJsonDates<TResolvableGrant>;

type TEntitlementRows = { plan: TTenantPlan; grants: TCachedGrant[] };

const toCachedGrant = ({
  kind,
  key,
  value,
  expiresAt,
  revokedAt,
}: TResolvableGrant): TCachedGrant => ({
  kind,
  key,
  value,
  expiresAt,
  revokedAt,
});

const loadEntitlementRows = async (
  tenantId: string,
): Promise<TMaybeUndefined<TEntitlementRows>> => {
  const [tenant, grants] = await Promise.all([
    queries.tenants.getTenantById(tenantId, { includeArchived: true }),
    queries.tenantEntitlementGrants.listEntitlementGrants(tenantId),
  ]);

  return tenant && { plan: tenant.plan, grants: grants.map(toCachedGrant) };
};

const getCachedEntitlementRows = (tenantId: string) =>
  unstable_cache(loadEntitlementRows, ['tenant-entitlements', tenantId], {
    tags: [buildTenantPlanCacheTag(tenantId)],
    revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
  })(tenantId);

// The proxy's cache is its own, so a lapse is the only refresh guaranteed to reach it.
const getProxyCachedEntitlementRows = (tenantId: string) =>
  unstable_cache(loadEntitlementRows, ['proxy-tenant-entitlements', tenantId], {
    tags: [buildSiteConfigCacheTag(tenantId)],
    revalidate: ONE_HOUR_IN_SECONDS,
  })(tenantId);

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

export const getCachedTenantEntitlements = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenantEntitlements>> => {
  const rows = await getCachedEntitlementRows(tenantId);
  return rows && resolveRows(rows.plan, rows.grants);
};

/** For a caller already holding the tenant row, whose plan is fresher than the cached one. */
export const resolveTenantPlanEntitlements = async (
  tenantId: string,
  plan: TTenantPlan,
): Promise<TTenantEntitlements> =>
  resolveRows(plan, (await getCachedEntitlementRows(tenantId))?.grants);

export const resolveProxyTenantPlanEntitlements = async (
  tenantId: string,
  plan: TTenantPlan,
): Promise<TTenantEntitlements> =>
  resolveRows(plan, (await getProxyCachedEntitlementRows(tenantId))?.grants);
