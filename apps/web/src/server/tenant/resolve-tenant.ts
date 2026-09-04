import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

import { isTenantServable } from './is-tenant-servable';

/**
 * resolveTenant — host→tenant lookup against `tenant_domains`, returning the
 * full tenant row (not just its id) so callers needing more than the id —
 * `primaryDomain`, Sanity credentials — don't have to re-fetch it a second
 * time. A host matching a row that isn't `isTenantServable` (archived, or
 * still mid-provisioning with no Sanity credentials) resolves to `undefined`
 * exactly like an unmatched host — never the sole-tenant dev fallback below,
 * which exists for "no domain matched", not "a matched tenant is refused".
 *
 * Outside production (local dev, Vercel preview deployments — neither has a
 * real custom domain pointed at `tenant_domains`), a truly unmatched host
 * falls back to the sole `tenants` row when exactly one exists and it is
 * itself servable, preserving the single-tenant dev experience with no extra
 * config. In production an unmatched host resolves to `undefined` — callers
 * must never substitute another tenant's data for it.
 *
 * Gated by `isProductionEnvironment()`, not `NODE_ENV` — `NODE_ENV` is
 * `production` on every Vercel build, dev deployment included, so it can't
 * tell the live `blog-dev` deployment apart from real production (see that
 * function's own docs).
 */
export const resolveTenant = async (
  host: string | null,
): Promise<TTenant | undefined> => {
  const tenant = host
    ? await queries.tenantDomains.getTenantByDomain(host)
    : undefined;
  if (tenant) {
    return isTenantServable(tenant) ? tenant : undefined;
  }

  if (isProductionEnvironment()) return undefined;

  return resolveSoleTenant();
};

const resolveSoleTenant = async (): Promise<TTenant | undefined> => {
  const tenants = await queries.tenants.listTenants();
  if (tenants.length !== 1) return undefined;

  const [tenant] = tenants;
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

/**
 * resolveTenantById — the `[tenant]` route param's counterpart to
 * `resolveTenant`'s `Host`-based lookup: given the tenant id `proxy.ts`
 * already validated and wrote onto the path, returns the full tenant row.
 * No sole-tenant dev fallback — an id that fails to resolve is a data
 * integrity gap, not "no host matched".
 */
export const resolveTenantById = async (
  tenantId: string,
): Promise<TTenant | undefined> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};
