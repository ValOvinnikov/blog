import { queries, type TTenantPlan } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { unstable_cache } from 'next/cache';

import { resolveCachedTenantId } from './resolve-cached-tenant-id';

const TENANT_PLAN_CACHE_TAG = 'tenant-plan';
const TENANT_PLAN_REVALIDATE_SECONDS = 3600;

const getCachedTenantPlan = unstable_cache(
  async (): Promise<TTenantPlan | undefined> => {
    const tenantId = await resolveCachedTenantId();
    if (!tenantId) return undefined;

    const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);
    return tenant?.plan;
  },
  ['tenant-plan'],
  {
    tags: [TENANT_PLAN_CACHE_TAG],
    revalidate: TENANT_PLAN_REVALIDATE_SECONDS,
  },
);

/**
 * getTenantPlan — the `TENANT_PLAN` half of capability entitlement
 * (`isCapabilityEnabled`), cached the same way `site_config`/
 * `settings_features` are: a tenant's plan changes about as rarely as its
 * preset, so there's no reason to force every render site checking it into
 * dynamic rendering.
 */
export const getTenantPlan = safeAsync(getCachedTenantPlan);
