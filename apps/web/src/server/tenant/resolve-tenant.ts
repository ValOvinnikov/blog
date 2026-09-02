import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

/**
 * resolveTenant — host→tenant lookup against `tenant_domains`, returning the
 * full tenant row (not just its id) so callers needing more than the id —
 * `primaryDomain`, Sanity credentials — don't have to re-fetch it a second
 * time. Outside production (local dev, Vercel preview deployments — neither
 * has a real custom domain pointed at `tenant_domains`), an unmatched host
 * falls back to the sole `tenants` row when exactly one exists, preserving
 * the single-tenant dev experience with no extra config. In production an
 * unmatched host resolves to `undefined` — callers must never substitute
 * another tenant's data for it.
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
  if (tenant) return tenant;

  if (isProductionEnvironment()) return undefined;

  return resolveSoleTenant();
};

const resolveSoleTenant = async (): Promise<TTenant | undefined> => {
  const tenants = await queries.tenants.listTenants();
  return tenants.length === 1 ? tenants[0] : undefined;
};
